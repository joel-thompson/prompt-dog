"use server";

import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { AdvancedResponse } from "@/types/promptHandler";

const template1 = `You are a helpful assistant that can answer questions and help with tasks. Breakdown the user's question or task into a series of steps.\n\n`;
const template2 = `You are a helpful assistant that can answer questions and help with tasks. Answer the user's question or task in a concise and helpful manner, using the steps provided.\n\n`;

export async function twoStagePromptJson(
  userInput: string
): Promise<AdvancedResponse> {
  const initialPrompt = template1 + userInput;

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    prompt: initialPrompt,
    schema: z.object({
      steps: z
        .array(z.string())
        .describe(
          "An array of strings, each breaking down the user's question into a step"
        ),
    }),
  });

  console.log(object.steps);

  const fullPrompt =
    template2 +
    `Original question: "${userInput}"\n\n` +
    `Steps to follow:\n${object.steps
      .map((step, i) => `${i + 1}. ${step}`)
      .join("\n")}\n\n`;

  console.log(fullPrompt);

  const response = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: fullPrompt,
  });

  //TODO: keep an array of 'logs', which gets returned to the user. this will be optional and displayed in the UI. only if it is returned.

  const logs = [
    {
      label: "fullPrompt",
      text: fullPrompt,
    },
    {
      label: "foo label",
      text: "foo text",
    },
  ];

  return {
    response: response.text,
    logs: logs,
  };
}
