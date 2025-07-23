import {
  PromptTemplate,
  PromptHandler,
  PromptResult,
} from "@/types/promptHandler";
import { getPromptTemplate } from "@/server/db/promptTemplates";
import insertInputIntoPrompt from "@/utils/insertInputIntoPrompt";
import { generateAIResponse } from "@/server/actions/generateAIResponse";

/**
 * Converts a database PromptTemplate to a PromptHandler
 * Uses the db-${id} convention for handler IDs
 */
export const createDbPromptHandler = (
  template: PromptTemplate
): PromptHandler => ({
  id: `db-${template.id}`,
  name: template.name,
  description: template.description,
  category: "basic",
  execute: async ({ input, runCount }) => {
    const templateData = await getPromptTemplate(template.id);
    if (!templateData) {
      throw new Error("Prompt template not found");
    }

    const processedPrompt = insertInputIntoPrompt(templateData.text, input);
    const results: PromptResult[] = [];
    const startTime = Date.now();

    for (let i = 0; i < runCount; i++) {
      const runStartTime = Date.now();

      try {
        const response = await generateAIResponse(processedPrompt);

        const runEndTime = Date.now();
        const duration = runEndTime - runStartTime;

        results.push({
          response: response,
          prompt: processedPrompt,
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
          prompt: processedPrompt,
          duration: duration,
          timestamp: new Date(runStartTime),
        });
      }
    }

    const totalDuration = Date.now() - startTime;

    return {
      results,
      totalDuration,
      promptTemplate: templateData.text,
      userInput: input,
    };
  },
});
