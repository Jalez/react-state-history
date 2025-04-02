/** @format */
import { StateChange, CommandFunction, StateHistory } from "../types";

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
      const newUndoStack = [...state.undoStack, action.StateChange];
      if (newUndoStack.length > state.maxStackSize) {
        newUndoStack.shift(); // Remove oldest item if exceeding max size
      }
      return {
        ...state,
        undoStack: newUndoStack,
        redoStack: [], // Clear redo stack on new command
        canUndo: true,
        canRedo: false,
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
      // Adjust undo stack if needed
      let newUndoStack = [...state.undoStack];
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

      // Only merge specified fields
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
      // If already in a transaction, don't start a new one (no nested transactions)
      if (state.transactionInProgress) {
        console.warn(
          "Transaction already in progress. Nested transactions are not supported."
        );
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
      // If no transaction is in progress or buffer is empty, just return the current state
      if (
        !state.transactionInProgress ||
        state.transactionBuffer.length === 0
      ) {
        return {
          ...state,
          transactionInProgress: false,
          transactionBuffer: [],
          transactionDescription: undefined,
        };
      }

      // Create a composite command from all buffered commands
      const compositeCommand: StateChange = {
        id: `transaction-${Date.now()}`,
        description: state.transactionDescription,
        // The execute function will execute all commands in the buffer
        execute: () => state.transactionBuffer.forEach((cmd) => cmd.execute()),
        // The undo function will undo all commands in reverse order
        undo: () =>
          [...state.transactionBuffer].reverse().forEach((cmd) => cmd.undo()),
        // Store all commands for potential serialization
        params: { commands: state.transactionBuffer },
        commandName: "transaction",
      };

      // Add the composite command to the undo stack
      const newUndoStack = [...state.undoStack, compositeCommand];
      if (newUndoStack.length > state.maxStackSize) {
        newUndoStack.shift(); // Remove oldest item if exceeding max size
      }

      return {
        ...state,
        undoStack: newUndoStack,
        redoStack: [], // Clear redo stack on new command
        transactionInProgress: false,
        transactionBuffer: [],
        transactionDescription: undefined,
        canUndo: true,
        canRedo: false,
      };
    }

    case "ABORT_TRANSACTION": {
      // Simply reset the transaction state without adding anything to the undo stack
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
