export type UALCohort = 'Level 2' | 'Level 3A' | 'Level 3B';

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
  dowdBucksReward?: number;
}

export interface ProjectBrief {
  id: string;
  projectNumber?: string;
  title: string;
  unit: string; // e.g., "Unit 1: Introduction to Music Performance"
  cohort: UALCohort;
  introduction: string;
  scenario: string;
  tasks: Task[];
  learningOutcomes: LearningOutcome[];
  assessmentCriteria: AssessmentCriteria[];
  deadline?: string; // ISO Date
  published: boolean;
  gradingScheme?: 'Pass/Fail' | 'Distinction';
  xpReward?: number;
  dowdBucksReward?: number;
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

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'listening' | 'instrument';
  options: { id: string; text: string; isCorrect?: boolean }[];
  correctOptionId: string;
  // For advanced types
  metadata?: {
    interval?: { note1: string; octave1: number; note2: string; octave2: number; label: string }; // For listening
    instrument?: { type: 'guitar' | 'piano'; correctNote: string; correctString?: number; correctFret?: number }; // For visual
    audioUrl?: string; // Optional pre-recorded audio
  };
}

export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string; // Optional cover image
  color?: string; // Hex code for theme
  order?: number; // For sorting
  createdAt: string;
}

export interface Quiz {
  id: string;
  courseId?: string; // Link to a Course
  title: string;
  description: string;
  questions: Question[];
  xpReward: number;
  dowdBucksReward: number;
  projectId?: string; // Optional link to a project
  status: 'draft' | 'published';
  order?: number; // For roadmap sequencing
  createdAt: string;
}

export interface Lesson {
  id: string;
  courseId?: string;
  title: string;
  description: string; // Short description
  content: string; // Markdown or HTML content
  order: number;
  type: 'lesson'; // discriminator
  xpReward: number; // Small reward for reading
  createdAt: string;
}

export type RoadmapItem = (Quiz & { type: 'quiz' }) | Lesson | Walkthrough;

export interface WalkthroughStep {
  id: string;
  title: string;
  content: string; // Markdown text
  mediaUrl?: string; // Image or Video URL
  mediaType?: 'image' | 'video';
}

export interface Walkthrough {
  id: string;
  courseId?: string;
  title: string;
  description: string;
  steps: WalkthroughStep[];
  order: number;
  type: 'walkthrough';
  xpReward: number;
  createdAt: string;
}
