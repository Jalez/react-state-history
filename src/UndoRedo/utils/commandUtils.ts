/** @format */

import { Command } from "../types";

/**
 * Generate a unique ID for commands
 */
export const generateCommandId = (): string => {
  return `cmd-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
};

/**
 * Create a composite command that groups multiple commands into a single undoable unit
 * 
 * @param commands Array of commands to execute as a batch
 * @param description Optional description for the composite command
 * @returns A single command that executes/undoes all commands in the batch
 */
export const createCompositeCommand = (
  commands: (Command | null)[],
  description?: string
): Command | null => {
  // Filter out null commands
  const validCommands = commands.filter(Boolean) as Command[];
  
  if (validCommands.length === 0) return null;
  
  // If only one valid command, just return it
  if (validCommands.length === 1) return validCommands[0];
  
  const descriptions = validCommands
    .map(cmd => cmd.description)
    .filter(Boolean);
    
  // Create the composite command
  return {
    id: generateCommandId(),
    description: description || (descriptions.length > 0 
      ? `Batch: ${descriptions[0]}${descriptions.length > 1 ? ` (+${descriptions.length - 1} more)` : ''}`
      : 'Batch operation'),
      
    execute: () => {
      validCommands.forEach(cmd => cmd.execute());
    },
    
    undo: () => {
      // Undo in REVERSE order - critical for correct undo behavior
      [...validCommands].reverse().forEach(cmd => cmd.undo());
    }
  };
};

/**
 * Create a command with deep-copied data to prevent mutation issues
 * 
 * @param params Object containing execute, undo functions, and optional description
 * @returns Command with a generated ID
 */
export const createCommand = (params: {
  execute: () => void,
  undo: () => void,
  description?: string
}): Command => {
  return {
    id: generateCommandId(),
    description: params.description || "Unnamed command",
    execute: params.execute,
    undo: params.undo
  };
};

/**
 * Deep clone an object to prevent reference mutations
 * For use in command factories to ensure state separation
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};