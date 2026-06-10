export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  tempo: string;
  cue: string;
  targetMuscle: string;
}

export interface WorkoutDay {
  dayName: string;
  focus: string;
  isRestDay: boolean;
  exercises: Exercise[];
}

export interface WorkoutProgram {
  programName: string;
  summary: string;
  splits: WorkoutDay[];
}

export interface MealLog {
  id: string;
  timestamp: string;
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  breakdown: string;
}

export interface ProgressMeasurement {
  id: string;
  date: string;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  chest?: number;
  waist?: number;
  arms?: number;
  quads?: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ActiveSet {
  setNum: number;
  weight: string;
  reps: string;
  completed: boolean;
}

export interface ActiveExerciseSession {
  exerciseName: string;
  targetSetsCount: number;
  targetRepsRange: string;
  targetMuscle: string;
  sets: ActiveSet[];
}

export interface ActiveWorkoutSession {
  dayName: string;
  focus: string;
  date: string;
  exercises: ActiveExerciseSession[];
}
