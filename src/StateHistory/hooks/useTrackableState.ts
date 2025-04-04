/** @format */
import React, { useCallback, useEffect, useRef } from "react";
import { useHistoryStateContext } from "../context/StateHistoryContext";
import { createValueChangeCommand } from "../utils/stateChangeUtils";

/**
 * The module provides two complementary hooks for state management with undo/redo support:
 *
 * 1. useTrackableState - A lower-level hook for integrating with existing state management
 *    - Works with any state setter function (from useState, useReducer, or custom hooks)
 *    - Requires manual tracking of previous values
 *    - More flexible for complex state management scenarios
 *    - Supports asymmetric execute/undo operations for non-idempotent state changes
 *    - Supports different parameter types for execute and undo operations
 *
 * 2. useHistoryState - A higher-level, all-in-one state management solution
 *    - Combines React's useState with undo/redo capability in one hook
 *    - Automatically tracks current values internally
 *    - Simpler API that mimics useState but with undo/redo support
 *    - Includes a convenient reset function
 *
 * Choose the appropriate hook based on your integration needs and complexity requirements.
 */

// Define value change params type to fix type errors
interface ValueChangeParams<T, U = T> {
  oldValue: U;
  newValue: T;
}

/**
 * A hook that creates value change commands with minimal boilerplate
 *
 * @param commandType - Unique identifier for this StateChange type
 * @param executeSetValue - Function to execute when setting a new value or redoing
 * @param undoSetValue - Optional function for undo operations. If not provided, executeSetValue is used for both
 * @returns A function to update the value that automatically creates undo/redo commands
 *
 * @example
 * // Symmetric operations (existing behavior)
 * const [count, setCount] = useState(0);
 * const trackCount = useTrackableState('counter', setCount);
 * trackCount(count + 1, count, 'Increment counter');
 *
 * @example
 * // Asymmetric operations with same parameter types
 * const itemsRef = useRef<string[]>([]);
 * const addItem = (item) => { itemsRef.current = [...itemsRef.current, item]; };
 * const removeItem = (item) => { itemsRef.current = itemsRef.current.filter(i => i !== item); };
 *
 * // Use with different execute/undo functions
 * const trackItemAddition = useTrackableState('add-item', addItem, removeItem);
 * trackItemAddition('new-item', 'new-item', 'Added new item');
 *
 * @example
 * // Asymmetric operations with different parameter types
 * const itemsRef = useRef<{id: string, name: string}[]>([]);
 * // Add function takes full item object
 * const addItem = (item: {id: string, name: string}) => {
 *   itemsRef.current = [...itemsRef.current, item];
 * };
 * // Remove function only needs the ID
 * const removeItem = (id: string) => {
 *   itemsRef.current = itemsRef.current.filter(i => i.id !== id);
 * };
 *
 * // Use with different parameter types for execute and undo
 * const trackItem = useTrackableState<{id: string, name: string}, string>(
 *   'add-item',
 *   addItem,
 *   removeItem
 * );
 * // Add uses full item, storage uses ID for undo
 * const newItem = {id: '123', name: 'New Item'};
 * trackItem(newItem, newItem.id, 'Added new item');
 */
export function useTrackableState<T, U = T>(
  commandType: string,
  executeSetValue: (value: T) => void,
  undoSetValue?: (value: U) => void
): (newValue: T, oldValue: U, description?: string) => void {
  const { execute, registerCommand, hasCommand } = useHistoryStateContext();
  const { commandRegistry } = useHistoryStateContext();
  const isRegistered = useRef(false);

  // Default to using executeSetValue for both operations if undoSetValue is not provided
  // This cast is safe for the default case where U = T
  const finalUndoSetValue =
    undoSetValue || (executeSetValue as unknown as (value: U) => void);

  // Register the value change command once
  useEffect(() => {
    if (!isRegistered.current && !hasCommand(commandType)) {
      registerCommand<ValueChangeParams<T, U>>(
        commandType,
        (params) => executeSetValue(params.newValue),
        (params) => finalUndoSetValue(params.oldValue)
      );
      isRegistered.current = true;
    }
  }, [
    commandType,
    executeSetValue,
    finalUndoSetValue,
    registerCommand,
    hasCommand,
  ]);

  // Return a function that creates and executes the StateChange
  return useCallback(
    (newValue: T, oldValue: U, description?: string) => {
      if (!commandRegistry) {
        throw new Error(
          "Command registry is not available. Ensure you are using this hook within a StateHistoryProvider."
        );
      }

      // Create a value change command with potentially different types for new and old values
      const stateChange = createValueChangeCommand<T, U>(
        commandType,
        oldValue,
        newValue,
        description,
        commandRegistry as unknown as Record<
          string,
          { execute: () => void; undo: () => void }
        >
      );
      execute(stateChange);
    },
    [commandType, execute, commandRegistry]
  );
}

/**
 * A simpler version of useTrackableState that internally manages state
 *
 * @param commandType Unique identifier for this StateChange type
 * @param initialValue Initial value for the state
 * @returns A tuple of [value, setValue, resetValue]
 */
export function useHistoryState<T>(
  commandType: string,
  initialValue: T
): [T, (newValue: T, description?: string) => void, () => void] {
  const [value, setValueDirect] = React.useState<T>(initialValue);
  const { execute, registerCommand, hasCommand } = useHistoryStateContext();
  const { commandRegistry } = useHistoryStateContext();
  const isRegistered = useRef(false);

  // Register the StateChange type once
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

  // StateChange-wrapped setter
  const setValue = useCallback(
    (newValue: T, description?: string) => {
      const stateChange = createValueChangeCommand<T>(
        commandType,
        value,
        newValue,
        description,
        commandRegistry as unknown as Record<
          string,
          { execute: () => void; undo: () => void }
        >
      );
      execute(stateChange);
    },
    [value, commandType, execute, commandRegistry]
  );

  // Reset to initial value
  const resetValue = useCallback(() => {
    setValue(initialValue, `Reset to initial value: ${String(initialValue)}`);
  }, [setValue, initialValue]);

  return [value, setValue, resetValue];
}
