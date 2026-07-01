export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export type OperationType = 'MULTIPLICATION' | 'DIVISION';

export type ExamType = 'DIAGNOSTIC' | 'WEEKLY' | 'MONTHLY' | 'MASTERY' | 'POST_TEST' | 'MONITORING';

export interface UserSession {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export interface HeatmapCell {
  operand1: number;
  operand2: number;
  correctCount: number;
  totalCount: number;
  accuracy: number; // percentage (0 - 100)
  avgResponseTime: number; // in milliseconds
  status: 'master' | 'practice' | 'weak'; // green, orange, red
}

export interface MasteryHeatmapData {
  operationType: OperationType;
  studentId: string;
  cells: HeatmapCell[];
}

export interface StudentDashboardSummary {
  studentId: string;
  nama: string;
  kelas: string;
  school: string;
  accuracyScore: number; // current accuracy %
  accuracyTrend: number; // difference from initial pre-test
  speedScore: number; // average response time in seconds
  speedTrend: number; // difference from initial speed
  activityScore: number; // activity score index
  streakDays: number; // current daily streak
}
