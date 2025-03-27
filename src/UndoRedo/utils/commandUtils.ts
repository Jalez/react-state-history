/** @format */
import { Command } from '../types';
import { createRegistryCommand, registerCommand } from './commandRegistry';

/**
 * Generate a unique ID for commands
 */
export function generateCommandId(): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timestampPart = Date.now();
  return `cmd-${randomPart}-${timestampPart}`;
}

/**
 * Creates a command with required properties
 */
export function createCommand(options: {
  execute: () => void;
  undo: () => void;
  description?: string;
  id?: string;
}): Command {
  return {
    execute: options.execute,
    undo: options.undo,
    description: options.description || 'Unnamed command',
    id: options.id || generateCommandId(),
  };
}

/**
 * Creates a composite command from multiple commands
 */
export function createCompositeCommand(commands: Command[], description?: string): Command {
  return {
    execute: () => commands.forEach(cmd => cmd.execute()),
    undo: () => [...commands].reverse().forEach(cmd => cmd.undo()),
    description: description || 'Composite command',
    id: generateCommandId(),
  };
}

/**
 * Analyzes a serialized command string to determine its behavior
 * This is useful when dealing with persisted commands
 */
export function analyzeCommandString(cmdString: string): { 
  type: 'increment' | 'decrement' | 'reset' | 'unknown', 
  target?: string 
} {
  // Check for increment patterns
  if (cmdString.includes('c + 1') || cmdString.includes('count + 1') || 
      cmdString.includes('setValue(newValue)') && cmdString.includes('newValue')) {
    return { type: 'increment', target: 'count' };
  }
  
  // Check for decrement patterns
  if (cmdString.includes('c - 1') || cmdString.includes('count - 1') ||
      cmdString.includes('setValue(') && cmdString.includes('count - 1')) {
    return { type: 'decrement', target: 'count' };
  }

  // Check for reset patterns
  if (cmdString.includes('setValue(0)') || cmdString.includes('setCount(0)')) {
    return { type: 'reset', target: 'count' };
  }
  
  return { type: 'unknown' };
}

/**
 * Creates a registry-based command
 */
export function createRegisteredCommand(
  commandName: string, 
  params: any, 
  description?: string
): Command {
  return createRegistryCommand(
    commandName,
    params,
    generateCommandId(),
    description
  );
}

/**
 * Registers a value change command
 * This is a common pattern for handling state changes
 */
export function registerValueChangeCommand<T>(
  commandType: string, 
  applyChange: (value: T) => void
): void {
  registerCommand(
    commandType,
    // Execute function sets to new value
    (params: { oldValue: T, newValue: T }) => {
      applyChange(params.newValue);
    },
    // Undo function reverts to old value
    (params: { oldValue: T, newValue: T }) => {
      applyChange(params.oldValue);
    }
  );
}

/**
 * Create a command that handles changing a value
 */
export function createValueChangeCommand<T>(
  commandType: string,
  oldValue: T,
  newValue: T,
  description?: string
): Command {
  return createRegisteredCommand(
    commandType,
    { oldValue, newValue },
    description || `Change from ${oldValue} to ${newValue}`
  );
}