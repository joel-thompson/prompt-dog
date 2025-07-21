"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PromptResponseProps {
  data: string | object;
  loading: boolean;
  error?: string;
  title?: string;
}

// Helper function for proper type discrimination
const getDataType = (
  data: string | object | null | undefined
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

// Helper function to safely stringify complex objects
const safeStringify = (data: object): string => {
  try {
    // Handle special object types that need custom serialization
    if (data instanceof Date) {
      return JSON.stringify(data.toISOString(), null, 2);
    }

    if (data instanceof Map) {
      return JSON.stringify(Object.fromEntries(data), null, 2);
    }

    if (data instanceof Set) {
      return JSON.stringify(Array.from(data), null, 2);
    }

    if (data instanceof Error) {
      return JSON.stringify(
        {
          name: data.name,
          message: data.message,
          stack: data.stack,
        },
        null,
        2
      );
    }

    // For regular objects, use standard stringify with circular reference handling
    return JSON.stringify(
      data,
      (key, value) => {
        // Handle circular references
        if (typeof value === "object" && value !== null) {
          if (value instanceof Date) return value.toISOString();
          if (value instanceof Map) return Object.fromEntries(value);
          if (value instanceof Set) return Array.from(value);
          if (value instanceof Error)
            return {
              name: value.name,
              message: value.message,
              stack: value.stack,
            };
        }
        return value;
      },
      2
    );
  } catch {
    // Fallback for unstringifiable objects
    return `[Object: ${
      data.constructor?.name || "Unknown"
    }]\n\nNote: This object cannot be fully serialized to JSON.`;
  }
};

export default function PromptResponse({
  data,
  loading,
  error,
  title = "Response",
}: PromptResponseProps) {
  const dataType = getDataType(data);
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if content is large (needs collapsing)
  const isLargeContent = () => {
    if (dataType === "text") {
      return String(data).length > 2000;
    }
    if (dataType === "json") {
      return safeStringify(data as object).length > 2000;
    }
    return false;
  };

  const shouldShowCollapsible = isLargeContent();

  const handleCopy = async () => {
    try {
      const textToCopy =
        dataType === "json" ? safeStringify(data as object) : String(data);
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Helper functions for metadata display
  const getTypeLabel = () => {
    if (dataType === "text") return "Text";
    if (Array.isArray(data)) return "Array";
    return "JSON Object";
  };

  const getSizeLabel = () => {
    if (dataType === "text") {
      return `${String(data).length} characters`;
    }
    if (Array.isArray(data)) {
      return `${data.length} items`;
    }
    return `${Object.keys(data as object).length} properties`;
  };

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
              {shouldShowCollapsible && (
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
                onClick={handleCopy}
                className="h-6 px-2 text-xs"
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
          <pre
            className={cn(
              "bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 overflow-x-auto text-sm font-mono border border-slate-200 dark:border-slate-700",
              shouldShowCollapsible &&
                isCollapsed &&
                "max-h-40 overflow-y-auto",
              shouldShowCollapsible &&
                !isCollapsed &&
                "max-h-96 overflow-y-auto"
            )}
          >
            <code>{safeStringify(data as object)}</code>
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
            {shouldShowCollapsible && (
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
              onClick={handleCopy}
              className="h-6 px-2 text-xs"
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
        <div
          className={cn(
            "bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700",
            shouldShowCollapsible && isCollapsed && "max-h-40 overflow-y-auto",
            shouldShowCollapsible && !isCollapsed && "max-h-96 overflow-y-auto"
          )}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {String(data)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8"
      )}
    >
      <div className="space-y-4">
        <Label className="text-base font-medium">{title}</Label>
        <div className="min-h-16">{renderContent()}</div>

        {/* Response metadata */}
        {dataType !== "empty" && !loading && !error && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Type: {getTypeLabel()}</span>
              <span>{getSizeLabel()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
