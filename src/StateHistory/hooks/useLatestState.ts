/** @format */
import { useMemo } from "react";
import { useHistoryStateContext } from "../context/StateHistoryContext";

/**
 * A hook that retrieves the latest state for a specific command type from the undo stack
 *
 * This is particularly useful for components like React Flow that need to initialize
 * with the latest persisted state rather than default values
 *
 * @param commandType The type of command to look for in the undo stack
 * @param initialState The default state to use if no state is found in the history
 * @returns The latest state from the undo stack or the initialState if none found
 */
export function useLatestState<T>(commandType: string): T | undefined {
  const { undoStack } = useHistoryStateContext();

  const latestState = useMemo(() => {
    // Only process if persistence is enabled and we have an undo stack
    if (undoStack.length === 0) {
      console.warn(
        `No commands found in undo stack for type "${commandType}".`
      );
      return undefined;
    }

    // Search the undo stack from newest to oldest to find the latest state for this command type
    for (let i = undoStack.length - 1; i >= 0; i--) {
      const cmd = undoStack[i];
      if (cmd.commandName === commandType && cmd.params) {
        // If we find a matching command, extract the newValue from the params
        const params = cmd.params as { oldValue: T; newValue: T };
        if (params.newValue !== undefined) {
          return params.newValue;
        }
      }
    }

    // If no matching command is found, return undefined
    console.warn(
      `No matching command found in undo stack for type "${commandType}".`
    );
    return undefined;
  }, [commandType, undoStack]);

  return latestState;
}
