/** @format */
import { CommandHistoryState, CommandHistoryAction } from '../types';

// Storage key for persistent state
export const STORAGE_KEY_PREFIX = "undoredo_history_";

// Initial state
export const initialState: CommandHistoryState = {
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,
  maxStackSize: 50,
  isPersistent: false,
};

// Placeholder function for deserialized commands
export const placeholderFunction = () => {
  // This doesn't need to do anything, as we'll use component-level
  // logic to reconstruct the state
  console.log('Executing placeholder function');
};

/**
 * Reducer function for command history state
 */
export function commandHistoryReducer(
  state: CommandHistoryState,
  action: CommandHistoryAction
): CommandHistoryState {
  switch (action.type) {
    case "EXECUTE": {
      const command = action.command;
      if (!command) return state;

      // The command execution happens outside the reducer
      const newUndoStack = [...state.undoStack, command];

      if (newUndoStack.length > state.maxStackSize) {
        newUndoStack.shift();
      }

      return {
        ...state,
        undoStack: newUndoStack,
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    }

    case "UNDO": {
      if (state.undoStack.length === 0) return state;

      const commandToUndo = state.undoStack[state.undoStack.length - 1];
      // The command undo happens outside the reducer
      
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
      // The command execution happens outside the reducer
      
      const newRedoStack = state.redoStack.slice(0, -1);
      const newUndoStack = [...state.undoStack, commandToRedo];

      if (newUndoStack.length > state.maxStackSize) {
        newUndoStack.shift();
      }

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
      const validSize = Math.max(1, action.size);
      let newUndoStack = state.undoStack;

      if (newUndoStack.length > validSize) {
        newUndoStack = newUndoStack.slice(-validSize);
      }

      return {
        ...state,
        maxStackSize: validSize,
        undoStack: newUndoStack,
      };
    }

    case "TOGGLE_PERSISTENCE": {
      const isPersistent = !state.isPersistent;
      return {
        ...state,
        isPersistent,
      };
    }

    case "LOAD_PERSISTENT_STATE": {
      return {
        ...state,
        ...action.state,
        canUndo: action.state.undoStack
          ? action.state.undoStack.length > 0
          : false,
        canRedo: action.state.redoStack
          ? action.state.redoStack.length > 0
          : false,
      };
    }

    default:
      return state;
  }
}