export type UALLevel = 'Level 2' | 'Level 3';
export type UALYear = 'Year 1' | 'Year 2'; // Only relevant for Level 3

export type Grade = 'Pass' | 'Merit' | 'Distinction' | 'Fail' | 'Referred' | 'Pending';

export interface LearningOutcome {
  id: string; // e.g., "LO1"
  description: string;
}

export interface AssessmentCriteria {
  id: string; // e.g., "1.1"
  outcomeId: string; // References LearningOutcome.id
  description: string;
  grade?: Grade;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  evidenceRequirements: string[]; // What the student needs to submit
  criteriaReferences: string[]; // IDs of AssessmentCriteria met by this task
  deadline?: string; // ISO Date
  status: 'Not Started' | 'In Progress' | 'Submitted' | 'Graded';
  xpReward: number;
}

export interface ProjectBrief {
  id: string;
  projectNumber?: string;
  title: string;
  unit: string; // e.g., "Unit 1: Introduction to Music Performance"
  level: UALLevel;
  year?: UALYear;
  introduction: string;
  scenario: string;
  tasks: Task[];
  learningOutcomes: LearningOutcome[];
  assessmentCriteria: AssessmentCriteria[];
  deadline?: string; // ISO Date
  published: boolean;
}

export interface StudentProgress {
  studentId: string;
  projectBriefId: string;
  taskStatus: Record<string, 'Not Started' | 'In Progress' | 'Submitted' | 'Graded'>; // taskId -> status
  grades: Record<string, Grade>; // criteriaId -> Grade
  feedback: Record<string, string>; // taskId -> Feedback text
}

export type EventCategory = 'Project' | 'Task' | 'School' | 'Personal' | 'External';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO Date String
  endDate?: string;  // ISO Date String
  category: EventCategory;
  relatedId?: string; // ID of Project or Task if relevant
  allDay?: boolean;
  isLocked?: boolean; // If true, only teachers can edit (e.g. Project deadlines)
  externalSource?: 'Google' | 'Outlook';
}

export interface TeacherEvent extends CalendarEvent {
  isShared: boolean; // If true, visible to students in certain cohorts
  targetCohorts?: string[]; // IDs of levels/years if shared
}
