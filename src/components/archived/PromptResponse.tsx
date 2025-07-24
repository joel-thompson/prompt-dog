"use client";

import React, { useState, useCallback } from "react";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PromptResponseProps {
  data: string | object | null;
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

export default function PromptResponse({
  data,
  loading,
  error,
  title = "Response",
}: PromptResponseProps) {
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const dataType = getDataType(data);

  const handleCopyJson = useCallback(async () => {
    try {
      const textToCopy = safeStringify(data as object);
      await navigator.clipboard.writeText(textToCopy);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (err) {
      console.error("Failed to copy JSON: ", err);
    }
  }, [data]);

  const handleCopyText = useCallback(async () => {
    try {
      const textToCopy = String(data);
      await navigator.clipboard.writeText(textToCopy);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }, [data]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-muted-foreground">
              Generating response...
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

    if (dataType === "empty") {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No response yet</p>
        </div>
      );
    }

    const content =
      dataType === "json" ? safeStringify(data as object) : String(data);
    const isLargeContent = content.length > 2000;

    // Handle JSON data (objects and arrays)
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
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-6 px-2 text-xs"
                >
                  {isCollapsed ? "Expand" : "Collapse"}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyJson}
                className="h-6 px-2 text-xs"
              >
                {copiedJson ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
          <pre
            className={cn(
              "bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 overflow-x-auto text-sm font-mono border border-slate-200 dark:border-slate-700",
              isLargeContent && "transition-[max-height] duration-300",
              isLargeContent && isCollapsed && "max-h-40 overflow-y-auto",
              isLargeContent && !isCollapsed && "max-h-96 overflow-y-auto"
            )}
          >
            <code>{content}</code>
          </pre>
        </div>
      );
    }

    // Handle text data
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
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-6 px-2 text-xs"
              >
                {isCollapsed ? "Expand" : "Collapse"}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyText}
              className="h-6 px-2 text-xs"
            >
              {copiedText ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
        <div
          className={cn(
            "bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700",
            isLargeContent && "transition-[max-height] duration-300",
            isLargeContent && isCollapsed && "max-h-40 overflow-y-auto",
            isLargeContent && !isCollapsed && "max-h-96 overflow-y-auto"
          )}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8">
      <div className="space-y-4">
        <Label className="text-base font-medium">{title}</Label>
        <div className="min-h-16">{renderContent()}</div>

        {/* Response metadata */}
        {dataType !== "empty" && !loading && !error && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-end items-center text-xs text-muted-foreground">
              <span>
                {dataType === "text"
                  ? `${String(data).length} characters`
                  : dataType === "json" && Array.isArray(data)
                  ? `${data.length} items`
                  : `${Object.keys(data as object).length} properties`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
