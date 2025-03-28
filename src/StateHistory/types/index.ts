/** @format */

/**
 * StateChange Pattern Interface
 * Represents an operation that can be executed and undone
 */
export interface StateChange<T = unknown> {
  /**
   * Execute the StateChange operation
   */
  execute: () => void;

  /**
   * Undo the StateChange operation
   */
  undo: () => void;

  /**
   * Optional unique identifier for the StateChange
   */
  id?: string;

  /**
   * Human-readable description of what the StateChange does
   */
  description?: string;

  /**
   * Optional registry StateChange name (for serializable commands)
   */
  commandName?: string;

  /**
   * Optional parameters for registry-based commands
   */
  params?: T;
}

/**
 * StateChange factory type - creates commands from parameters
 */
export type StateChangeFactory<T> = (params: T) => StateChange;

/**
 * State for the StateChange history store
 */
export interface StateHistory {
  /**
   * Stack of commands that can be undone
   */
  undoStack: StateChange[];

  /**
   * Stack of commands that can be redone
   */
  redoStack: StateChange[];

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
   * Whether the StateChange history should persist between page reloads
   */
  isPersistent: boolean;
}

/**
 * Actions for the StateChange history reducer
 */
export type StateHistoryAction =
  | { type: "EXECUTE"; StateChange: StateChange }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR" }
  | { type: "SET_MAX_STACK_SIZE"; size: number }
  | { type: "TOGGLE_PERSISTENCE" }
  | { type: "LOAD_PERSISTENT_STATE"; state: Partial<StateHistory> };

/**
 * Context interface that extends the state with available operations
 */
export interface StateHistoryContextType extends StateHistory {
  /**
   * Execute a StateChange and add it to the undo stack
   */
  execute: (StateChange: StateChange) => void;

  /**
   * Undo the last executed StateChange
   */
  undo: () => void;

  /**
   * Redo the last undone StateChange
   */
  redo: () => void;

  /**
   * Clear all StateChange history
   */
  clear: () => void;

  /**
   * Set the maximum size of the undo/redo stacks
   */
  setMaxStackSize: (size: number) => void;

  /**
   * Toggle StateChange persistence
   */
  togglePersistence: () => void;
}

/**
 * Props for the StateHistoryProvider component
 */
export interface StateHistoryProviderProps {
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
