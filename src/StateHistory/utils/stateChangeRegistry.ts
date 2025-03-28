/** @format */
import { StateChange } from '../types';

/**
 * Represents a registered StateChange function
 */
export interface CommandFunction<T = unknown> {
  /**
   * Execute the StateChange with given parameters
   */
  execute: (params: T) => void;
  
  /**
   * Undo the StateChange with given parameters
   */
  undo: (params: T) => void;
}

/**
 * Registry for storing StateChange functions by name
 */
export type CommandRegistry = Record<string, CommandFunction<unknown>>;

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

// The global registry of StateChange functions
const globalRegistry: CommandRegistry = {};

/**
 * Register a StateChange function with the registry
 */
export function registerCommand<T>(
  name: string, 
  executeFn: (params: T) => void,
  undoFn: (params: T) => void
): void {
  if (globalRegistry[name]) {
    console.warn(`StateChange "${name}" is already registered. Overwriting.`);
  }
  
  globalRegistry[name] = {
    execute: executeFn as (params: unknown) => void,
    undo: undoFn as (params: unknown) => void
  };
}

/**
 * Get a StateChange function from the registry
 */
export function getCommand<T>(name: string): CommandFunction<T> | undefined {
  return globalRegistry[name] as CommandFunction<T> | undefined;
}

/**
 * Check if a StateChange exists in the registry
 */
export function hasCommand(name: string): boolean {
  return !!globalRegistry[name];
}

/**
 * Create a StateChange object from a SerializableStateChange and the registry
 */
export function hydrateCommand<T>(SerializableStateChange: SerializableStateChange<T>): StateChange<T> {
  const { id, commandName, params, description } = SerializableStateChange;
  const commandFn = getCommand<T>(commandName);
  
  if (!commandFn) {
    console.error(`StateChange function "${commandName}" not found in registry`);
    // Return a placeholder StateChange that logs errors when executed
    return {
      id,
      description: description || `Unknown StateChange: ${commandName}`,
      execute: () => console.error(`Cannot execute unknown StateChange: ${commandName}`),
      undo: () => console.error(`Cannot undo unknown StateChange: ${commandName}`),
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
 * Convert a StateChange object to a SerializableStateChange
 */
export function dehydrateCommand<T>(StateChange: StateChange<T>): SerializableStateChange<T> {
  if (!StateChange.commandName || StateChange.params === undefined) {
    throw new Error('StateChange is not serializable: missing commandName or params');
  }
  
  return {
    id: StateChange.id || '',
    commandName: StateChange.commandName,
    params: StateChange.params,
    description: StateChange.description
  };
}

/**
 * Create a StateChange using the registry
 */
export function createRegistryCommand<T>(
  commandName: string,
  params: T,
  id?: string,
  description?: string
): StateChange<T> {
  const commandFn = getCommand<T>(commandName);
  
  if (!commandFn) {
    throw new Error(`StateChange function "${commandName}" not found in registry`);
  }
  
  return {
    id: id || `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    description: description || `StateChange: ${commandName}`,
    execute: () => commandFn.execute(params),
    undo: () => commandFn.undo(params),
    commandName,
    params
  };
}