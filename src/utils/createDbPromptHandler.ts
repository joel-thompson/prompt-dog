import { PromptTemplate, PromptHandler } from "@/types/promptHandler";
import { multipleBasicPrompts } from "@/server/actions/basicPrompt";

/**
 * Converts a database PromptTemplate to a PromptHandler
 * Uses the db-${id} convention for handler IDs
 */
export const createDbPromptHandler = (
  template: PromptTemplate
): PromptHandler => ({
  id: `db-${template.id}`,
  name: template.name,
  category: "basic",
  execute: ({ input, runCount }) =>
    multipleBasicPrompts({
      promptId: template.id,
      input,
      runCount,
    }),
});
