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
  CommandFunction,
} from "../types";
import { commandHistoryReducer, initialState } from "./StateHistoryReducer";
import {
  getStorageKey,
  loadStateFromStorage,
  saveStateToStorage,
  clearStoredState,
} from "../utils/persistenceUtils";
import { useDeferredActions } from "../utils/renderUtils";

// Create the context
const StateHistoryContext = createContext<StateHistoryContextType | undefined>(
  undefined
);

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

  // We need to track command registrations separately to handle persistence properly
  const [registeredCommands, setRegisteredCommands] = useState<string[]>([]);

  // Load persistent state on mount - only once and in useEffect
  useEffect(() => {
    if (state.isPersistent && !initialLoadAttempted) {
      const persistedState = loadStateFromStorage(finalStorageKey, state.commandRegistry);
      if (persistedState) {
        dispatch({ type: "LOAD_PERSISTENT_STATE", state: persistedState });
      }
      setInitialLoadAttempted(true);
    }
  }, [finalStorageKey, state.isPersistent, initialLoadAttempted, state.commandRegistry]);
  
  // Try to reconnect any pending commands when registry updates
  useEffect(() => {
    if (initialLoadAttempted && state.undoStack.length > 0) {
      const hasNewCommands = Object.keys(state.commandRegistry).some(cmd => 
        !registeredCommands.includes(cmd)
      );
      
      if (hasNewCommands) {
        // Helper function to reconnect commands using registry
        const reconnectCommand = (cmd: StateChange): StateChange => {
          if (cmd.commandName && state.commandRegistry[cmd.commandName]) {
            // Reconnect the command with the registry
            return {
              ...cmd,
              execute: () => state.commandRegistry[cmd.commandName as string].execute(cmd.params),
              undo: () => state.commandRegistry[cmd.commandName as string].undo(cmd.params)
            };
          }
          return cmd;
        };
        
        // Reconnect commands in both stacks
        const reconnectedState = {
          ...state,
          undoStack: state.undoStack.map(reconnectCommand),
          redoStack: state.redoStack.map(reconnectCommand)
        };
        
        // Update the list of registered commands we've seen
        setRegisteredCommands(Object.keys(state.commandRegistry));
        
        // Update state with reconnected commands
        dispatch({ type: "RECONNECT_COMMANDS", state: reconnectedState });
      }
    }
  }, [state.commandRegistry, initialLoadAttempted, registeredCommands, state.undoStack, state.redoStack]);

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

  // Set up event listener for execute-command events
  useEffect(() => {
    const handleExecuteCommand = (event: Event) => {
      if (!(event instanceof CustomEvent) || !event.detail?.name) return;
      
      const { name: commandName, params = {} } = event.detail;
      const commandFn = state.commandRegistry[commandName];
      
      if (commandFn) {
        scheduleDeferredAction(() => {
          const stateChange: StateChange = {
            execute: () => commandFn.execute(params),
            undo: () => commandFn.undo(params),
            id: `event-${Date.now()}`,
            description: `Command: ${commandName}`,
            commandName,
            params
          };
          
          // Execute the StateChange and update state in one go
          stateChange.execute();
          dispatch({ type: "EXECUTE", StateChange: stateChange });
        });
      }
    };
    
    document.addEventListener('execute-command', handleExecuteCommand);
    return () => document.removeEventListener('execute-command', handleExecuteCommand);
  }, [scheduleDeferredAction, state.commandRegistry]);

  // StateChange execution with safe state updates
  const execute = useCallback(
    (StateChange: StateChange) => {
      if (!StateChange) return;

      scheduleDeferredAction(() => {
        // Execute StateChange first, outside of reducer
        StateChange.execute();
        // Then update the state
        dispatch({ type: "EXECUTE", StateChange });
      });
    },
    [scheduleDeferredAction]
  );

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
    const newPersistenceState = !state.isPersistent;
    // Handle clearing localStorage if turning off
    if (!newPersistenceState) {
      clearStoredState(finalStorageKey);
    } else {
      // If turning on persistence, try to load any existing state
      const persistedState = loadStateFromStorage(finalStorageKey);
      if (persistedState) {
        dispatch({ 
          type: "LOAD_PERSISTENT_STATE", 
          state: { ...persistedState, isPersistent: true }  // Ensure isPersistent is set
        });
        return;
      }
    }
    dispatch({ type: "TOGGLE_PERSISTENCE" });
  }, [state.isPersistent, finalStorageKey]);
  
  // Register a command in the context's registry
  const registerCommand = useCallback(<T,>(
    name: string,
    executeFn: (params: T) => void,
    undoFn: (params: T) => void
  ) => {
    dispatch({ 
      type: "REGISTER_COMMAND", 
      name, 
      executeFn: executeFn as (params: any) => void,
      undoFn: undoFn as (params: any) => void
    });
  }, []);

  // Unregister a command from the context's registry
  const unregisterCommand = useCallback((name: string) => {
    dispatch({ type: "UNREGISTER_COMMAND", name });
  }, []);
  
  // Get a command from the context's registry
  const getCommand = useCallback(<T,>(name: string): CommandFunction<T> | undefined => {
    return state.commandRegistry[name] as CommandFunction<T> | undefined;
  }, [state.commandRegistry]);
  
  // Check if a command exists in the context's registry
  const hasCommand = useCallback((name: string): boolean => {
    return !!state.commandRegistry[name];
  }, [state.commandRegistry]);

  // Create context value
  const contextValue: StateHistoryContextType = {
    ...state,
    execute,
    undo,
    redo,
    clear,
    setMaxStackSize,
    togglePersistence,
    registerCommand,
    unregisterCommand,
    getCommand,
    hasCommand
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
export const useHistoryStateContext = (): StateHistoryContextType => {
  const context = useContext(StateHistoryContext);
  if (context === undefined) {
    throw new Error(
      "useHistoryState must be used within a StateHistoryProvider"
    );
  }
  return context;
};
