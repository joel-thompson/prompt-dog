// mock data for now, simulate a delay for db call

import { PromptTemplate } from "@/types/promptHandler";

// Re-export for compatibility with existing imports
export type { PromptTemplate };

const getPromptTemplates = async () => {
  // simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [
    {
      id: 1,
      name: "Helpful Assistant",
      text: "You are a helpful assistant that can answer questions and help with tasks. Answer the user's question based on the following information:\n\n{{INPUT}}",
      description:
        "A general-purpose assistant that provides helpful answers and guidance on various topics",
    },
    {
      id: 2,
      name: "Proofreader",
      text: "You are an expert proofreader. Review the following text for grammar, spelling, and clarity. Provide suggestions for improvement:\n\n{{INPUT}}",
      description:
        "Reviews text for grammar, spelling, and clarity issues with improvement suggestions",
    },
    {
      id: 3,
      name: "Brainstorming Assistant",
      text: "You are a creative brainstorming assistant. Generate three unique ideas or solutions based on the user's request:\n\n{{INPUT}}",
      description: undefined,
    },
  ];
};

export const getPromptTemplate = async (id: number) => {
  const templates = await getPromptTemplates();
  return templates.find((p) => p.id === id);
};

export default getPromptTemplates;
