import {
  PromptHandler,
  AdvancedResponse,
  PromptResult,
} from "@/types/promptHandler";

/**
 * Creates an advanced handler from any async function
 * This allows any function to be wrapped and used with the prompt system
 */

type ExecutionConfig =
  | { type: "serial" }
  | { type: "parallel"; maxConcurrency?: number; timeoutMs?: number };

export const createAdvancedHandler = ({
  id,
  name,
  description,
  asyncFunction,
  execution = { type: "serial" },
}: {
  id: string;
  name: string;
  description?: string;
  asyncFunction: (input: string) => Promise<AdvancedResponse>;
  execution?: ExecutionConfig;
}): PromptHandler => ({
  id,
  name,
  description,
  category: "advanced",
  execute: async ({ input, runCount }) => {
    const overallStartTime = Date.now();
    const results = [];

    if (execution.type === "parallel") {
      // PARALLEL EXECUTION with rolling concurrency, timeout protection, and memory efficiency
      const maxConcurrency = execution.maxConcurrency ?? runCount;
      const timeoutMs = execution.timeoutMs ?? 30000; // 30 second default timeout

      const executeRunWithTimeout = async (): Promise<PromptResult> => {
        const runStartTime = Date.now();

        try {
          // Race between actual execution and timeout
          const result = await Promise.race([
            asyncFunction(input),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error(`Timeout after ${timeoutMs}ms`)),
                timeoutMs
              )
            ),
          ]);

          const runEndTime = Date.now();
          return {
            response: result.response,
            prompt: result.prompt,
            logs: result.logs,
            duration: runEndTime - runStartTime,
            timestamp: new Date(runStartTime),
          };
        } catch (error) {
          const runEndTime = Date.now();
          const isTimeout =
            error instanceof Error && error.message.includes("Timeout after");

          return {
            response: `${isTimeout ? "Timeout" : "Error"}: ${
              error instanceof Error ? error.message : "Unknown error occurred"
            }`,
            prompt: `Error processing: ${input}`,
            logs: [
              {
                label: isTimeout ? "Timeout Error" : "Execution Error",
                text: error instanceof Error ? error.message : String(error),
              },
            ],
            duration: runEndTime - runStartTime,
            timestamp: new Date(runStartTime),
          };
        }
      };

      // Rolling concurrency execution with memory-efficient promise creation
      const executeWithRollingConcurrency = async (): Promise<
        PromptResult[]
      > => {
        const results: PromptResult[] = [];
        let completed = 0;
        let started = 0;
        const activePromises = new Map<number, Promise<PromptResult>>();

        const startNextRun = () => {
          if (started >= runCount) return;

          const runId = started++;
          const promise = executeRunWithTimeout()
            .then((result) => {
              // eslint-disable-next-line drizzle/enforce-delete-with-where
              activePromises.delete(runId);
              completed++;
              results.push(result);
              return result;
            })
            .catch((error) => {
              // eslint-disable-next-line drizzle/enforce-delete-with-where
              activePromises.delete(runId);
              completed++;
              const errorResult: PromptResult = {
                response: `Promise execution failed: ${error}`,
                prompt: `Error processing: ${input}`,
                logs: [
                  {
                    label: "Promise Error",
                    text: `Promise rejected: ${error}`,
                  },
                ],
                duration: 0,
                timestamp: new Date(),
              };
              results.push(errorResult);
              return errorResult;
            });

          activePromises.set(runId, promise);
        };

        // Start initial batch up to concurrency limit
        for (let i = 0; i < Math.min(maxConcurrency, runCount); i++) {
          startNextRun();
        }

        // Process completions and start new runs as slots become available
        while (completed < runCount) {
          if (activePromises.size === 0) {
            // Safety check - should not happen
            break;
          }

          // Wait for at least one promise to complete
          await Promise.race(activePromises.values());

          // Start new runs to fill available slots
          while (activePromises.size < maxConcurrency && started < runCount) {
            startNextRun();
          }
        }

        return results;
      };

      const parallelResults = await executeWithRollingConcurrency();
      results.push(...parallelResults);
    } else {
      // SERIAL EXECUTION (original approach)
      for (let i = 0; i < runCount; i++) {
        const runStartTime = Date.now();

        try {
          const result = await asyncFunction(input);
          const runEndTime = Date.now();

          results.push({
            response: result.response,
            prompt: result.prompt,
            logs: result.logs,
            duration: runEndTime - runStartTime,
            timestamp: new Date(runStartTime),
          });
        } catch (error) {
          const runEndTime = Date.now();

          results.push({
            response: `Error: ${
              error instanceof Error ? error.message : "Unknown error occurred"
            }`,
            prompt: `Error processing: ${input}`,
            logs: [
              {
                label: "Execution Error",
                text: `Execution failed: ${error}`,
              },
            ],
            duration: runEndTime - runStartTime,
            timestamp: new Date(runStartTime),
          });
        }
      }
    }

    const overallEndTime = Date.now();

    // Calculate appropriate total duration based on execution mode
    const totalDuration =
      execution.type === "parallel"
        ? overallEndTime - overallStartTime // Wall-clock time for parallel
        : results.reduce((sum, result) => sum + result.duration, 0); // Sum for serial

    return {
      results,
      totalDuration,
      promptTemplate: name,
      userInput: input,
    };
  },
});
