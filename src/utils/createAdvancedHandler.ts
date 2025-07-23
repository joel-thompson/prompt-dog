import { PromptHandler, AdvancedResponse } from "@/types/promptHandler";

/**
 * Creates an advanced handler from any async function
 * This allows any function to be wrapped and used with the prompt system
 */

export const createAdvancedHandler = ({
  id,
  name,
  description,
  asyncFunction,
}: {
  id: string;
  name: string;
  description?: string;
  asyncFunction: (input: string) => Promise<AdvancedResponse>;
}): PromptHandler => ({
  id,
  name,
  description,
  category: "advanced",
  execute: async ({ input, runCount }) => {
    const results = [];

    for (let i = 0; i < runCount; i++) {
      const runStartTime = Date.now();

      try {
        const result = await asyncFunction(input);
        const runEndTime = Date.now();
        const duration = runEndTime - runStartTime;

        // Advanced functions always return { response, prompt? }
        const response = result.response;
        const usedPrompt = result.prompt;

        results.push({
          response, // Return raw response - let MultiplePromptResponse handle JSON vs text
          prompt: usedPrompt,
          duration: duration,
          timestamp: new Date(runStartTime),
        });
      } catch (error) {
        const runEndTime = Date.now();
        const duration = runEndTime - runStartTime;

        results.push({
          response: `Error: ${
            error instanceof Error ? error.message : "Unknown error occurred"
          }`,
          prompt: `Error processing: ${input}`,
          duration: duration,
          timestamp: new Date(runStartTime),
        });
      }
    }

    const totalDuration = results.reduce(
      (sum, result) => sum + result.duration,
      0
    );

    return {
      results,
      totalDuration,
      promptTemplate: name,
      userInput: input,
    };
  },
});
