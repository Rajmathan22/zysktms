import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    BackHandler,
    Easing,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- UI Constants for a Refreshed Theme ---
const COLORS = {
  primary: '#5E5CE6', // A vibrant purple
  secondary: '#34C759', // A bright, successful green
  text: '#1C1C1E',
  textSecondary: '#8A8A8E',
  backgroundStart: '#F7F7F7',
  backgroundEnd: '#E9ECF5',
  white: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.4)', // For the glass effect
  shadow: 'rgba(94, 92, 230, 0.15)', // A soft shadow matching the primary color
  warning: '#FFD60A', // A richer, warmer yellow
};

const SIZES = {
  padding: 24,
  radius: 24,
};

const RATING_LABELS = ["", "Not Great", "It Was Okay", "Good", "Great!", "Loved It!"];

// --- Main Component ---
export default function FeedbackScreen() {
  const router = useRouter();
  const [feedbackData, setFeedbackData] = useState({ rating: 0, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCommentFocused, setIsCommentFocused] = useState(false);

  // --- Animation Values ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const starAnimations = useRef([1,2,3,4,5].map(() => new Animated.Value(1))).current;

  // Animate the selected star with a "pop"
  const animateStar = (rating: number) => {
    const starIndex = rating - 1;
    if (starIndex < 0) return;
    
    starAnimations[starIndex].setValue(0.8);
    Animated.spring(starAnimations[starIndex], {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  
  // Prevent back navigation
  useFocusEffect(
    useCallback(() => {
      const backAction = () => { router.replace('/'); return true; };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }, [router])
  );

  const handleFeedbackSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    router.replace('/');
    setIsSubmitting(false);
  };

  const handleRatingSelect = (rating: number) => {
    setFeedbackData(prev => ({ ...prev, rating }));
    animateStar(rating);
  };

  return (
    <LinearGradient
      colors={[COLORS.backgroundStart, COLORS.backgroundEnd]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
        
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* --- Success Header with Illustration --- */}
          <Animated.View style={[styles.successHeader, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={COLORS.secondary} />
            </View>
            <Text style={styles.successTitle}>Submission Successful!</Text>
            <Text style={styles.successSubtitle}>Thanks for completing the assessment.</Text>
          </Animated.View>

          {/* --- Feedback Form (Glassmorphism) --- */}
          <Animated.View style={[styles.feedbackCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackTitle}>How was your experience?</Text>
            </View>
            
            {/* --- Animated Star Rating Section --- */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star, index) => (
                <Pressable key={star} onPress={() => handleRatingSelect(star)}>
                  <Animated.View style={{ transform: [{ scale: starAnimations[index] }]}}>
                    <Ionicons
                      name={star <= feedbackData.rating ? "star" : "star-outline"}
                      size={38}
                      color={star <= feedbackData.rating ? COLORS.warning : COLORS.textSecondary}
                    />
                  </Animated.View>
                </Pressable>
              ))}
            </View>
            <Text style={styles.ratingText}>
              {RATING_LABELS[feedbackData.rating] || 'Rate your experience'}
            </Text>
            
            {/* --- Comment Section --- */}
            <TextInput
              style={[ styles.commentInput, isCommentFocused && styles.commentInputFocused ]}
              multiline
              placeholder="Any thoughts on how we can improve?"
              placeholderTextColor={COLORS.textSecondary}
              value={feedbackData.comment}
              onChangeText={(text) => setFeedbackData(prev => ({ ...prev, comment: text }))}
              onFocus={() => setIsCommentFocused(true)}
              onBlur={() => setIsCommentFocused(false)}
            />
          </Animated.View>

          {/* --- Action Buttons --- */}
          <Animated.View style={[styles.actionButtonsContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Pressable 
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed
              ]} 
              onPress={handleFeedbackSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <LinearGradient
                  colors={['#706CF0', '#5E5CE6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Submit Feedback</Text>
                  <Ionicons name="arrow-forward-outline" size={20} color={COLORS.white} />
                </LinearGradient>
              )}
            </Pressable>
            
            <Pressable onPress={() => router.replace('/')} disabled={isSubmitting}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}


// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SIZES.padding,
    paddingBottom: 40,
  },
  
  // --- Header ---
  successHeader: {
    alignItems: "center",
    paddingTop: 40,
    marginBottom: 20,
  },
  successIconContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 17,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  
  // --- Glassmorphic Card ---
  feedbackCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // Semi-transparent background
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 10,
  },
  feedbackHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
  },
  
  // --- Rating ---
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    height: 22, // Prevents layout shift
  },
  
  // --- Comment ---
  commentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  commentInputFocused: {
    borderColor: 'rgba(94, 92, 230, 0.5)',
    backgroundColor: COLORS.white,
  },
  
  // --- Buttons ---
  actionButtonsContainer: {
    alignItems: 'center',
  },
  submitButton: {
    width: '100%',
    borderRadius: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 20,
  },
  submitButtonPressed: {
    transform: [{ scale: 0.98 }], // Press-in effect
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 18,
    gap: 10,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "600",
  },
  skipButtonText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "500",
  },
});