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
  StateChange, 
  StateHistoryContextType, 
  StateHistoryProviderProps, 
} from "../types";
import { 
  commandHistoryReducer, 
  initialState 
} from "./StateHistoryReducer";
import { 
  getStorageKey, 
  loadStateFromStorage, 
  saveStateToStorage, 
  clearStoredState 
} from "../utils/persistenceUtils";
import { useDeferredActions } from "../utils/renderUtils";

// Create the context
const StateHistoryContext = createContext<StateHistoryContextType | undefined>(undefined);

/**
 * Provider component for StateChange history
 * Makes StateChange history state and methods available to all child components
 */
export const StateHistoryProvider: React.FC<StateHistoryProviderProps> = ({
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

  // StateChange execution with safe state updates
  const execute = useCallback((StateChange: StateChange) => {
    if (!StateChange) return;
    
    scheduleDeferredAction(() => {
      // Execute StateChange first, outside of reducer
      StateChange.execute();
      // Then update the state
      dispatch({ type: "EXECUTE", StateChange });
    });
  }, [scheduleDeferredAction]);

  // Undo functionality with safe state updates
  const undo = useCallback(() => {
    if (state.undoStack.length === 0) return;
    
    scheduleDeferredAction(() => {
      // Get the StateChange to undo
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
      // Get the StateChange to redo
      const commandToRedo = state.redoStack[state.redoStack.length - 1];
      // Execute first, outside of reducer
      commandToRedo.execute();
      // Then update the state
      dispatch({ type: "REDO" });
    });
  }, [state.redoStack, scheduleDeferredAction]);

  // Clear StateChange history
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
  const contextValue: StateHistoryContextType = {
    ...state,
    execute,
    undo,
    redo,
    clear,
    setMaxStackSize,
    togglePersistence,
  };

  return (
    <StateHistoryContext.Provider value={contextValue}>
      {children}
    </StateHistoryContext.Provider>
  );
};

/**
 * Hook to use StateChange history context
 * @throws Error if used outside of a StateHistoryProvider
 */
export const useStateHistoryContext = (): StateHistoryContextType => {
  const context = useContext(StateHistoryContext);
  if (context === undefined) {
    throw new Error(
      "useStateHistory must be used within a StateHistoryProvider"
    );
  }
  return context;
};
