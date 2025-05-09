/** @format */
import { useMemo } from "react";
import { useHistoryStateContext } from "../context/StateHistoryContext";

/**
 * A hook that retrieves the latest state for a specific command type from the history
 *
 * This is particularly useful when initializing components with persisted state,
 * especially for third-party library integrations that need the latest state value
 *
 * @param commandType The command type to look for in the history stack
 * @returns The latest state value from the history stack, or undefined if none found
 * 
 * @example
 * // In a React Flow component
 * const latestNodes = useLatestState<Node[]>('flowNodes/update');
 * const [nodes, setNodes] = useNodesState(latestNodes || initialNodes);
 */
export function useLatestState<T>(commandType: string): T | undefined {
  const { undoStack, initialStateLoaded } = useHistoryStateContext();

  const latestState = useMemo(() => {
    // Only search if we have commands in the stack and initial state has loaded
    if (!initialStateLoaded || undoStack.length === 0) {
      return undefined;
    }

    // Search backward through the stack (newest to oldest)
    for (let i = undoStack.length - 1; i >= 0; i--) {
      const cmd = undoStack[i];
      
      // Look for commands matching our command type 
      if (cmd.commandName === commandType && cmd.params) {
        const params = cmd.params as { oldValue?: T; newValue: T };
        if (params.newValue !== undefined) {
          return params.newValue;
        }
      }
    }

    return undefined;
  }, [commandType, undoStack, initialStateLoaded]);

  return latestState;
}
