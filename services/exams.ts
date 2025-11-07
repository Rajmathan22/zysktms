import { Colors } from '../constants/Colors';

export type ExamStatus = 'upcoming' |'completed' ;

export interface ExamItem {
  id: string;
  title: string;
  description: string;
  
  thumbnailUrl: string;
  durationMinutes: number;
  status: ExamStatus;
  startsAtIso?: string;
  endsAtIso?: string;
}

export interface FetchExamsResponse {
  items: ExamItem[];
}

const sampleExams: ExamItem[] = [
  {
  id: 'react-native-adv',
  title: 'Advanced React Native',
  description: 'Test your knowledge of hooks, state management, and native module integration.',
  thumbnailUrl: 'https://picsum.photos/id/40/120/160',
  durationMinutes: 60,
  status: 'upcoming',
  startsAtIso: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Starts in 2 days
  endsAtIso: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
  },
  {
  id: 'python-ds',
  title: 'Python Data Structures',
  description: 'An assessment on algorithms, complexity, and core data structures.',
  thumbnailUrl: 'https://picsum.photos/id/201/120/160',
  durationMinutes: 90,
  status: 'upcoming',
  startsAtIso: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), 
  endsAtIso: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), 
  },
  {
  id: 'aws-practitioner',
  title: 'AWS Cloud Practitioner',
  description: 'Fundamental concepts of AWS cloud, services, security, and architecture.',
  thumbnailUrl: 'https://picsum.photos/id/22/120/160',
  durationMinutes: 45,
  status: 'upcoming',
  startsAtIso: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Starts tomorrow
  },
  {
  id: 'sql-fundamentals',
  title: 'SQL Fundamentals',
  description: 'Evaluate your skills in querying databases, joins, and aggregations.',
  thumbnailUrl: 'https://picsum.photos/id/312/120/160',
  durationMinutes: 30,
  status: 'completed',
  endsAtIso: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Ended a week ago
  },
  {
  id: 'nodejs-backend',
  title: 'Node.js & Express API',
  description: 'A comprehensive test on building and securing RESTful APIs with Express.',
  thumbnailUrl: 'https://picsum.photos/id/42/120/160',
  durationMinutes: 75,
  status: 'completed',
  endsAtIso: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Ended 2 days ago
  },
  ];
  

export async function fetchExams(): Promise<FetchExamsResponse> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 500));
  return { items: sampleExams };
}

export function statusDisplay(status: ExamStatus): { label: string; color: string } {
  switch (status) {
    case 'upcoming':
      return { label: 'Upcoming', color: Colors.primary };
    
    case 'completed':
      return { label: 'Completed', color: '#4CAF50' };
    
    default:
      return { label: 'Unknown', color: Colors.grey };
  }
}


