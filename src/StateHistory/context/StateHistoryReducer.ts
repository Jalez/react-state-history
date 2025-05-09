/** @format */
import { StateChange, CommandFunction, StateHistory } from "../types";
import { createCompositeCommand } from "../utils/stateChangeUtils";

// Storage key prefix for localStorage
export const STORAGE_KEY_PREFIX = "state_history_";

// Export the HistoryAction type
export type { HistoryAction };

// Define action types
type HistoryAction =
  | { type: "EXECUTE"; StateChange: StateChange }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR" }
  | { type: "SET_MAX_STACK_SIZE"; size: number }
  | { type: "TOGGLE_PERSISTENCE" }
  | { type: "LOAD_PERSISTENT_STATE"; state: Partial<StateHistory> }
  | { type: "RECONNECT_COMMANDS"; state: Partial<StateHistory> }
  | {
      type: "REGISTER_COMMAND";
      name: string;
      executeFn: (params: unknown) => void;
      undoFn: (params: unknown) => void;
    }
  | { type: "UNREGISTER_COMMAND"; name: string }
  | { type: "BEGIN_TRANSACTION"; description?: string }
  | { type: "COMMIT_TRANSACTION" }
  | { type: "ABORT_TRANSACTION" }
  | { type: "@@INIT" };

// Define initial state
export const initialState: StateHistory = {
  undoStack: [],
  redoStack: [],
  maxStackSize: 100,
  isPersistent: false,
  commandRegistry: {},
  canUndo: false,
  canRedo: false,
  transactionInProgress: false,
  transactionBuffer: [],
  transactionDescription: undefined,
};

/**
 * Handles adding a new command to the undo stack
 */
function addCommandToUndoStack(state: StateHistory, command: StateChange): Partial<StateHistory> {
  const newUndoStack = [...state.undoStack, command];
  
  // Remove oldest item if exceeding max size
  if (newUndoStack.length > state.maxStackSize) {
    newUndoStack.shift();
  }
  
  return {
    undoStack: newUndoStack,
    redoStack: [], // Clear redo stack on new command
    canUndo: true,
    canRedo: false,
  };
}

/**
 * Creates a composite transaction command from a buffer of commands
 */
function createTransactionCommand(
  state: StateHistory,
  description?: string
): StateChange | undefined {
  // Filter out invalid commands
  const validCommands = state.transactionBuffer.filter(cmd => 
    cmd && typeof cmd.execute === 'function' && typeof cmd.undo === 'function'
  );
  
  if (validCommands.length === 0) {
    return undefined;
  }
  
  // Create a composite command with the transaction description
  return {
    ...createCompositeCommand(validCommands, description || state.transactionDescription),
    commandName: "transaction",
    params: { commands: validCommands }
  };
}

/**
 * Reducer for command history state management
 */
export const commandHistoryReducer = (
  state: StateHistory = initialState,
  action: HistoryAction
): StateHistory => {
  switch (action.type) {
    case "EXECUTE": {
      // If a transaction is in progress, add to buffer instead of undo stack
      if (state.transactionInProgress) {
        return {
          ...state,
          transactionBuffer: [...state.transactionBuffer, action.StateChange],
        };
      }

      // Normal execution (no transaction)
      return {
        ...state,
        ...addCommandToUndoStack(state, action.StateChange)
      };
    }

    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      
      const commandToUndo = state.undoStack[state.undoStack.length - 1];
      const newUndoStack = state.undoStack.slice(0, -1);
      const newRedoStack = [...state.redoStack, commandToUndo];
      
      return {
        ...state,
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        canUndo: newUndoStack.length > 0,
        canRedo: true,
      };
    }

    case "REDO": {
      if (state.redoStack.length === 0) return state;
      
      const commandToRedo = state.redoStack[state.redoStack.length - 1];
      const newRedoStack = state.redoStack.slice(0, -1);
      const newUndoStack = [...state.undoStack, commandToRedo];
      
      return {
        ...state,
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        canUndo: true,
        canRedo: newRedoStack.length > 0,
      };
    }

    case "CLEAR": {
      return {
        ...state,
        undoStack: [],
        redoStack: [],
        canUndo: false,
        canRedo: false,
      };
    }

    case "SET_MAX_STACK_SIZE": {
      let newUndoStack = [...state.undoStack];
      
      // Trim the stack if needed
      if (newUndoStack.length > action.size) {
        newUndoStack = newUndoStack.slice(
          newUndoStack.length - action.size,
          newUndoStack.length
        );
      }
      
      return {
        ...state,
        undoStack: newUndoStack,
        maxStackSize: action.size,
        canUndo: newUndoStack.length > 0,
      };
    }

    case "TOGGLE_PERSISTENCE": {
      return {
        ...state,
        isPersistent: !state.isPersistent,
      };
    }

    case "LOAD_PERSISTENT_STATE": {
      const undoStack = action.state.undoStack || state.undoStack;
      const redoStack = action.state.redoStack || state.redoStack;

      return {
        ...state,
        undoStack,
        redoStack,
        maxStackSize: action.state.maxStackSize || state.maxStackSize,
        isPersistent: action.state.isPersistent ?? state.isPersistent,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
      };
    }

    case "RECONNECT_COMMANDS": {
      return {
        ...state,
        ...action.state,
      };
    }

    case "REGISTER_COMMAND": {
      const commandFunction: CommandFunction<unknown> = {
        execute: action.executeFn,
        undo: action.undoFn,
      };

      return {
        ...state,
        commandRegistry: {
          ...state.commandRegistry,
          [action.name]: commandFunction,
        },
      };
    }

    case "UNREGISTER_COMMAND": {
      const newCommandRegistry = { ...state.commandRegistry };
      delete newCommandRegistry[action.name];

      return {
        ...state,
        commandRegistry: newCommandRegistry,
      };
    }

    case "BEGIN_TRANSACTION": {
      // Don't allow nested transactions
      if (state.transactionInProgress) {
        console.warn("Transaction already in progress. Nested transactions are not supported.");
        return state;
      }

      return {
        ...state,
        transactionInProgress: true,
        transactionBuffer: [],
        transactionDescription: action.description || "Transaction",
      };
    }

    case "COMMIT_TRANSACTION": {
      // If no transaction is in progress or buffer is empty, just reset transaction state
      if (!state.transactionInProgress || state.transactionBuffer.length === 0) {
        return {
          ...state,
          transactionInProgress: false,
          transactionBuffer: [],
          transactionDescription: undefined,
        };
      }

      // Create a transaction command from the buffer
      const transactionCommand = createTransactionCommand(state);
      
      if (!transactionCommand) {
        // No valid commands to commit
        return {
          ...state,
          transactionInProgress: false,
          transactionBuffer: [],
          transactionDescription: undefined,
        };
      }
      
      // Add the transaction command to the undo stack
      return {
        ...state,
        ...addCommandToUndoStack(state, transactionCommand),
        transactionInProgress: false,
        transactionBuffer: [],
        transactionDescription: undefined,
      };
    }

    case "ABORT_TRANSACTION": {
      return {
        ...state,
        transactionInProgress: false,
        transactionBuffer: [],
        transactionDescription: undefined,
      };
    }

    case "@@INIT": {
      return initialState;
    }

    default:
      return state;
  }
};
