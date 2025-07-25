// Consolidated types for prompt handling system

// Database prompt template type (from promptTemplates.ts)
export interface PromptTemplate {
  id: number;
  name: string;
  text: string;
  description?: string;
}

// Result from a single prompt execution (consolidated from basicPrompt.ts and MultiplePromptResponse.tsx)
// Using the more flexible version with string | object response to support future JSON responses
export interface PromptResult {
  response: string | object;
  prompt?: string; // Optional for advanced handlers that might not have a meaningful prompt
  logs?: {
    label: string;
    text: string;
  }[];
  duration: number;
  timestamp: Date;
}

// Results from multiple prompt executions (consolidated from basicPrompt.ts and MultiplePromptResponse.tsx)
export interface MultiplePromptResults {
  results: PromptResult[];
  totalDuration: number;
  promptTemplate: string;
  userInput: string;
}

// New unified handler interface for both database and complex prompts
export interface PromptHandler {
  id: string; // For React keys and selection tracking
  name: string;
  description?: string;
  category: "basic" | "advanced";
  execute: (params: {
    input: string;
    runCount: number;
  }) => Promise<MultiplePromptResults>;
}

export interface AdvancedResponse {
  response: string | object;
  prompt?: string;
  logs?: {
    label: string;
    text: string;
  }[];
}
