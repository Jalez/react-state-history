/** @format */
import React, { useCallback, useEffect, useRef } from 'react';
import { useCommandHistory } from '../context/CommandHistoryContext';
import { registerValueChangeCommand, createValueChangeCommand } from '../utils/commandUtils';

/**
 * A hook that creates value change commands with minimal boilerplate
 * 
 * @param commandType Unique identifier for this command type
 * @param setValue Function to set the value (e.g., from useState)
 * @returns A function to update the value that automatically creates undo/redo commands
 */
export function useValueCommand<T>(
  commandType: string,
  setValue: (value: T) => void
): (newValue: T, oldValue: T, description?: string) => void {
  const { execute } = useCommandHistory();
  const isRegistered = useRef(false);
  
  // Register the command type once
  useEffect(() => {
    if (!isRegistered.current) {
      registerValueChangeCommand<T>(commandType, setValue);
      isRegistered.current = true;
    }
  }, [commandType, setValue]);

  // Return a function that creates and executes the command
  return useCallback(
    (newValue: T, oldValue: T, description?: string) => {
      const command = createValueChangeCommand(
        commandType,
        oldValue,
        newValue,
        description || `Change value from ${String(oldValue)} to ${String(newValue)}`
      );
      
      execute(command);
    },
    [commandType, execute]
  );
}

/**
 * A simpler version of useValueCommand for use with React's useState
 * Automatically manages state and creates undoable commands
 * 
 * @param commandType Unique identifier for this command type
 * @param initialValue Initial value for the state
 * @returns A tuple of [value, setValue, resetValue]
 */
export function useHistoryState<T>(
  commandType: string,
  initialValue: T
): [T, (newValue: T, description?: string) => void, () => void] {
  const [value, setValueDirect] = React.useState<T>(initialValue);
  const { execute } = useCommandHistory();
  const isRegistered = useRef(false);
  
  // Register the command type once
  useEffect(() => {
    if (!isRegistered.current) {
      registerValueChangeCommand<T>(commandType, setValueDirect);
      isRegistered.current = true;
    }
  }, [commandType]);

  // Command-wrapped setter
  const setValue = useCallback(
    (newValue: T, description?: string) => {
      const command = createValueChangeCommand(
        commandType,
        value,
        newValue,
        description || `Change from ${String(value)} to ${String(newValue)}`
      );
      
      execute(command);
    },
    [value, commandType, execute]
  );
  
  // Reset to initial value
  const resetValue = useCallback(
    () => {
      const command = createValueChangeCommand(
        commandType,
        value,
        initialValue,
        `Reset to initial value: ${String(initialValue)}`
      );
      
      execute(command);
    },
    [value, initialValue, commandType, execute]
  );

  return [value, setValue, resetValue];
}