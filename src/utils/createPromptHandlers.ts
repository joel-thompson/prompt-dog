import { PromptTemplate, PromptHandler } from "@/types/promptHandler";
import { basicPromptJson } from "@/server/actions/basicPromptJson";
import { twoStagePromptJson } from "@/server/actions/twoStagePrompt";

import { createDbPromptHandler } from "./createDbPromptHandler";
import { createAdvancedHandler } from "./createAdvancedHandler";

const ADVANCED_HANDLERS = [
  {
    id: "advanced-json-response",
    name: "Structured JSON Response",
    description: "Returns structured answer with reasoning using JSON schema",
    asyncFunction: basicPromptJson,
  },
  {
    id: "two-stage-json-response",
    name: "Two Stage JSON Response",
    description: "Returns structured answer with reasoning using JSON schema",
    asyncFunction: twoStagePromptJson,
  },
] as const;

const validateUniqueIds = (handlers: PromptHandler[]): void => {
  const ids = handlers.map((h) => h.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate handler IDs found: ${duplicates.join(", ")}`);
  }
};

export const createPromptHandlers = (
  promptTemplates: PromptTemplate[]
): PromptHandler[] => {
  const handlers = [
    ...promptTemplates.map(createDbPromptHandler),
    ...ADVANCED_HANDLERS.map(createAdvancedHandler),
  ];

  validateUniqueIds(handlers);
  return handlers;
};
