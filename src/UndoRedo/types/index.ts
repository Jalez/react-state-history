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

  /**
   * Optional registry command name (for serializable commands)
   */
  commandName?: string;

  /**
   * Optional parameters for registry-based commands
   */
  params?: any;
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
   * Whether the command history should persist between page reloads
   */
  isPersistent: boolean;
}

/**
 * Actions for the command history reducer
 */
export type CommandHistoryAction =
  | { type: "EXECUTE"; command: Command }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR" }
  | { type: "SET_MAX_STACK_SIZE"; size: number }
  | { type: "TOGGLE_PERSISTENCE" }
  | { type: "LOAD_PERSISTENT_STATE"; state: Partial<CommandHistoryState> };

/**
 * Context interface that extends the state with available operations
 */
export interface CommandHistoryContextType extends CommandHistoryState {
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
   * Toggle command persistence
   */
  togglePersistence: () => void;
}

/**
 * Props for the CommandHistoryProvider component
 */
export interface CommandHistoryProviderProps {
  /**
   * Child components
   */
  children: React.ReactNode;

  /**
   * Maximum size for the undo/redo stacks
   */
  maxStackSize?: number;

  /**
   * Custom storage key for persistence
   */
  storageKey?: string;

  /**
   * Whether persistence is enabled by default
   */
  defaultPersistent?: boolean;
}
