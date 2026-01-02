
export interface Variation {
  id: number;
  prompt: string;
  title: string;
  style: string;
  imageUrl?: string;
  loading: boolean;
  error?: string;
}

export interface AnalysisResponse {
  storyboard: {
    title: string;
    style: string;
    imagePrompt: string;
  }[];
  videoPrompts: {
    process: string;
    result: string;
  };
}
