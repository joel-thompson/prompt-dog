"use client";

import React, { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface PromptResult {
  response: string;
  prompt: string;
  duration: number;
  timestamp: Date;
}

interface MultiplePromptResults {
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

export default function MultiplePromptResponse({
  data,
  loading,
  error,
  title = "AI Response",
}: MultiplePromptResponseProps) {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [collapsedStates, setCollapsedStates] = useState<{
    [key: string]: boolean;
  }>({});

  const handleCopy = useCallback(async (content: string, key: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  }, []);

  const toggleCollapse = useCallback((key: string) => {
    setCollapsedStates((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
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
      const isLargeContent = result.response.length > 2000;
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Response</Label>
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                  TEXT
                </span>
              </div>
              <div className="flex gap-1">
                {isLargeContent && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleCollapse(responseKey)}
                    className="h-6 px-2 text-xs"
                  >
                    {collapsedStates[responseKey] ? "Expand" : "Collapse"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(result.response, responseKey)}
                  className="h-6 px-2 text-xs"
                >
                  {copiedStates[responseKey] ? "Copied!" : "Copy"}
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
                {result.response}
              </p>
            </div>
          </div>

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
                onClick={() => handleCopy(result.prompt, promptKey)}
                className="h-6 px-2 text-xs"
              >
                {copiedStates[promptKey] ? "Copied!" : "Copy"}
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
            const isLargeContent = result.response.length > 2000;
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Response</Label>
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                        TEXT
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {isLargeContent && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleCollapse(responseKey)}
                          className="h-6 px-2 text-xs"
                        >
                          {collapsedStates[responseKey] ? "Expand" : "Collapse"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(result.response, responseKey)}
                        className="h-6 px-2 text-xs"
                      >
                        {copiedStates[responseKey] ? "Copied!" : "Copy"}
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
                      {result.response}
                    </p>
                  </div>
                </div>

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
                      onClick={() => handleCopy(result.prompt, promptKey)}
                      className="h-6 px-2 text-xs"
                    >
                      {copiedStates[promptKey] ? "Copied!" : "Copy"}
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
      </div>
    </div>
  );
}
