/** @format */

/**
 * Command Pattern Interface
 * Represents an operation that can be executed and undone
 */
export interface Command {
  /**
   * Execute the command operation
   */
  execute: () => void;

  /**
   * Undo the command operation
   */
  undo: () => void;

  /**
   * Optional unique identifier for the command
   */
  id?: string;

  /**
   * Human-readable description of what the command does
   */
  description?: string;
}

/**
 * Command factory type - creates commands from parameters
 */
export type CommandFactory<T> = (params: T) => Command;

/**
 * State for the command history store
 */
export interface CommandHistoryState {
  /**
   * Stack of commands that can be undone
   */
  undoStack: Command[];

  /**
   * Stack of commands that can be redone
   */
  redoStack: Command[];

  /**
   * Whether there are commands available to undo
   */
  canUndo: boolean;

  /**
   * Whether there are commands available to redo
   */
  canRedo: boolean;

  /**
   * Maximum size of the undo stack
   */
  maxStackSize: number;

  /**
   * Execute a command and add it to the undo stack
   */
  execute: (command: Command) => void;

  /**
   * Undo the last executed command
   */
  undo: () => void;

  /**
   * Redo the last undone command
   */
  redo: () => void;

  /**
   * Clear all command history
   */
  clear: () => void;

  /**
   * Set the maximum size of the undo/redo stacks
   */
  setMaxStackSize: (size: number) => void;

  /**
   * Reset the command history to its initial state
   */
  reset: () => void;
}
