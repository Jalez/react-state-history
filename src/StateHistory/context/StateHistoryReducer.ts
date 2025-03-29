/** @format */
import { StateChange, CommandFunction, StateHistory } from "../types";

// Storage key prefix for localStorage
export const STORAGE_KEY_PREFIX = "state_history_";

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
      executeFn: (params: any) => void;
      undoFn: (params: any) => void;
    }
  | { type: "UNREGISTER_COMMAND"; name: string }
  | { type: "@@INIT" };  // Adding support for initialization action

// Define initial state
export const initialState: StateHistory = {
  undoStack: [],
  redoStack: [],
  maxStackSize: 100,
  isPersistent: false,
  commandRegistry: {},
  canUndo: false,
  canRedo: false,
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
      // Calculate new undo stack while respecting maxStackSize
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
      const commandFunction: CommandFunction<any> = {
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

    case "@@INIT": {
      return initialState;
    }

    default:
      return state;
  }
};