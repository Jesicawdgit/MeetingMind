export interface Task {
  id: string;
  meetingId: string;
  taskDescription: string;
  assigneeName: string;
  deadline: string;
  status: 'pending' | 'completed';
}

export interface ChatHistoryItem {
  id: string;
  meetingId: string;
  userQuery: string;
  aiResponse: string;
  timestamp: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  durationSeconds?: number;
  summary: string;
  risks: string[];
  transcriptText: string;
  sourceType: 'audio' | 'transcript' | 'notes';
  sourceFileName?: string;
  followUpEmail?: string;
  tasks: Task[];
  chatHistory: ChatHistoryItem[];
  userEmail?: string;
}

export interface ProcessingResult {
  title: string;
  summary: string;
  risks: string[];
  transcriptText: string;
  tasks: Array<{
    taskDescription: string;
    assigneeName: string;
    deadline: string;
  }>;
}
