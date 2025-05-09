/** @format */
import { StateChange } from '../types';
import { useHistoryStateContext } from '../context/StateHistoryContext';
import { useEffect } from 'react';

/**
 * Serializable version of a StateChange
 */
export interface SerializableStateChange<T = unknown> {
  /**
   * Unique identifier for the StateChange
   */
  id: string;
  
  /**
   * Name of the registered StateChange function
   */
  commandName: string;
  
  /**
   * Parameters needed to execute/undo the StateChange
   */
  params: T;
  
  /**
   * Human-readable description of what the StateChange does
   */
  description?: string;
}

/**
 * Type definition for the CommandFunction interface
 * Re-exporting from types for backward compatibility
 */
export type { CommandFunction } from '../types';

/**
 * Type definition for the CommandRegistry interface
 * Re-exporting from types for backward compatibility
 */
export type { CommandRegistry } from '../types';

/**
 * Hook to register a command function with the context registry
 */
export function useRegisterCommand<T>(
  name: string, 
  executeFn: (params: T) => void,
  undoFn: (params: T) => void
): void {
  const { registerCommand, unregisterCommand } = useHistoryStateContext();
  
  // Register command on mount and clean up on unmount
  useEffect(() => {
    registerCommand(name, executeFn, undoFn);
    
    // Return cleanup function to unregister the command when the component unmounts
    return () => {
      unregisterCommand(name);
    };
  }, [name, registerCommand, unregisterCommand, executeFn, undoFn]);
}

/**
 * Create a StateChange object from a SerializableStateChange and the context registry
 */
export function hydrateCommand<T>(
  serializableStateChange: SerializableStateChange<T>,
  contextRegistry?: Record<string, { execute: (params: T) => void; undo: (params: T) => void }>
): StateChange<T> {
  const { id, commandName, params, description } = serializableStateChange;
  
  // Make sure commandName is valid
  if (!commandName) {
    return createErrorStateChange(id || `invalid-${Date.now()}`, description, params);
  }
  
  // Try to get command from context registry
  const registry = contextRegistry;
  const commandFn = registry?.[commandName];
  
  // For transaction commands, ensure the nested commands in params.commands
  // are also properly hydrated
  if (commandName === 'transaction' && params && typeof params === 'object') {
    const transactionParams = params as { commands?: StateChange[] };
    if (transactionParams.commands && Array.isArray(transactionParams.commands)) {
      transactionParams.commands = transactionParams.commands.map((cmd: StateChange) => {
        // If this is already a full StateChange with execute and undo methods, return it
        if (cmd && typeof cmd.execute === 'function' && typeof cmd.undo === 'function') {
          return cmd;
        }
        // Otherwise, try to hydrate it if it has a commandName
        if (cmd && cmd.commandName) {
          // Ensure the cmd has an id before hydrating
          const cmdWithId = {
            ...cmd,
            id: cmd.id || `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          };
          return hydrateCommand(cmdWithId as SerializableStateChange<T>, contextRegistry);
        }
        // If all else fails, return the original command
        return cmd;
      });
    }
  }
  
  if (!commandFn) {
    // Return a StateChange that will log an error when executed
    return {
      id,
      description: description || `Pending StateChange: ${commandName}`,
      execute: () => {
        console.error(`Cannot execute unknown StateChange: ${commandName}`);
      },
      undo: () => {
        console.error(`Cannot undo unknown StateChange: ${commandName}`);
      },
      commandName,
      params
    };
  }
  
  return {
    id,
    description,
    execute: () => commandFn.execute(params),
    undo: () => commandFn.undo(params),
    commandName,
    params
  };
}

/**
 * Helper to create error/fallback StateChange objects
 */
function createErrorStateChange<T>(id: string, description?: string, params?: T): StateChange<T> {
  return {
    id,
    description: description || 'Invalid StateChange',
    execute: () => console.error(`Cannot execute invalid StateChange`),
    undo: () => console.error(`Cannot undo invalid StateChange`),
    params
  };
}

/**
 * Convert a StateChange to a serializable format
 */
export function dehydrateCommand<T>(stateChange: StateChange<T>): SerializableStateChange<T> {
  if (!stateChange.commandName) {
    throw new Error('Cannot dehydrate a StateChange without a commandName');
  }
  
  return {
    id: stateChange.id || `cmd-${Date.now()}`,
    commandName: stateChange.commandName,
    params: stateChange.params as T,
    description: stateChange.description
  };
}

/**
 * Creates a StateChange based on a registered command
 */
export function createRegistryCommand<T>(
  commandName: string,
  params: T,
  id: string,
  description?: string,
  contextRegistry?: Record<string, { execute: (params: T) => void; undo: (params: T) => void }>
): StateChange<T> {
  // Use the provided registry
  const command = contextRegistry?.[commandName];
  
  if (!command) {
    // If the command doesn't exist, create a placeholder that logs errors
    console.error(`Command "${commandName}" is not registered`);
    return {
      id,
      description: description || `Unknown Command: ${commandName}`,
      execute: () => console.error(`Cannot execute unknown command: ${commandName}`),
      undo: () => console.error(`Cannot undo unknown command: ${commandName}`),
      commandName,
      params,
    };
  }
  
  return {
    id,
    description: description || `Command: ${commandName}`,
    execute: () => command.execute(params),
    undo: () => command.undo(params),
    commandName,
    params
  };
}

// Export legacy register command function for backward compatibility
export { registerCommand } from '../context/StateHistoryContext';
export { hasCommand } from '../context/StateHistoryContext';
export { getCommand } from '../context/StateHistoryContext';