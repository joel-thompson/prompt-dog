"use client";

import { useState, useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PromptTemplate, MultiplePromptResults } from "@/types/promptHandler";
import { createPromptHandlers } from "@/utils/createPromptHandlers";

import MultiplePromptResponse from "./MultiplePromptResponse";
import PromptInput from "./PromptInput";

interface BasicPromptProps {
  promptTemplates: PromptTemplate[];
}

const BasicPrompt = ({ promptTemplates }: BasicPromptProps) => {
  // Create handlers on the client side to avoid serialization issues
  const promptHandlers = useMemo(
    () => createPromptHandlers(promptTemplates),
    [promptTemplates]
  );

  const [response, setResponse] = useState<MultiplePromptResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedHandlerId, setSelectedHandlerId] = useState<string>("");
  const [runCount, setRunCount] = useState<number>(1);

  // Use the first handler ID if none is selected
  const currentHandlerId = selectedHandlerId || promptHandlers[0]?.id || "";

  // Get the currently selected handler
  const selectedHandler = promptHandlers.find(
    (handler) => handler.id === currentHandlerId
  );

  const handleSubmit = async (input: string) => {
    setIsLoading(true);
    setResponse(null);
    setError("");

    try {
      const selectedHandler = promptHandlers.find(
        (handler) => handler.id === currentHandlerId
      );
      if (!selectedHandler) {
        throw new Error("Selected handler not found");
      }

      const result = await selectedHandler.execute({ input, runCount });
      setResponse(result);
    } catch (err) {
      setError("Failed to get response from AI");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="prompt-template-select">Prompt Template</Label>
        <Select
          value={currentHandlerId}
          onValueChange={(value) => setSelectedHandlerId(value)}
        >
          <SelectTrigger id="prompt-template-select">
            <SelectValue placeholder="Select a prompt template" />
          </SelectTrigger>
          <SelectContent>
            {promptHandlers.map((handler) => (
              <SelectItem key={handler.id} value={handler.id}>
                <div className="flex items-center gap-2">
                  <span>{handler.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      handler.category === "advanced"
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {handler.category.toUpperCase()}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedHandler?.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {selectedHandler.description}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="run-count-select">Number of Runs</Label>
        <Select
          value={runCount.toString()}
          onValueChange={(value) => setRunCount(parseInt(value))}
        >
          <SelectTrigger id="run-count-select">
            <SelectValue placeholder="Select number of runs" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((count) => (
              <SelectItem key={count} value={count.toString()}>
                {count === 1 ? "1 run" : `${count} runs`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <PromptInput onSubmit={handleSubmit} disabled={isLoading} />

      <MultiplePromptResponse
        data={response}
        loading={isLoading}
        error={error}
        title={runCount === 1 ? "AI Response" : "AI Responses"}
      />
    </div>
  );
};

export function BasicPromptLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full bg-slate-200 dark:bg-slate-700" />
      <Skeleton className="h-40 w-full bg-slate-200 dark:bg-slate-700" />
      <Skeleton className="h-60 w-full bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

export default BasicPrompt;
