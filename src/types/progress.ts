export type SessionDuration = 5 | 15 | 30;
export type FontFamilyPref = "sans" | "serif";
export type FontSizePref = "comfortable" | "large" | "xlarge";
export type LanguagePref = "en" | "pt";

export interface ChallengeResult {
  attempts: number;
  correct: number;
  lastAttemptAt: string;
  lastWrongAt?: string;
  needsReview: boolean;
}

export interface HighlightItem {
  id: string;
  stepId: string;
  chapterId: string;
  lessonId: string;
  slideTitle: string;
  quote: string;
  createdAt: string;
}

export interface StreakState {
  current: number;
  best: number;
  lastStudyDate: string | null; // YYYY-MM-DD
}

export interface UserPrefs {
  fontFamily: FontFamilyPref;
  fontSize: FontSizePref;
  language: LanguagePref;
}

export interface UserProgress {
  completedStepIds: string[];
  completedLessonIds: string[];
  challengeResults: Record<string, ChallengeResult>;
  bookmarkedStepIds: string[];
  highlights: HighlightItem[];
  streak: StreakState;
  totalMinutesStudied: number;
  lastVisitedLessonId: string | null;
  prefs: UserPrefs;
  updatedAt: string;
}

export interface GlossaryEntry {
  term: string;
  fullName?: string;
  category: string;
  definition: string;
  definitionPt?: string;
  aliases?: string[];
}

export interface CloudSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  tutorWorkerUrl: string;
  geminiApiKey: string;
}
