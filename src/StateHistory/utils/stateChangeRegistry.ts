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
 * Hook to register a StateChange function with the context registry
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
 * Register a StateChange function with the context registry
 * @deprecated Use useRegisterCommand hook instead
 */
export function registerCommand<T>(
  name: string, 
  executeFn: (params: T) => void,
  undoFn: (params: T) => void
): void {
  console.warn(
    `[Deprecated] registerCommand is using global registry which can cause conflicts. ` +
    `Please use useRegisterCommand hook inside a component to use context-specific registry.`
  );
  
  // This global function is kept for backward compatibility but will warn
  // Users should migrate to the hook-based version
  const ctx = getGlobalRegistryFallback();
  ctx[name] = {
    execute: executeFn as (params: unknown) => void,
    undo: undoFn as (params: unknown) => void
  };
}

// Legacy global registry fallback for backward compatibility
let globalRegistryFallback: Record<string, { execute: Function, undo: Function }> = {};

/**
 * For backward compatibility only - do not use in new code
 * @deprecated
 */
function getGlobalRegistryFallback() {
  return globalRegistryFallback;
}

/**
 * Get a StateChange function from the legacy global registry
 * @deprecated Use useHistoryStateContext().getCommand instead
 */
export function getCommand<T>(name: string): { execute: (params: T) => void, undo: (params: T) => void } | undefined {
  console.warn(
    `[Deprecated] getCommand is using global registry which can cause conflicts. ` +
    `Please use useHistoryStateContext().getCommand instead to use context-specific registry.`
  );
  return globalRegistryFallback[name] as { execute: (params: T) => void, undo: (params: T) => void } | undefined;
}

/**
 * Check if a StateChange exists in the legacy global registry
 * @deprecated Use useHistoryStateContext().hasCommand instead
 */
export function hasCommand(name: string): boolean {
  console.warn(
    `[Deprecated] hasCommand is using global registry which can cause conflicts. ` +
    `Please use useHistoryStateContext().hasCommand instead to use context-specific registry.`
  );
  return !!globalRegistryFallback[name];
}

/**
 * Create a StateChange object from a SerializableStateChange and the context registry
 */
export function hydrateCommand<T>(
  serializableStateChange: SerializableStateChange<T>,
  contextRegistry?: Record<string, { execute: Function, undo: Function }>
): StateChange<T> {
  const { id, commandName, params, description } = serializableStateChange;
  
  // Make sure commandName is valid
  if (!commandName) {
    return createErrorStateChange(id || `invalid-${Date.now()}`, description, params);
  }
  
  // Try to get command from context registry first, fall back to global if necessary
  const registry = contextRegistry || getGlobalRegistryFallback();
  const commandFn = registry[commandName];
  
  if (!commandFn) {
    // Return a StateChange that will try to resolve the command again when executed
    return {
      id,
      description: description || `Pending StateChange: ${commandName}`,
      execute: () => {
        const latestRegistry = contextRegistry || getGlobalRegistryFallback();
        if (latestRegistry[commandName]) {
          return latestRegistry[commandName].execute(params);
        }
        console.error(`Cannot execute unknown StateChange: ${commandName}`);
      },
      undo: () => {
        const latestRegistry = contextRegistry || getGlobalRegistryFallback();
        if (latestRegistry[commandName]) {
          return latestRegistry[commandName].undo(params);
        }
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
  contextRegistry?: Record<string, { execute: Function, undo: Function }>
): StateChange<T> {
  // Use either the provided registry or fall back to global registry
  const registry = contextRegistry || getGlobalRegistryFallback();
  const command = registry[commandName];
  
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