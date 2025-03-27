/** @format */
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useState,
} from "react";
import { 
  Command, 
  CommandHistoryContextType, 
  CommandHistoryProviderProps, 
   
} from "../types";
import { 
  commandHistoryReducer, 
  initialState 
} from "./CommandHistoryReducer";
import { 
  getStorageKey, 
  loadStateFromStorage, 
  saveStateToStorage, 
  clearStoredState 
} from "../utils/persistenceUtils";
import { useDeferredActions } from "../utils/renderUtils";

// Create the context
const CommandHistoryContext = createContext<CommandHistoryContextType | undefined>(undefined);

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
  const finalStorageKey = getStorageKey(storageKey);
  
  // Create a state to track if initial loading has been attempted
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  
  // Get our deferred action scheduler
  const scheduleDeferredAction = useDeferredActions();

  // Initialize state with custom max stack size if provided
  const [state, dispatch] = useReducer(commandHistoryReducer, {
    ...initialState,
    maxStackSize: maxStackSize || initialState.maxStackSize,
    isPersistent: defaultPersistent,
  });

  // Load persistent state on mount - only once and in useEffect
  useEffect(() => {
    if (state.isPersistent && !initialLoadAttempted) {
      const persistedState = loadStateFromStorage(finalStorageKey);
      if (persistedState) {
        dispatch({ type: "LOAD_PERSISTENT_STATE", state: persistedState });
      }
      setInitialLoadAttempted(true);
    }
  }, [finalStorageKey, state.isPersistent, initialLoadAttempted]);

  // Save state when it changes and persistence is enabled
  useEffect(() => {
    if (state.isPersistent && initialLoadAttempted) {
      saveStateToStorage(
        finalStorageKey, 
        state.undoStack, 
        state.redoStack, 
        state.maxStackSize, 
        state.isPersistent
      );
    }
  }, [
    state.undoStack, 
    state.redoStack, 
    state.maxStackSize, 
    state.isPersistent, 
    finalStorageKey,
    initialLoadAttempted,
  ]);

  // Command execution with safe state updates
  const execute = useCallback((command: Command) => {
    if (!command) return;
    
    scheduleDeferredAction(() => {
      // Execute command first, outside of reducer
      command.execute();
      // Then update the state
      dispatch({ type: "EXECUTE", command });
    });
  }, [scheduleDeferredAction]);

  // Undo functionality with safe state updates
  const undo = useCallback(() => {
    if (state.undoStack.length === 0) return;
    
    scheduleDeferredAction(() => {
      // Get the command to undo
      const commandToUndo = state.undoStack[state.undoStack.length - 1];
      // Execute undo first, outside of reducer
      commandToUndo.undo();
      // Then update the state
      dispatch({ type: "UNDO" });
    });
  }, [state.undoStack, scheduleDeferredAction]);

  // Redo functionality with safe state updates
  const redo = useCallback(() => {
    if (state.redoStack.length === 0) return;
    
    scheduleDeferredAction(() => {
      // Get the command to redo
      const commandToRedo = state.redoStack[state.redoStack.length - 1];
      // Execute first, outside of reducer
      commandToRedo.execute();
      // Then update the state
      dispatch({ type: "REDO" });
    });
  }, [state.redoStack, scheduleDeferredAction]);

  // Clear command history
  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  // Set maximum stack size
  const setMaxStackSize = useCallback((size: number) => {
    dispatch({ type: "SET_MAX_STACK_SIZE", size });
  }, []);

  // Toggle persistence
  const togglePersistence = useCallback(() => {
    // Handle clearing localStorage if turning off
    if (state.isPersistent) {
      clearStoredState(finalStorageKey);
    }
    dispatch({ type: "TOGGLE_PERSISTENCE" });
  }, [state.isPersistent, finalStorageKey]);

  // Create context value
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
export const useCommandHistory = (): CommandHistoryContextType => {
  const context = useContext(CommandHistoryContext);
  if (context === undefined) {
    throw new Error(
      "useCommandHistory must be used within a CommandHistoryProvider"
    );
  }
  return context;
};
