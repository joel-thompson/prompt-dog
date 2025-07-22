"use client";

import React, { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface PromptResult {
  response: string | object;
  prompt: string;
  duration: number;
  timestamp: Date;
}

export interface MultiplePromptResults {
  results: PromptResult[];
  totalDuration: number;
  promptTemplate: string;
  userInput: string;
}

interface MultiplePromptResponseProps {
  data: MultiplePromptResults | null;
  loading: boolean;
  error?: string;
  title?: string;
}

// Helper function for proper type discrimination
const getDataType = (
  data: string | object | null
): "text" | "json" | "empty" => {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return "empty";
  }

  // Handle strings
  if (typeof data === "string") {
    return "text";
  }

  // Handle arrays (should be JSON)
  if (Array.isArray(data)) {
    return "json";
  }

  // Handle complex objects that should be JSON-stringified
  if (typeof data === "object") {
    return "json";
  }

  // Handle other primitive types (numbers, booleans, etc.) as text
  return "text";
};

// Helper function to safely stringify objects with circular reference protection
const safeStringify = (data: object): string => {
  try {
    // Simple circular reference protection using a Set to track seen objects
    const seen = new Set();
    return JSON.stringify(
      data,
      (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular Reference]";
          }
          seen.add(value);
        }
        return value;
      },
      2
    );
  } catch {
    // Fallback for truly unstringifiable objects
    return `[Object: ${
      data.constructor?.name || "Unknown"
    }]\n\nNote: This object cannot be serialized to JSON.`;
  }
};

export default function MultiplePromptResponse({
  data,
  loading,
  error,
  title = "AI Response",
}: MultiplePromptResponseProps) {
  // Following PromptResponse pattern - separate states for each response
  const [copiedJsonStates, setCopiedJsonStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [copiedTextStates, setCopiedTextStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [collapsedStates, setCollapsedStates] = useState<{
    [key: string]: boolean;
  }>({});

  // Following PromptResponse pattern - separate copy handlers
  const createHandleCopyJson = useCallback(
    (responseData: object, key: string) => async () => {
      try {
        const textToCopy = safeStringify(responseData);
        await navigator.clipboard.writeText(textToCopy);
        setCopiedJsonStates((prev) => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setCopiedJsonStates((prev) => ({ ...prev, [key]: false }));
        }, 2000);
      } catch (err) {
        console.error("Failed to copy JSON: ", err);
      }
    },
    []
  );

  const createHandleCopyText = useCallback(
    (responseData: string | object, key: string) => async () => {
      try {
        const textToCopy = String(responseData);
        await navigator.clipboard.writeText(textToCopy);
        setCopiedTextStates((prev) => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setCopiedTextStates((prev) => ({ ...prev, [key]: false }));
        }, 2000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    },
    []
  );

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };

  const renderResponseContent = (
    response: string | object,
    responseKey: string
  ) => {
    const dataType = getDataType(response);

    if (dataType === "empty") {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No response yet</p>
        </div>
      );
    }

    const content =
      dataType === "json"
        ? safeStringify(response as object)
        : String(response);
    const isLargeContent = content.length > 2000;

    // Handle JSON data (objects and arrays) - following PromptResponse pattern
    if (dataType === "json") {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                JSON
              </span>
            </div>
            <div className="flex gap-1">
              {isLargeContent && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setCollapsedStates((prev) => ({
                      ...prev,
                      [responseKey]: !prev[responseKey],
                    }))
                  }
                  className="h-6 px-2 text-xs"
                >
                  {collapsedStates[responseKey] ? "Expand" : "Collapse"}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={createHandleCopyJson(response as object, responseKey)}
                className="h-6 px-2 text-xs"
              >
                {copiedJsonStates[responseKey] ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
          <pre
            className={cn(
              "bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 overflow-x-auto text-sm font-mono border border-slate-200 dark:border-slate-700",
              isLargeContent && "transition-[max-height] duration-300",
              isLargeContent &&
                collapsedStates[responseKey] &&
                "max-h-40 overflow-y-auto",
              isLargeContent &&
                !collapsedStates[responseKey] &&
                "max-h-96 overflow-y-auto"
            )}
          >
            <code>{content}</code>
          </pre>
        </div>
      );
    }

    // Handle text data - following PromptResponse pattern
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
              TEXT
            </span>
          </div>
          <div className="flex gap-1">
            {isLargeContent && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setCollapsedStates((prev) => ({
                    ...prev,
                    [responseKey]: !prev[responseKey],
                  }))
                }
                className="h-6 px-2 text-xs"
              >
                {collapsedStates[responseKey] ? "Expand" : "Collapse"}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={createHandleCopyText(response, responseKey)}
              className="h-6 px-2 text-xs"
            >
              {copiedTextStates[responseKey] ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
        <div
          className={cn(
            "bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700",
            isLargeContent && "transition-[max-height] duration-300",
            isLargeContent &&
              collapsedStates[responseKey] &&
              "max-h-40 overflow-y-auto",
            isLargeContent &&
              !collapsedStates[responseKey] &&
              "max-h-96 overflow-y-auto"
          )}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-muted-foreground">
              Generating responses...
            </span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <span>⚠️</span>
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      );
    }

    if (!data || !data.results.length) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No responses yet</p>
        </div>
      );
    }

    const { results, totalDuration, userInput } = data;

    // If only one result, display it without tabs
    if (results.length === 1) {
      const result = results[0];
      const responseKey = "single-response";
      const promptKey = "single-prompt";

      return (
        <div className="space-y-6">
          {/* Overall metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <span>
              User Input:{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                &quot;{userInput}&quot;
              </span>
            </span>
            <span>
              Duration:{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {formatDuration(result.duration)}
              </span>
            </span>
            <span>
              Generated at:{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {formatTime(result.timestamp)}
              </span>
            </span>
          </div>

          {/* Response */}
          {renderResponseContent(result.response, responseKey)}

          {/* Prompt */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Prompt Sent</Label>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  PROMPT
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={createHandleCopyText(result.prompt, promptKey)}
                className="h-6 px-2 text-xs"
              >
                {copiedTextStates[promptKey] ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {result.prompt}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Multiple results - use tabs
    return (
      <div className="space-y-4">
        {/* Overall metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <span>
            User Input:{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              &quot;{userInput}&quot;
            </span>
          </span>
          <span>
            Runs:{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {results.length}
            </span>
          </span>
          <span>
            Total Duration:{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {formatDuration(totalDuration)}
            </span>
          </span>
          <span>
            Avg Duration:{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {formatDuration(Math.round(totalDuration / results.length))}
            </span>
          </span>
        </div>

        <Tabs defaultValue="run-0" className="w-full">
          <TabsList
            className="grid w-full"
            style={{
              gridTemplateColumns: `repeat(${results.length}, minmax(0, 1fr))`,
            }}
          >
            {results.map((_, index) => (
              <TabsTrigger key={index} value={`run-${index}`}>
                Run {index + 1}
              </TabsTrigger>
            ))}
          </TabsList>

          {results.map((result, index) => {
            const responseKey = `response-${index}`;
            const promptKey = `prompt-${index}`;

            return (
              <TabsContent
                key={index}
                value={`run-${index}`}
                className="space-y-6"
              >
                {/* Run metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <span>
                    Duration:{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatDuration(result.duration)}
                    </span>
                  </span>
                  <span>
                    Generated at:{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatTime(result.timestamp)}
                    </span>
                  </span>
                </div>

                {/* Response */}
                {renderResponseContent(result.response, responseKey)}

                {/* Prompt */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Prompt Sent</Label>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                        PROMPT
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={createHandleCopyText(result.prompt, promptKey)}
                      className="h-6 px-2 text-xs"
                    >
                      {copiedTextStates[promptKey] ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {result.prompt}
                    </p>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8">
      <div className="space-y-4">
        <Label className="text-base font-medium">{title}</Label>
        <div className="min-h-16">{renderContent()}</div>

        {/* Response metadata - following PromptResponse pattern */}
        {data && data.results.length > 0 && !loading && !error && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-end items-center text-xs text-muted-foreground">
              {data.results.length === 1 ? (
                <span>
                  {getDataType(data.results[0].response) === "text"
                    ? `${String(data.results[0].response).length} characters`
                    : getDataType(data.results[0].response) === "json" &&
                      Array.isArray(data.results[0].response)
                    ? `${(data.results[0].response as unknown[]).length} items`
                    : `${
                        Object.keys(data.results[0].response as object).length
                      } properties`}
                </span>
              ) : (
                <span>{data.results.length} results</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
