import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  BackHandler,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { fetchAssessmentQuestions } from "../../api/api";
import { DatabaseManager, ExamAnswer } from "../../services/database";

interface Option {
  option_id: number;
  text: string;
}

interface Question {
  exam_id: number;
  question_id: number;
  question: string;
  options: Option[];
}

export default function AssessmentScreen() {
  const [answeredQuestions, setAnsweredQuestions] = useState<{ [key: number]: boolean }>({});
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
  const router = useRouter();
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentQuestionIndexRef = useRef(0);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: number }>({});
  
  // Separate stepper state to prevent re-renders
  const [stepperCurrentIndex, setStepperCurrentIndex] = useState(0);
  const stepperCurrentIndexRef = useRef(0);
  const [databaseManager, setDatabaseManager] = useState<DatabaseManager | null>(null);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Timer state
  const [timeLimit, setTimeLimit] = useState<number>(0); // in seconds
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // in seconds
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<any>(null);
  const timeRemainingRef = useRef<number>(0);
  
  // Completion flow state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showSubmissionAnimation, setShowSubmissionAnimation] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Exam security state
  const [examViolationAttempts, setExamViolationAttempts] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [isExamSecured, setIsExamSecured] = useState(false);
  const [isForcedSubmission, setIsForcedSubmission] = useState(false);
  const modalActiveRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastActiveTime = useRef(Date.now());
  const [isExamCompleted, setIsExamCompleted] = useState(false);

  // Stepper pagination state
  const [stepperPage, setStepperPage] = useState(0);
  const ITEMS_PER_PAGE = 5; // Number of stepper items to show at once

  // Storage keys
  const getStorageKey = () => `assessment_${id}_currentIndex`;
  const getCompletionKey = () => `assessment_${id}_completed`;

  // Load persisted question index
  const loadPersistedIndex = useCallback(async () => {
    try {
      const key = getStorageKey();
      const savedIndex = await AsyncStorage.getItem(key);
      if (savedIndex !== null) {
        const index = parseInt(savedIndex, 10);
        currentQuestionIndexRef.current = index;
        stepperCurrentIndexRef.current = index;
        setCurrentQuestionIndex(index);
        setStepperCurrentIndex(index);
        
        // Set initial stepper page
        const initialPage = Math.floor(index / ITEMS_PER_PAGE);
        setStepperPage(initialPage);
      }
    } catch (error) {
      console.error('Error loading persisted index:', error);
    }
  }, [id, ITEMS_PER_PAGE]);

  // Save current question index to storage
  const saveCurrentIndex = useCallback(async (index: number) => {
    try {
      const key = getStorageKey();
      await AsyncStorage.setItem(key, index.toString());
      currentQuestionIndexRef.current = index;
    } catch (error) {
      console.error('Error saving current index:', error);
    }
  }, [id]);

  // Update current question index with persistence
  const updateCurrentQuestionIndex = useCallback((index: number) => {
    currentQuestionIndexRef.current = index;
    stepperCurrentIndexRef.current = index;
    setCurrentQuestionIndex(index);
    setStepperCurrentIndex(index);
    
    // Update stepper page if needed
    const newPage = Math.floor(index / ITEMS_PER_PAGE);
    setStepperPage(newPage);
    
    saveCurrentIndex(index);
  }, [saveCurrentIndex, ITEMS_PER_PAGE]);

  // Check if exam is already completed (and reconcile with DB state)
  const checkExamCompletion = useCallback(async () => {
    try {
      const completionKey = getCompletionKey();
      const completed = await AsyncStorage.getItem(completionKey);
      if (completed === 'true') {
        // Reconcile with DB: if no table/data exists for this exam, treat as fresh attempt
        if (!id) {
          await AsyncStorage.removeItem(completionKey);
          setIsExamCompleted(false);
          setIsSubmitted(false);
          return false;
        }
        const tempDb = new DatabaseManager(String(id));
        let hasData = false;
        try {
          hasData = await tempDb.checkDatabaseExists();
        } catch (err) {
          console.warn('DB check failed during completion reconciliation, defaulting to not completed:', err);
          hasData = false;
        }
        if (!hasData) {
          await AsyncStorage.removeItem(completionKey);
          setIsExamCompleted(false);
          setIsSubmitted(false);
          return false;
        }
        setIsExamCompleted(true);
        setIsSubmitted(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking exam completion:', error);
      return false;
    }
  }, [id]);

  // Mark exam as completed
  const markExamCompleted = useCallback(async () => {
    try {
      const completionKey = getCompletionKey();
      await AsyncStorage.setItem(completionKey, 'true');
      setIsExamCompleted(true);
    } catch (error) {
      console.error('Error marking exam completed:', error);
    }
  }, [id]);

  // Exam security functions
  const handleExamViolation = useCallback(() => {
    const newAttempts = examViolationAttempts + 1;
    setExamViolationAttempts(newAttempts);
    
    if (newAttempts >= 2) {
      // Max violations reached - force submit
      setIsForcedSubmission(true);
      handleExamCompletion(false, true); // Pass true for forced submission
    } else {
      // Show warning modal
      setShowViolationModal(true);
      modalActiveRef.current = true;
    }
  }, [examViolationAttempts]);

  const handleContinueExam = useCallback(() => {
    setShowViolationModal(false);
    modalActiveRef.current = false;
    // Force timer sync by briefly updating timeRemaining to trigger Timer component sync
    const currentTime = timeRemainingRef.current;
    setTimeRemaining(currentTime);
  }, []);

  const handleForceSubmitExam = useCallback(() => {
    setShowViolationModal(false);
    modalActiveRef.current = false;
    setIsForcedSubmission(true);
    handleExamCompletion(false, true); // Pass true for forced submission
  }, []);

  useEffect(() => {
    if (id) {
      // Check if exam is already completed first
      checkExamCompletion().then((completed) => {
        if (!completed) {
          setDatabaseManager(new DatabaseManager(id));
          loadPersistedIndex();
        }
      });
    }
  }, [id, loadPersistedIndex, checkExamCompletion]);

  useEffect(() => {
    return () => {
      if (databaseManager) {
        databaseManager.closeDatabase();
      }
      // Cleanup timer on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [databaseManager]);

  const clearPreviousData = async (dbManager: DatabaseManager) => {
    try {
      setLoading(true);
      await dbManager.clearAllAnswers();
      setHasExistingData(false);
      setSelectedOptions({});
      // Reset to first question when clearing data
      updateCurrentQuestionIndex(0);
    } catch (error) {
      console.error("Error clearing previous data:", error);
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = async () => {
    if (!databaseManager) return;
    setLoading(true);
    try {
      try {
        await databaseManager.getAllAnswers(); 
      } catch {}

      const exists = await databaseManager.checkDatabaseExists();
      setHasExistingData(exists);
      if (exists) {
        Alert.alert(
          "Resume Exam",
          "You have previous answers saved for this exam. Would you like to resume where you left off?",
          [
            {
              text: "Start Fresh",
              onPress: async () => {
                setLoading(true);
                await clearPreviousData(databaseManager);
                await fetchAndStart();
              },
              style: "destructive",
            },
            {
              text: "Resume",
              onPress: async () => {
                setLoading(true);
                await fetchAndStart(true);
              },
            },
          ]
        );
        setLoading(false);
      } else {
        await fetchAndStart();
      }
    } catch (error) {
      console.error("Failed to check database or fetch questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAndStart = async (resume = false) => {
    try {
      setLoading(true);
      const data = await fetchAssessmentQuestions();
      if (data.results && data.results.length > 0) {
        setQuestions(data.results);
        
        const timeLimitMinutes = data.timeLimit || 30; // Default to 30 minutes if not provided
        const timeLimitSeconds = timeLimitMinutes * 60;
        setTimeLimit(timeLimitSeconds);
        setTimeRemaining(timeLimitSeconds);
        timeRemainingRef.current = timeLimitSeconds;
        
        if (resume && databaseManager) {
          const savedAnswers = await databaseManager.getAllAnswers();
          const savedOptions: { [key: number]: number } = {};
          savedAnswers.forEach((answer: ExamAnswer) => {
            savedOptions[answer.question_id] = answer.selected_option_id;
          });
          setSelectedOptions(savedOptions);
          const unansweredIndex = data.results.findIndex(
            (q: Question) => !savedOptions[q.question_id]
          );
          const targetIndex = unansweredIndex === -1 ? 0 : unansweredIndex;
          if (currentQuestionIndexRef.current === 0 || targetIndex > currentQuestionIndexRef.current) {
            updateCurrentQuestionIndex(targetIndex);
          }
        } else {
          updateCurrentQuestionIndex(0);
        }
        
        setAssessmentStarted(true);
        setIsExamSecured(true);
        setTimeout(() => {
          console.log('Starting timer with', timeLimitSeconds, 'seconds');
          setTimerActive(true);
        }, 100);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = useCallback(async (questionId: number, optionId: number) => {
    setSelectedOptions((prev) => ({ ...prev, [questionId]: optionId }));
    // Persist immediately with safe guards against background/resume
    try {
      if (!databaseManager) return;
      await databaseManager.saveAnswerNoThrow(
        questionId,
        questions[currentQuestionIndex]?.question || '',
        optionId,
        (questions[currentQuestionIndex]?.options || []).find(o => o.option_id === optionId)?.text || ''
      );
    } catch (e) {
      console.error('Error saving answer to database:', e);
    }
  }, [databaseManager, questions, currentQuestionIndex]);

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion && selectedOptions[currentQuestion.question_id]) {
      setAnsweredQuestions((prev) => ({ ...prev, [currentQuestion.question_id]: true }));
    }
    if (currentQuestionIndex < questions.length - 1) {
      updateCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      await handleExamCompletion(false);
    }
  };

  // Log all questions and selected answers
  const logQuestionsAndAnswers = async () => {
    try {
      console.log("=== EXAM COMPLETION LOG ===");
      console.log(`Total Questions: ${questions.length}`);
      console.log(`Time Limit: ${Math.floor(timeLimit / 60)} minutes`);
      console.log(`Time Remaining: ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`);
      
      questions.forEach((question, index) => {
        const selectedOptionId = selectedOptions[question.question_id];
        const selectedOption = question.options.find(opt => opt.option_id === selectedOptionId);
        
        console.log(`Question ${index + 1}:`);
        console.log(`  ID: ${question.question_id}`);
        console.log(`  Question: ${question.question}`);
        console.log(`  Selected Option ID: ${selectedOptionId || 'Not answered'}`);
        console.log(`  Selected Option Text: ${selectedOption?.text || 'Not answered'}`);
        console.log('---');
      });
      
      const answeredCount = Object.keys(selectedOptions).length;
      console.log(`Answered: ${answeredCount}/${questions.length} questions`);
      console.log("=== END LOG ===");
    } catch (error) {
      console.error("Error logging questions and answers:", error);
    }
  };

  const handleExamCompletion = async (isTimeUp = false, isForced = false) => {
    try {
      // Disable exam security when completing
      setIsExamSecured(false);
      
      // Stop the timer
      setTimerActive(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Clear persisted data (index) and drop the per-exam table in shared DB
      if (databaseManager) {
        const key = getStorageKey();
        await AsyncStorage.removeItem(key);
        try {
          await databaseManager.dropExamTable();
          const stillExists = await databaseManager.checkDatabaseExists();
          if (stillExists) {
            await databaseManager.clearAllAnswers();
            console.warn('Exam table still present after drop; cleared rows as fallback');
          }
        } catch (e) {
          console.warn('Failed dropping exam table on completion:', e);
        }
      }
      
      // Log all questions and answers
      await logQuestionsAndAnswers();
      
      setIsTimeUp(isTimeUp);
      setIsForcedSubmission(isForced);
      setIsSubmitted(true);
      
      // Mark exam as completed in persistent storage
      await markExamCompleted();
      
      if (isTimeUp || isForced) {
        // Timer completed or forced submission - go directly to feedback
        setShowSubmissionAnimation(true);
        
        // IMMEDIATELY replace navigation to remove exam screen from stack
        router.replace('/feedback');
        
      } else {
        updateCurrentQuestionIndex(0);
      }
    } catch (error) {
      console.error("Error handling exam completion:", error);
    }
  };
  
  const handleSubmitExam = async () => {
    try {
      if (databaseManager) {
        const key = getStorageKey();
        await AsyncStorage.removeItem(key);
        try {
          await databaseManager.dropExamTable();
          const stillExists = await databaseManager.checkDatabaseExists();
          if (stillExists) {
            await databaseManager.clearAllAnswers();
            console.warn('Exam table still present after drop; cleared rows as fallback');
          }
        } catch (e) {
          console.warn('Failed dropping exam table on submit:', e);
        }
      }
      
      setShowCompletionModal(false);
      setShowSubmissionAnimation(true);
      setIsSubmitted(true);
      
      await markExamCompleted();
      
      
      router.replace('/feedback');
      
      setTimeout(() => {
        setShowSubmissionAnimation(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting exam:", error);
    }
  };
  
  const handleGoToQuestions = () => {
    setShowCompletionModal(false);
  };
  
  // Global back button handler to prevent returning to exam screen
  useEffect(() => {
    if (isSubmitted) {
      // Disable all security listeners since exam is complete
      setIsExamSecured(false);
      
      // Add permanent back button handler to prevent any navigation back to exam
      const preventBackHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // After exam submission, completely block back navigation
        console.log('Back navigation permanently blocked - exam completed');
        // Force stay on current screen (dashboard)
        return true; // Block all back navigation
      });
      
      // This handler should remain active permanently
      return () => {
        preventBackHandler.remove();
      };
    }
  }, [isSubmitted]);
  
  // Additional safety: Block back navigation during exam completion process
  useEffect(() => {
    if (showSubmissionAnimation) {
      const blockBackDuringAnimation = BackHandler.addEventListener('hardwareBackPress', () => {
        console.log('Back navigation blocked during submission animation');
        return true; // Block back navigation during animation
      });
      
      return () => {
        blockBackDuringAnimation.remove();
      };
    }
  }, [showSubmissionAnimation]);
  

  const getQuestionStats = () => {
    const total = questions.length;
    const answered = Object.keys(selectedOptions).length;
    const notAnswered = total - answered;
    return { total, answered, notAnswered };
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      updateCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Memoized stepper items to prevent re-renders
  const stepperItems = useMemo(() => {
    if (questions.length === 0) return [];
    
    const startIndex = stepperPage * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, questions.length);
    
    return questions.slice(startIndex, endIndex).map((q, relativeIdx) => {
      const actualIdx = startIndex + relativeIdx;
      const isAnswered = selectedOptions[q.question_id] !== undefined;
      const isCurrent = actualIdx === stepperCurrentIndexRef.current;
      
      return {
        questionId: q.question_id,
        index: actualIdx,
        displayNumber: actualIdx + 1,
        isAnswered,
        isCurrent
      };
    });
  }, [questions, stepperPage, selectedOptions, stepperCurrentIndex, ITEMS_PER_PAGE]);
  
  // Calculate total pages
  const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE);
  
  // Stepper navigation functions
  const goToPreviousPage = useCallback(() => {
    if (stepperPage > 0) {
      setStepperPage(prev => prev - 1);
    }
  }, [stepperPage]);
  
  const goToNextPage = useCallback(() => {
    if (stepperPage < totalPages - 1) {
      setStepperPage(prev => prev + 1);
    }
  }, [stepperPage, totalPages]);

  // Timer countdown effect - updates every second
  useEffect(() => {
    console.log('Timer effect triggered:', { timerActive, timeRemaining });
    if (timerActive && timeRemainingRef.current > 0) {
      console.log('Starting interval timer');
      timerRef.current = setInterval(() => {
        timeRemainingRef.current -= 1;
        console.log('Timer tick:', timeRemainingRef.current);
        
        // Update state to trigger re-render of Timer component
        setTimeRemaining(timeRemainingRef.current);
        
        // Stop timer when it reaches 0
        if (timeRemainingRef.current <= 0) {
          console.log('Timer finished!');
          setTimerActive(false);
          clearInterval(timerRef.current);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive]);

  // Handle timer completion when time reaches 0
  useEffect(() => {
    if (timeRemaining === 0 && timeLimit > 0) {
      handleExamCompletion(true);
    }
  }, [timeRemaining, timeLimit]);

  // Exam security listeners - comprehensive monitoring
  useEffect(() => {
    if (!isExamSecured) return;

    // Back button handler - more aggressive monitoring
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If violation modal is already showing, this is a repeated violation
      if (modalActiveRef.current) {
        // Force submit immediately on repeated violation during modal
        modalActiveRef.current = false;
        setShowViolationModal(false);
        setIsForcedSubmission(true);
        handleExamCompletion(false, true);
      } else {
        // First violation - show modal
        handleExamViolation();
      }
      return true; // Prevent default back action
    });

    // Enhanced app state handler - catches ALL exit methods
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('AppState changed from', appStateRef.current, 'to', nextAppState);
      
      // Update refs
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;
      
      // Detect any transition away from active state
      if (previousState === 'active' && (nextAppState === 'background' || nextAppState === 'inactive')) {
        console.log('App backgrounded - violation detected');
        
        // If violation modal is already showing, this is a repeated violation
        if (modalActiveRef.current) {
          console.log('Repeated violation during modal - force submit');
          // Force submit immediately on repeated violation during modal
          modalActiveRef.current = false;
          setShowViolationModal(false);
          setIsForcedSubmission(true);
          handleExamCompletion(false, true);
        } else {
          console.log('First violation - show modal');
          // First violation - show modal
          handleExamViolation();
        }
      }
      
      // Update last active time when app becomes active
      if (nextAppState === 'active') {
        lastActiveTime.current = Date.now();
      }
    };

    // Additional focus/blur monitoring for web-like behavior
    const handleFocus = () => {
      console.log('App gained focus');
      appStateRef.current = 'active';
      lastActiveTime.current = Date.now();
    };

    const handleBlur = () => {
      console.log('App lost focus - potential violation');
      // Treat focus loss as backgrounding
      if (appStateRef.current === 'active') {
        handleAppStateChange('background');
      }
    };

    // Listen to multiple event sources for comprehensive coverage
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Additional event listeners for better coverage
    const focusSubscription = AppState.addEventListener('focus', handleFocus);
    const blurSubscription = AppState.addEventListener('blur', handleBlur);

    // Periodic check for app state consistency
    const stateCheckInterval = setInterval(() => {
      const currentState = AppState.currentState;
      if (currentState !== appStateRef.current) {
        console.log('State inconsistency detected:', appStateRef.current, '->', currentState);
        handleAppStateChange(currentState);
      }
    }, 1000); // Check every second

    return () => {
      backHandler.remove();
      appStateSubscription?.remove();
      focusSubscription?.remove();
      blurSubscription?.remove();
      clearInterval(stateCheckInterval);
    };
  }, [isExamSecured, handleExamViolation]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Isolated Timer component - displays time from parent state
  const Timer = React.memo(() => {
    const getTimerColor = () => {
      const currentTime = timeRemainingRef.current || timeRemaining;
      const percentage = (currentTime / timeLimit) * 100;
      if (percentage <= 10) return '#DC3545'; // Red
      if (percentage <= 25) return '#FFC107'; // Yellow
      return '#28A745'; // Green
    };
    
    const timerColor = getTimerColor();
    const displayTime = formatTime(timeRemainingRef.current || timeRemaining);
    
    return (
      <View className="items-center">
        <View className="flex-row items-center bg-white px-2 py-1 rounded-xl border-[1.5px] shadow-sm" style={{ borderColor: timerColor }}>
          <Ionicons name="time-outline" size={14} color={timerColor} />
          <Text className="text-[13px] font-semibold ml-1" style={{ color: timerColor }}>
            {displayTime}
          </Text>
        </View>
      </View>
    );
  });

  // Completion Modal Component - memoized to prevent re-renders
  const CompletionModal = React.memo(() => {
    const stats = getQuestionStats();
    
    return (
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-[20px] p-6 w-full max-w-[400px] shadow-2xl">
            <View className="items-center mb-6">
              <Ionicons name="checkmark-circle" size={48} color="#28A745" />
              <Text className="text-2xl font-bold text-gray-900 mt-3 text-center">Exam Completed!</Text>
            </View>
            
            <View className="flex-row justify-around mb-6 py-4 bg-gray-50 rounded-xl">
              <View className="items-center">
                <Text className="text-[28px] font-bold text-gray-900">{stats.total}</Text>
                <Text className="text-xs text-gray-500 mt-1 text-center">Total Questions</Text>
              </View>
              <View className="items-center">
                <Text className="text-[28px] font-bold text-green-600">{stats.answered}</Text>
                <Text className="text-xs text-gray-500 mt-1 text-center">Answered</Text>
              </View>
              <View className="items-center">
                <Text className="text-[28px] font-bold text-red-600">{stats.notAnswered}</Text>
                <Text className="text-xs text-gray-500 mt-1 text-center">Not Answered</Text>
              </View>
            </View>
            
            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 flex-row items-center justify-center py-3.5 px-5 rounded-xl gap-2 bg-white border-2 border-blue-500" 
                onPress={handleGoToQuestions}
              >
                <Ionicons name="arrow-back" size={20} color="#007BFF" />
                <Text className="text-blue-500 text-base font-semibold">Go to Questions</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 flex-row items-center justify-center py-3.5 px-5 rounded-xl gap-2 bg-blue-500" 
                onPress={handleSubmitExam}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
                <Text className="text-white text-base font-semibold">Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  });

  // Submission Animation Component
  const SubmissionAnimation = () => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      if (showSubmissionAnimation) {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [showSubmissionAnimation]);
    
    return (
      <Modal
        visible={showSubmissionAnimation}
        transparent={true}
        animationType="none"
      >
        <View className="flex-1 bg-black/70 justify-center items-center">
          <Animated.View 
            className="bg-white rounded-[20px] p-10 items-center shadow-2xl"
            style={{
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            }}
          >
            <Ionicons 
              name={isForcedSubmission ? "warning" : "checkmark-circle"} 
              size={80} 
              color={isForcedSubmission ? "#DC3545" : "#28A745"} 
            />
            <Text className="text-2xl font-bold text-gray-900 mt-4 text-center">
              {isForcedSubmission ? "Exam Terminated!" : isTimeUp ? "Time Up!" : "Answers Submitted!"}
            </Text>
            <Text className="text-base text-gray-500 mt-2 text-center leading-5">
              {isForcedSubmission ? "Your exam has been terminated due to policy violations. Redirecting to dashboard..." : isTimeUp ? "Your exam has been automatically submitted. Redirecting to dashboard..." : "Your answers have been successfully submitted. Redirecting to feedback..."}
            </Text>
            <View className="flex-row mt-6 gap-2">
              <View className="w-2 h-2 rounded-full bg-blue-500" />
              <View className="w-2 h-2 rounded-full bg-blue-500" />
              <View className="w-2 h-2 rounded-full bg-blue-500" />
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // Violation Warning Modal Component - memoized to prevent re-renders
  const ViolationWarningModal = React.memo(() => {
    const remainingAttempts = 2 - examViolationAttempts;
    
    return (
      <Modal
        visible={showViolationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}} // Prevent dismissing with back button
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-[20px] p-6 w-full max-w-[400px] shadow-2xl">
            <View className="items-center mb-6">
              <Ionicons name="warning" size={48} color="#DC3545" />
              <Text className="text-2xl font-bold text-gray-900 mt-3 text-center">Exam Policy Violation</Text>
            </View>
            
            <View className="mb-6 py-4">
              <Text className="text-base text-gray-900 text-center mb-4 leading-5">
                You attempted to exit the exam, which violates the exam policies.
              </Text>
              <Text className="text-base text-red-600 text-center mb-3 font-semibold">
                Remaining attempts: <Text className="text-lg font-bold text-red-600">{remainingAttempts}</Text>
              </Text>
              <Text className="text-sm text-gray-500 text-center italic leading-5">
                ⚠️ WARNING: Any attempt to minimize, background, or exit the app while this modal is open will result in immediate exam termination.
              </Text>
              <Text className="text-sm text-gray-500 text-center italic leading-5">
                If you exceed the maximum violations, your exam will be automatically submitted.
              </Text>
            </View>
            
            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 flex-row items-center justify-center py-3.5 px-5 rounded-xl gap-2 bg-blue-500" 
                onPress={handleContinueExam}
              >
                <Ionicons name="play" size={20} color="#FFFFFF" />
                <Text className="text-white text-base font-semibold">Continue Exam</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 flex-row items-center justify-center py-3.5 px-5 rounded-xl gap-2 bg-red-600" 
                onPress={handleForceSubmitExam}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
                <Text className="text-white text-base font-semibold">Submit & End Exam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  });


  // Force redirect if exam is already completed
  useEffect(() => {
    if (isSubmitted || isExamCompleted) {
      // Immediately redirect to feedback if exam is completed
      console.log('Exam already completed - redirecting to feedback');
      router.replace('/feedback');
    }
  }, [isSubmitted, isExamCompleted, router]);
  
  // Prevent rendering exam screen if already completed
  if (isSubmitted || isExamCompleted) {
    return null; // Don't render anything
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Stack.Screen options={{ title: name ? String(name) : "Assessment" }} />
        <Ionicons name="cloud-download-outline" size={64} color="#007BFF" />
        <Text className="mt-4 text-lg text-blue-500 font-semibold">Loading Assessment...</Text>
      </SafeAreaView>
    );
  }

  if (assessmentStarted) {
    const currentQuestion = questions[currentQuestionIndex];

    const Stepper = React.memo(() => (
      <View className="pb-4 border-b border-gray-300 mb-4">
        <View className="flex-row justify-between items-center px-4 py-2 mb-3">
          <TouchableOpacity 
            className={`p-2 rounded-md bg-gray-50 border border-gray-300 ${stepperPage === 0 ? 'opacity-50' : ''}`}
            onPress={goToPreviousPage}
            disabled={stepperPage === 0}
          >
            <Ionicons name="chevron-back" size={16} color={stepperPage === 0 ? "#CCC" : "#007BFF"} />
          </TouchableOpacity>
          
          <Text className="text-sm font-semibold text-gray-700">
            Section {stepperPage + 1} of {totalPages}
          </Text>
          
          <TouchableOpacity 
            className={`p-2 rounded-md bg-gray-50 border border-gray-300 ${stepperPage === totalPages - 1 ? 'opacity-50' : ''}`}
            onPress={goToNextPage}
            disabled={stepperPage === totalPages - 1}
          >
            <Ionicons name="chevron-forward" size={16} color={stepperPage === totalPages - 1 ? "#CCC" : "#007BFF"} />
          </TouchableOpacity>
        </View>
        
        <View className="flex-row justify-evenly items-center px-4 min-h-[50px]">
          {stepperItems.map((item) => (
            <TouchableOpacity
              key={item.questionId}
              onPress={() => updateCurrentQuestionIndex(item.index)}
              className="mx-1"
              activeOpacity={0.7}
            >
              <View
                className={`w-[38px] h-[38px] rounded-lg justify-center items-center border-2 ${
                  item.isCurrent 
                    ? 'bg-indigo-500 border-indigo-500' 
                    : item.isAnswered 
                    ? 'bg-white border-green-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`font-bold text-base ${
                    item.isCurrent 
                      ? 'text-white' 
                      : item.isAnswered 
                      ? 'text-green-600' 
                      : 'text-gray-700'
                  }`}
                >
                  {item.displayNumber}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ));

    return (
      <SafeAreaView className="flex-1 px-5 py-4 bg-gray-50">
        <Stack.Screen options={{ title: name ? String(name) : "Assessment" }} />
        <Stepper />
        <View className="items-center mb-3">
          <Timer />
        </View>
        <Text className="text-center text-gray-500 font-semibold text-base mb-5">{`Question ${currentQuestionIndexRef.current + 1} of ${questions.length}`}</Text>

        <ScrollView>
          <View className="bg-white rounded-2xl p-5 mb-6 min-h-[120px] justify-center shadow-sm">
            <Text className="text-xl font-semibold text-gray-900 leading-7">{currentQuestion?.question}</Text>
          </View>
          <View className="flex-1">
            {currentQuestion?.options?.map((option) => {
              const isSelected =
                selectedOptions[currentQuestion.question_id] === option.option_id;
              return (
                <TouchableOpacity
                  key={option.option_id}
                  className={`flex-row items-center justify-between bg-white p-4 rounded-xl mb-3 border-2 shadow-sm ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onPress={() =>
                    handleOptionSelect(currentQuestion.question_id, option.option_id)
                  }
                >
                  <Text
                    className={`text-base flex-1 mr-2.5 ${
                      isSelected ? 'font-bold text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    {option.text}
                  </Text>
                  {isSelected ? (
                    <View className="w-6 h-6 rounded-full bg-blue-500 justify-center items-center">
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <CompletionModal />
        <SubmissionAnimation />
        <ViolationWarningModal />

        <View className="flex-row justify-between pt-4 border-t border-gray-200 bg-gray-50">
          <TouchableOpacity
            className={`flex-row items-center justify-center py-[15px] px-5 rounded-[30px] shadow-md bg-white border border-gray-300 ${
              currentQuestionIndex === 0 ? 'opacity-50' : ''
            }`}
            onPress={handlePrevious}
            disabled={currentQuestionIndex === 0}
          > 
            <Ionicons name="arrow-back" size={18} color="#212529" style={{ marginRight: 6 }} />
            <Text className="text-gray-900 text-base font-bold">Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center justify-center py-[15px] px-5 rounded-[30px] shadow-md bg-blue-500" onPress={handleNext}>
            <Text className="text-white text-base font-bold">
              {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
            </Text>
            {currentQuestionIndex !== questions.length - 1 && (
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 px-5 py-4 bg-gray-50">
      <Stack.Screen options={{ title: name ? String(name) : "Assessment" }} />
      <Text className="text-[32px] font-bold text-gray-900 mb-2">Assessment Ready</Text>
      <Text className="text-base text-gray-500 mb-8">
        {name ? `You are about to start: ${name}` : "No exam selected"}
      </Text>
      <View className="bg-white rounded-2xl p-5 mb-6 shadow-md">
        <View className="flex-row items-center mb-3">
          <Ionicons name="time-outline" size={20} color="#007BFF" style={{ marginRight: 10 }} />
          <Text className="text-base font-semibold text-gray-700">Duration: </Text>
          <Text className="text-base text-gray-700">30 minutes</Text>
        </View>
        <View className="flex-row items-center mb-3">
          <Ionicons name="list-outline" size={20} color="#28A745" style={{ marginRight: 10 }} />
          <Text className="text-base font-semibold text-gray-700">Questions: </Text>
          <Text className="text-base text-gray-700">20</Text>
        </View>
        {hasExistingData && (
          <View className="flex-row items-center mb-3">
            <Ionicons name="save-outline" size={20} color="#FFC107" style={{ marginRight: 10 }} />
            <Text className="text-base font-semibold text-gray-700">Status: </Text>
            <Text className="text-base text-yellow-500 font-semibold">
              In Progress
            </Text>
          </View>
        )}
        <View className="flex-row items-center mt-4 mb-0">
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#6C757D"
            style={{ marginRight: 10 }}
          />
          <Text className="text-sm text-gray-500 flex-1 leading-5">
            The timer will start once you begin and cannot be paused.
          </Text>
        </View>
      </View>
      <View className="mt-auto pb-4 gap-4">
        <TouchableOpacity className="flex-row items-center justify-center py-[15px] px-5 rounded-[30px] shadow-md bg-blue-500" onPress={startAssessment}>
          <Ionicons name="play-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text className="text-white text-base font-bold">Start Assessment</Text>
        </TouchableOpacity>
        {hasExistingData && (
          <TouchableOpacity
            className="flex-row items-center justify-center py-[15px] px-5 rounded-[30px] shadow-md bg-yellow-400"
            onPress={() => databaseManager && clearPreviousData(databaseManager)}
          >
            <Ionicons name="refresh-outline" size={20} color="#212529" style={{ marginRight: 8 }} />
            <Text className="text-gray-900 text-base font-bold">Clear & Restart</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity className="flex-row items-center justify-center py-[15px] px-5 rounded-[30px] shadow-md bg-white border border-gray-300" onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color="#212529" style={{ marginRight: 8 }} />
          <Text className="text-gray-900 text-base font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}