/** @format */
import React, { useCallback, useEffect, useRef } from "react";
import { useHistoryStateContext } from "../context/StateHistoryContext";
import { createValueChangeCommand } from "../utils/stateChangeUtils";

/**
 * This module provides two complementary hooks for state management with undo/redo support:
 *
 * 1. useTrackableState - A lower-level hook for integrating with existing state management
 *    - Works with any state setter function
 *    - Requires manual tracking of previous values
 *    - Supports asymmetric execute/undo operations
 *    - Supports different parameter types for execute and undo operations
 *
 * 2. useHistoryState - A higher-level solution that combines useState with undo/redo
 *    - Manages value state internally
 *    - Simpler API that mimics useState with undo/redo support
 *    - Includes a convenient reset function
 */

// Define the interface for value change parameters
interface ValueChangeParams<T, U = T> {
  oldValue: U;
  newValue: T;
}

/**
 * A hook that integrates with existing state management systems to provide undo/redo support
 *
 * @param commandType - Unique identifier for this state change type
 * @param executeSetValue - Function to execute when setting a new value or redoing
 * @param undoSetValue - Optional function for undo operations (defaults to executeSetValue)
 * @returns A function to update the value that automatically creates undo/redo commands
 *
 * @example
 * // Basic usage with same function for undo/redo
 * const [count, setCount] = useState(0);
 * const trackCount = useTrackableState('counter', setCount);
 * trackCount(count + 1, count, 'Increment counter');
 *
 * @example
 * // Different functions for add/remove operations
 * const trackItemChange = useTrackableState('itemList', addItem, removeItem);
 * trackItemChange(newItem, oldItem, 'Add item');
 */
export function useTrackableState<T, U = T>(
  commandType: string,
  executeSetValue: (value: T) => void,
  undoSetValue?: (value: U) => void
): (newValue: T, oldValue: U, description?: string) => void {
  const { execute, registerCommand, hasCommand, commandRegistry } = useHistoryStateContext();
  const isRegistered = useRef(false);

  // Use executeSetValue for both operations if undoSetValue is not provided
  const finalUndoSetValue = undoSetValue || (executeSetValue as unknown as (value: U) => void);

  // Register the command type once on mount
  useEffect(() => {
    if (!isRegistered.current && !hasCommand(commandType)) {
      registerCommand<ValueChangeParams<T, U>>(
        commandType,
        (params) => executeSetValue(params.newValue),
        (params) => finalUndoSetValue(params.oldValue)
      );
      isRegistered.current = true;
    }
  }, [commandType, executeSetValue, finalUndoSetValue, registerCommand, hasCommand]);

  // Return a function to track state changes
  return useCallback(
    (newValue: T, oldValue: U, description?: string) => {
      if (!commandRegistry) {
        throw new Error("Command registry not available - use within StateHistoryProvider");
      }

      // Create and execute the state change command
      const stateChange = createValueChangeCommand<T, U>(
        commandType,
        oldValue,
        newValue,
        description,
        commandRegistry as unknown as Record<string, { execute: () => void; undo: () => void }>
      );
      execute(stateChange);
    },
    [commandType, execute, commandRegistry]
  );
}

/**
 * A complete state management hook with built-in undo/redo support
 *
 * @param commandType - Unique identifier for this state change type
 * @param initialValue - Initial value for the state
 * @returns [currentValue, setValue, resetValue] - Similar to useState but with undo/redo tracking
 *
 * @example
 * const [count, setCount, resetCount] = useHistoryState('counter', 0);
 * setCount(count + 1, 'Increment counter');
 * resetCount(); // Reset to initial value
 */
export function useHistoryState<T>(
  commandType: string,
  initialValue: T
): [T, (newValue: T, description?: string) => void, () => void] {
  // Maintain internal React state
  const [value, setValueDirect] = React.useState<T>(initialValue);
  const { execute, registerCommand, hasCommand, commandRegistry } = useHistoryStateContext();
  const isRegistered = useRef(false);

  // Register the command type once on mount
  useEffect(() => {
    if (!isRegistered.current && !hasCommand(commandType)) {
      registerCommand<ValueChangeParams<T>>(
        commandType,
        (params) => setValueDirect(params.newValue),
        (params) => setValueDirect(params.oldValue)
      );
      isRegistered.current = true;
    }
  }, [commandType, registerCommand, hasCommand]);

  // Create history-aware setter function
  const setValue = useCallback(
    (newValue: T, description?: string) => {
      const stateChange = createValueChangeCommand<T>(
        commandType,
        value,
        newValue,
        description,
        commandRegistry as unknown as Record<string, { execute: () => void; undo: () => void }>
      );
      execute(stateChange);
    },
    [value, commandType, execute, commandRegistry]
  );

  // Create reset function
  const resetValue = useCallback(() => {
    setValue(initialValue, `Reset to initial value`);
  }, [setValue, initialValue]);

  return [value, setValue, resetValue];
}
