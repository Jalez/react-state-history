/** @format */
import { StateChange } from "../types";
import { createRegistryCommand } from "./stateChangeRegistry";
import { useHistoryStateContext } from "../context/StateHistoryContext";
import { useEffect, useRef } from "react";

/**
 * Generate a unique ID for commands
 */
export function generateCommandId(): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timestampPart = Date.now();
  return `cmd-${randomPart}-${timestampPart}`;
}

/**
 * Creates a StateChange with required properties
 */
export function createCommand(options: {
  execute: () => void;
  undo: () => void;
  description?: string;
  id?: string;
}): StateChange {
  return {
    execute: options.execute,
    undo: options.undo,
    description: options.description || "Unnamed StateChange",
    id: options.id || generateCommandId(),
  };
}

/**
 * Creates a composite StateChange from multiple commands
 */
export function createCompositeCommand(
  commands: StateChange[],
  description?: string
): StateChange {
  return {
    execute: () => commands.forEach((cmd) => cmd.execute()),
    undo: () => [...commands].reverse().forEach((cmd) => cmd.undo()),
    description: description || "Composite StateChange",
    id: generateCommandId(),
  };
}

/**
 * Hook to register a value change StateChange
 */
export function useRegisterValueChangeCommand<T>(
  commandType: string,
  applyChange: (value: T) => void
): void {
  const { registerCommand, hasCommand } = useHistoryStateContext();
  const isRegistered = useRef(false);

  useEffect(() => {
    // Only register if this command type isn't already registered in this context
    // and we haven't registered it yet in this component instance
    if (!isRegistered.current && !hasCommand(commandType)) {
      registerCommand(
        commandType,
        // Execute function sets to new value
        (params: { oldValue: T; newValue: T }) => {
          applyChange(params.newValue);
        },
        // Undo function reverts to old value
        (params: { oldValue: T; newValue: T }) => {
          applyChange(params.oldValue);
        }
      );
      isRegistered.current = true;
    }
  }, [commandType, registerCommand, applyChange, hasCommand]);

  // Listen for custom events for shared state (components with the same command type)
  useEffect(() => {
    // Create a custom event type for this specific command type
    const eventType = `value-change-${commandType}`;

    const handleValueChange = (event: Event) => {
      if (event instanceof CustomEvent && event.detail) {
        const newValue = event.detail.value;
        applyChange(newValue as T);
      }
    };

    // Add event listener
    document.addEventListener(eventType, handleValueChange);

    // Clean up
    return () => {
      document.removeEventListener(eventType, handleValueChange);
    };
  }, [commandType, applyChange]);
}

/**
 * Create a StateChange that handles changing a value
 *
 * @param commandType - Identifier for the type of command
 * @param oldValue - Value to restore during undo
 * @param newValue - Value to set during execute/redo
 * @param description - Human-readable description of the change
 * @param contextRegistry - Optional context-specific command registry
 * @returns A StateChange object that can be executed and undone
 */
export function createValueChangeCommand<T, U = T>(
  commandType: string,
  oldValue: U,
  newValue: T,
  description?: string,
  contextRegistry?: Record<string, { execute: () => void; undo: () => void }>
): StateChange {
  const defaultDescription = `Change from ${String(oldValue)} to ${String(
    newValue
  )}`;

  return createRegistryCommand(
    commandType,
    { oldValue, newValue },
    generateCommandId(),
    description || defaultDescription,
    contextRegistry
  );
}

// Export legacy function for backward compatibility
export { registerCommand } from '../context/StateHistoryContext';
