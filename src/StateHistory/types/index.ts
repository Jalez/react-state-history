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

  /**
   * Per-context command registry to isolate command types between different provider instances
   */
  commandRegistry: CommandRegistry;

  /**
   * Whether a transaction is currently in progress
   */
  transactionInProgress: boolean;

  /**
   * Buffer to store commands during a transaction
   */
  transactionBuffer: StateChange[];

  /**
   * Description of the current transaction
   */
  transactionDescription?: string;
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
  | { type: "LOAD_PERSISTENT_STATE"; state: Partial<StateHistory> }
  | {
      type: "REGISTER_COMMAND";
      name: string;
      executeFn: <T>(params: T) => void;
      undoFn: <T>(params: T) => void;
    }
  | { type: "UNREGISTER_COMMAND"; name: string }
  | { type: "BEGIN_TRANSACTION"; description?: string }
  | { type: "COMMIT_TRANSACTION" }
  | { type: "ABORT_TRANSACTION" };

/**
 * Context interface that extends the state with available operations
 */
export interface StateHistoryContextType extends StateHistory {
  /**
   * Whether the initial state has been loaded from localStorage
   * This is useful for components that need to wait for the initial state to be loaded
   */
  initialStateLoaded: boolean;
  /**
   * True if an undo operation is currently in progress
   */
  isUndoing: boolean;
  /**
   * True if a redo operation is currently in progress
   */
  isRedoing: boolean;
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

  /**
   * Register a command in the context-specific registry
   */
  registerCommand: <T>(
    name: string,
    executeFn: (params: T) => void,
    undoFn: (params: T) => void
  ) => void;

  /**
   * Unregister a command from the context-specific registry
   */
  unregisterCommand: (name: string) => void;

  /**
   * Get a command from the context-specific registry
   */
  getCommand: <T>(name: string) => CommandFunction<T> | undefined;

  /**
   * Check if a command exists in the context-specific registry
   */
  hasCommand: (name: string) => boolean;

  /**
   * Begin a transaction to group multiple operations
   */
  beginTransaction: (description?: string) => void;

  /**
   * Commit a transaction, combining all buffered operations into a single undo/redo step
   */
  commitTransaction: () => void;

  /**
   * Abort a transaction, discarding all buffered operations
   */
  abortTransaction: () => void;

  /**
   * Whether a transaction is currently in progress
   */
  isTransactionInProgress: boolean;

  /**
   * The type of the last command operation: 'undo', 'redo', 'execute', or undefined
   */
  lastCommandType?: 'undo' | 'redo' | 'execute';
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
