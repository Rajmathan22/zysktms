interface AssessmentOption {
  option_id: number;
  text: string;
}

interface AssessmentQuestion {
  exam_id: number;
  question_id: number;
  question: string;
  options: AssessmentOption[];
}

interface AssessmentResponse {
  results: AssessmentQuestion[];
  timeLimit: number; // in minutes
}


export default AssessmentResponse;