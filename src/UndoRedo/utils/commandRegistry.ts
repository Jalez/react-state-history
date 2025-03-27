/** @format */
import { Command } from '../types';

/**
 * Represents a registered command function
 */
export interface CommandFunction<T = unknown> {
  /**
   * Execute the command with given parameters
   */
  execute: (params: T) => void;
  
  /**
   * Undo the command with given parameters
   */
  undo: (params: T) => void;
}

/**
 * Registry for storing command functions by name
 */
export type CommandRegistry = Record<string, CommandFunction<unknown>>;

/**
 * Serializable version of a command
 */
export interface SerializableCommand<T = unknown> {
  /**
   * Unique identifier for the command
   */
  id: string;
  
  /**
   * Name of the registered command function
   */
  commandName: string;
  
  /**
   * Parameters needed to execute/undo the command
   */
  params: T;
  
  /**
   * Human-readable description of what the command does
   */
  description?: string;
}

// The global registry of command functions
const globalRegistry: CommandRegistry = {};

/**
 * Register a command function with the registry
 */
export function registerCommand<T>(
  name: string, 
  executeFn: (params: T) => void,
  undoFn: (params: T) => void
): void {
  if (globalRegistry[name]) {
    console.warn(`Command "${name}" is already registered. Overwriting.`);
  }
  
  globalRegistry[name] = {
    execute: executeFn as (params: unknown) => void,
    undo: undoFn as (params: unknown) => void
  };
}

/**
 * Get a command function from the registry
 */
export function getCommand<T>(name: string): CommandFunction<T> | undefined {
  return globalRegistry[name] as CommandFunction<T> | undefined;
}

/**
 * Check if a command exists in the registry
 */
export function hasCommand(name: string): boolean {
  return !!globalRegistry[name];
}

/**
 * Create a Command object from a SerializableCommand and the registry
 */
export function hydrateCommand<T>(serializableCommand: SerializableCommand<T>): Command<T> {
  const { id, commandName, params, description } = serializableCommand;
  const commandFn = getCommand<T>(commandName);
  
  if (!commandFn) {
    console.error(`Command function "${commandName}" not found in registry`);
    // Return a placeholder command that logs errors when executed
    return {
      id,
      description: description || `Unknown command: ${commandName}`,
      execute: () => console.error(`Cannot execute unknown command: ${commandName}`),
      undo: () => console.error(`Cannot undo unknown command: ${commandName}`),
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
 * Convert a Command object to a SerializableCommand
 */
export function dehydrateCommand<T>(command: Command<T>): SerializableCommand<T> {
  if (!command.commandName || command.params === undefined) {
    throw new Error('Command is not serializable: missing commandName or params');
  }
  
  return {
    id: command.id || '',
    commandName: command.commandName,
    params: command.params,
    description: command.description
  };
}

/**
 * Create a command using the registry
 */
export function createRegistryCommand<T>(
  commandName: string,
  params: T,
  id?: string,
  description?: string
): Command<T> {
  const commandFn = getCommand<T>(commandName);
  
  if (!commandFn) {
    throw new Error(`Command function "${commandName}" not found in registry`);
  }
  
  return {
    id: id || `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    description: description || `Command: ${commandName}`,
    execute: () => commandFn.execute(params),
    undo: () => commandFn.undo(params),
    commandName,
    params
  };
}