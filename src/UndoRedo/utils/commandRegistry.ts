/** @format */
import { Command } from '../types';

/**
 * Represents a registered command function
 */
export interface CommandFunction {
  /**
   * Execute the command with given parameters
   */
  execute: (params: any) => void;
  
  /**
   * Undo the command with given parameters
   */
  undo: (params: any) => void;
}

/**
 * Registry for storing command functions by name
 */
export type CommandRegistry = Record<string, CommandFunction>;

/**
 * Serializable version of a command
 */
export interface SerializableCommand {
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
  params: any;
  
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
export function registerCommand(
  name: string, 
  executeFn: (params: any) => void,
  undoFn: (params: any) => void
): void {
  if (globalRegistry[name]) {
    console.warn(`Command "${name}" is already registered. Overwriting.`);
  }
  
  globalRegistry[name] = {
    execute: executeFn,
    undo: undoFn
  };
}

/**
 * Get a command function from the registry
 */
export function getCommand(name: string): CommandFunction | undefined {
  return globalRegistry[name];
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
export function hydrateCommand(serializableCommand: SerializableCommand): Command {
  const { id, commandName, params, description } = serializableCommand;
  const commandFn = getCommand(commandName);
  
  if (!commandFn) {
    console.error(`Command function "${commandName}" not found in registry`);
    // Return a placeholder command that logs errors when executed
    return {
      id,
      description: description || `Unknown command: ${commandName}`,
      execute: () => console.error(`Cannot execute unknown command: ${commandName}`),
      undo: () => console.error(`Cannot undo unknown command: ${commandName}`)
    };
  }
  
  return {
    id,
    description,
    execute: () => commandFn.execute(params),
    undo: () => commandFn.undo(params),
    // Store original command info for serialization
    commandName,
    params
  };
}

/**
 * Convert a Command object to a SerializableCommand
 */
export function dehydrateCommand(command: Command): SerializableCommand {
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
export function createRegistryCommand(
  commandName: string,
  params: any,
  id?: string,
  description?: string
): Command {
  const commandFn = getCommand(commandName);
  
  if (!commandFn) {
    throw new Error(`Command function "${commandName}" not found in registry`);
  }
  
  return {
    id: id || `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    description: description || `Command: ${commandName}`,
    execute: () => commandFn.execute(params),
    undo: () => commandFn.undo(params),
    // Store original command info for serialization
    commandName,
    params
  };
}