export interface NoteItem {
  level: number;
  text: string;
}

export interface DiagramData {
  src: string;
  width: number;
  height: number;
  altText: string;
}

export interface VrpTokenInfo {
  token: string;
  meaning: string;
}

export interface VrpCommandLine {
  code: string;
  tokens: VrpTokenInfo[];
}

export interface VrpBlock {
  title: string;
  viewLabel: string;
  commands: VrpCommandLine[];
}

export interface MultipleChoiceChallenge {
  id: string;
  type: "multiple-choice";
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MultiSelectChallenge {
  id: string;
  type: "multi-select";
  prompt: string;
  options: string[];
  correctIndices: number[];
  explanation: string;
}

export interface MatchPair {
  left: string;
  right: string;
}

export interface MatchPairsChallenge {
  id: string;
  type: "match-pairs";
  prompt: string;
  pairs: MatchPair[];
  explanation: string;
}

export interface OrderStepsChallenge {
  id: string;
  type: "order-steps";
  prompt: string;
  items: string[];
  correctOrder: number[];
  explanation: string;
}

export interface FillBlankChallenge {
  id: string;
  type: "fill-blank";
  prompt: string;
  template: string;
  bank: string[];
  correctTokens: string[];
  explanation: string;
}

export type ChallengeData =
  | MultipleChoiceChallenge
  | MultiSelectChallenge
  | MatchPairsChallenge
  | OrderStepsChallenge
  | FillBlankChallenge;

export interface SlideStep {
  id: string;
  kind: "slide" | "official-quiz";
  pageNum: number;
  pdfPages: number[];
  slideNumber: number;
  title: string;
  sectionTitle: string;
  breadcrumbs: string[];
  slideBullets: NoteItem[];
  diagram: DiagramData | null;
  notes: NoteItem[];
  vrpBlocks: VrpBlock[];
}

export interface ChallengeStep {
  id: string;
  kind: "challenge";
  sectionTitle: string;
  challenge: ChallengeData;
}

export type StudyStep = SlideStep | ChallengeStep;

export interface LessonData {
  id: string;
  number: string;
  title: string;
  sectionTitle: string;
  summary: string;
  estimatedMinutes: number;
  steps: StudyStep[];
}

export interface ChapterData {
  id: string;
  number: number;
  title: string;
  description: string;
  pageRange: string;
  pageCount: number;
  sections: string[];
  lessons: LessonData[];
}

export interface ChapterSummary {
  id: string;
  number: number;
  slug: string;
  title: string;
  pdfFile: string;
  pageRange: string;
  pageCount: number;
  ready: boolean;
  lessonCount: number;
  stepCount: number;
  estimatedMinutes: number;
  diagramCount?: number;
}

export interface CourseManifest {
  courseTitle: string;
  subtitle: string;
  generatedAt: string;
  chapters: ChapterSummary[];
}
