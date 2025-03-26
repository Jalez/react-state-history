/** @format */
import React, {
  createContext,
  useContext,
  ReactNode,
  useReducer,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Command } from "../types";

// Storage key for persistent state
const STORAGE_KEY_PREFIX = "undoredo_history_";

// Define the state shape
interface CommandHistoryState {
  undoStack: Command[];
  redoStack: Command[];
  canUndo: boolean;
  canRedo: boolean;
  maxStackSize: number;
  isPersistent: boolean;
}

// Define the actions for the reducer
type CommandHistoryAction =
  | { type: "EXECUTE"; command: Command }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR" }
  | { type: "SET_MAX_STACK_SIZE"; size: number }
  | { type: "TOGGLE_PERSISTENCE" }
  | { type: "LOAD_PERSISTENT_STATE"; state: Partial<CommandHistoryState> };

// Initial state
const initialState: CommandHistoryState = {
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,
  maxStackSize: 50,
  isPersistent: false,
};

// Reducer function
function commandHistoryReducer(
  state: CommandHistoryState,
  action: CommandHistoryAction
): CommandHistoryState {
  switch (action.type) {
    case "EXECUTE": {
      const command = action.command;
      if (!command) return state;

      command.execute();
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
      commandToUndo.undo();

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
      commandToRedo.execute();

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
      // Clear local storage if turning off persistence
      if (!isPersistent) {
        localStorage.removeItem(STORAGE_KEY_PREFIX + window.location.pathname);
      }
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

// Define the context shape
interface CommandHistoryContextType extends CommandHistoryState {
  execute: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  setMaxStackSize: (size: number) => void;
  togglePersistence: () => void;
}

// Create the context
const CommandHistoryContext = createContext<
  CommandHistoryContextType | undefined
>(undefined);

// Props for the provider
interface CommandHistoryProviderProps {
  children: ReactNode;
  maxStackSize?: number;
  storageKey?: string;
  defaultPersistent?: boolean;
}

/**
 * Provider component for command history
 * Makes command history state and methods available to all child components
 */
export const CommandHistoryProvider: React.FC<CommandHistoryProviderProps> = ({
  children,
  maxStackSize,
  storageKey,
  defaultPersistent = false,
}) => {
  // Generate storage key
  const finalStorageKey =
    STORAGE_KEY_PREFIX + (storageKey || window.location.pathname);

  // Initialize state with custom max stack size if provided
  const [state, dispatch] = useReducer(commandHistoryReducer, {
    ...initialState,
    maxStackSize: maxStackSize || initialState.maxStackSize,
    isPersistent: defaultPersistent,
  });

  // Load persistent state on mount
  useEffect(() => {
    if (state.isPersistent) {
      const savedState = localStorage.getItem(finalStorageKey);
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          // Re-hydrate the commands with their functions
          if (parsedState.undoStack) {
            parsedState.undoStack = parsedState.undoStack.map((cmd: any) => ({
              ...cmd,
              execute: new Function("return " + cmd.execute)(),
              undo: new Function("return " + cmd.undo)(),
            }));
          }
          if (parsedState.redoStack) {
            parsedState.redoStack = parsedState.redoStack.map((cmd: any) => ({
              ...cmd,
              execute: new Function("return " + cmd.execute)(),
              undo: new Function("return " + cmd.undo)(),
            }));
          }
          dispatch({ type: "LOAD_PERSISTENT_STATE", state: parsedState });
        } catch (error) {
          console.error("Error loading persistent state:", error);
        }
      }
    }
  }, [finalStorageKey]);

  // Save state when it changes and persistence is enabled
  useEffect(() => {
    if (state.isPersistent) {
      const stateToSave = {
        undoStack: state.undoStack.map((cmd) => ({
          ...cmd,
          execute: cmd.execute.toString(),
          undo: cmd.undo.toString(),
        })),
        redoStack: state.redoStack.map((cmd) => ({
          ...cmd,
          execute: cmd.execute.toString(),
          undo: cmd.undo.toString(),
        })),
        maxStackSize: state.maxStackSize,
        isPersistent: state.isPersistent,
      };
      localStorage.setItem(finalStorageKey, JSON.stringify(stateToSave));
    }
  }, [state, finalStorageKey]);

  const execute = useCallback((command: Command) => {
    if (!command) return;
    dispatch({ type: "EXECUTE", command });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const setMaxStackSize = useCallback((size: number) => {
    dispatch({ type: "SET_MAX_STACK_SIZE", size });
  }, []);

  const togglePersistence = useCallback(() => {
    dispatch({ type: "TOGGLE_PERSISTENCE" });
  }, []);

  const contextValue: CommandHistoryContextType = {
    ...state,
    execute,
    undo,
    redo,
    clear,
    setMaxStackSize,
    togglePersistence,
  };

  return (
    <CommandHistoryContext.Provider value={contextValue}>
      {children}
    </CommandHistoryContext.Provider>
  );
};

/**
 * Hook to use command history context
 * @throws Error if used outside of a CommandHistoryProvider
 */
export const useCommandHistory = () => {
  const context = useContext(CommandHistoryContext);
  if (context === undefined) {
    throw new Error(
      "useCommandHistory must be used within a CommandHistoryProvider"
    );
  }
  return context;
};
