/** @format */
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useState,
  useMemo,
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

// Create the context with undefined initial value
const StateHistoryContext = createContext<StateHistoryContextType | undefined>(undefined);

/**
 * Helper function to reconnect commands with the registry
 */
function reconnectCommand(
  cmd: StateChange, 
  registry: Record<string, CommandFunction<unknown>>
): StateChange {
  // Special handling for transaction commands
  if (cmd.commandName === 'transaction' && cmd.params && typeof cmd.params === 'object') {
    const transactionParams = cmd.params as { commands?: StateChange[] };
    
    if (transactionParams.commands && Array.isArray(transactionParams.commands)) {
      // Recursively reconnect nested commands
      const reconnectedCommands = transactionParams.commands.map(
        nestedCmd => reconnectCommand(nestedCmd, registry)
      );
      
      // Return a new command with reconnected nested commands
      return {
        ...cmd,
        params: { ...transactionParams, commands: reconnectedCommands },
        execute: () => {
          reconnectedCommands.forEach(nestedCmd => {
            if (nestedCmd && typeof nestedCmd.execute === 'function') {
              nestedCmd.execute();
            }
          });
        },
        undo: () => {
          [...reconnectedCommands].reverse().forEach(nestedCmd => {
            if (nestedCmd && typeof nestedCmd.undo === 'function') {
              nestedCmd.undo();
            }
          });
        }
      };
    }
  }
  
  // For regular commands, reconnect with the registry if the command name exists in the registry
  if (cmd.commandName && registry && registry[cmd.commandName]) {
    return {
      ...cmd,
      execute: () => registry[cmd.commandName!].execute(cmd.params),
      undo: () => registry[cmd.commandName!].undo(cmd.params),
    };
  }
  
  // If no reconnection is possible, return the original command
  return cmd;
}

/**
 * Provider component for State History
 * Makes state history functionality available to all child components
 */
export const StateHistoryProvider: React.FC<StateHistoryProviderProps> = ({
  children,
  maxStackSize,
  storageKey,
  defaultPersistent = false,
}) => {
  // Generate storage key
  const finalStorageKey = getStorageKey(storageKey);
  const scheduleDeferredAction = useDeferredActions();
  
  // State for tracking initialization
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const [registeredCommands, setRegisteredCommands] = useState<string[]>([]);
  // State for tracking if undo/redo is in progress
  const [isUndoing, setIsUndoing] = useState(false);
  const [isRedoing, setIsRedoing] = useState(false);
  // Track the last command type
  const [lastCommandType, setLastCommandType] = useState<"undo" | "redo" | "execute" | undefined>(undefined);

  // Initialize reducer with custom settings
  const [state, dispatch] = useReducer(commandHistoryReducer, {
    ...initialState,
    maxStackSize: maxStackSize || initialState.maxStackSize,
    isPersistent: defaultPersistent,
  });
  
  // Derived state - adjusted to consider both persistence status and load attempt
  const initialStateLoaded = useMemo(
    () => initialLoadAttempted,
    [initialLoadAttempted]
  );

  // Load state from storage once on mount if persistence is enabled
  useEffect(() => {
    if (state.isPersistent && !initialLoadAttempted) {
      const persistedState = loadStateFromStorage(
        finalStorageKey,
        state.commandRegistry
      );
      
      if (persistedState) {
        dispatch({ type: "LOAD_PERSISTENT_STATE", state: persistedState });
      }
      
      // Mark load as attempted regardless of result
      setInitialLoadAttempted(true);
    } else if (!initialLoadAttempted) {
      // Even if persistence is off, mark load as attempted for consistency
      setInitialLoadAttempted(true);
    }
  }, [
    finalStorageKey,
    state.isPersistent,
    initialLoadAttempted,
    state.commandRegistry,
  ]);

  // Reconnect commands when the registry updates
  useEffect(() => {
    // Only attempt reconnection if we have loaded state and have commands
    const hasCommands = state.undoStack.length > 0 || state.redoStack.length > 0;
    
    if (initialLoadAttempted && hasCommands) {
      // Check if registry has new commands
      const currentCmdKeys = Object.keys(state.commandRegistry);
      const hasNewCommands = currentCmdKeys.some(cmd => !registeredCommands.includes(cmd));
      
      if (hasNewCommands) {
        // Reconnect all commands with the updated registry
        const reconnectedState = {
          undoStack: state.undoStack.map(cmd => reconnectCommand(cmd, state.commandRegistry)),
          redoStack: state.redoStack.map(cmd => reconnectCommand(cmd, state.commandRegistry)),
        };
        
        // Update tracking of registered commands
        setRegisteredCommands(currentCmdKeys);
        
        // Update state with reconnected commands
        dispatch({ type: "RECONNECT_COMMANDS", state: reconnectedState });
      }
    }
  }, [
    state.commandRegistry,
    initialLoadAttempted,
    registeredCommands,
    state.undoStack,
    state.redoStack,
  ]);

  // Save state to storage when it changes (if persistence enabled)
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

  // Listen for external command execution events
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
            params,
          };

          stateChange.execute();
          dispatch({ type: "EXECUTE", StateChange: stateChange });
        });
      }
    };

    document.addEventListener("execute-command", handleExecuteCommand);
    return () => document.removeEventListener("execute-command", handleExecuteCommand);
  }, [scheduleDeferredAction, state.commandRegistry]);

  // Core context methods
  
  // Execute a command and add it to history
  const execute = useCallback(
    (stateChange: StateChange) => {
      if (!stateChange) return;
      setLastCommandType("execute");
      scheduleDeferredAction(() => {
        // Execute command first, then update state
        stateChange.execute();
        dispatch({ type: "EXECUTE", StateChange: stateChange });
      });
    },
    [scheduleDeferredAction]
  );

  // Undo the most recent command (intent only)
  const undo = useCallback(() => {
    if (state.undoStack.length === 0) return;
    setIsUndoing(true);
  }, [state.undoStack]);

  // Redo the most recently undone command (intent only)
  const redo = useCallback(() => {
    if (state.redoStack.length === 0) return;
    setIsRedoing(true);
  }, [state.redoStack]);

  // Effect to perform undo when isUndoing becomes true
  useEffect(() => {
    if (!isUndoing) return;
    // Only run if there is something to undo
    if (state.undoStack.length === 0) {
      setIsUndoing(false);
      return;
    }
    setLastCommandType("undo");
    const commandToUndo = state.undoStack[state.undoStack.length - 1];
    commandToUndo.undo();
    dispatch({ type: "UNDO" });
    setIsUndoing(false);
  }, [isUndoing, state.undoStack]);

  // Effect to perform redo when isRedoing becomes true
  useEffect(() => {
    if (!isRedoing) return;
    // Only run if there is something to redo
    if (state.redoStack.length === 0) {
      setIsRedoing(false);
      return;
    }
    setLastCommandType("redo");
    const commandToRedo = state.redoStack[state.redoStack.length - 1];
    commandToRedo.execute();
    dispatch({ type: "REDO" });
    setIsRedoing(false);
  }, [isRedoing, state.redoStack]);

  // Clear the history stacks
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
    
    // If turning off persistence, clear stored state
    if (!newPersistenceState) {
      clearStoredState(finalStorageKey);
    } else {
      // If turning on persistence, try to load existing state
      const persistedState = loadStateFromStorage(finalStorageKey);
      if (persistedState) {
        dispatch({
          type: "LOAD_PERSISTENT_STATE",
          state: { ...persistedState, isPersistent: true },
        });
        return;
      }
    }
    
    dispatch({ type: "TOGGLE_PERSISTENCE" });
  }, [state.isPersistent, finalStorageKey]);

  // Command registry methods
  
  // Register a command
  const registerCommand = useCallback(
    <T,>(
      name: string,
      executeFn: (params: T) => void,
      undoFn: (params: T) => void
    ): void => {
      dispatch({
        type: "REGISTER_COMMAND",
        name,
        executeFn: executeFn as (params: unknown) => void,
        undoFn: undoFn as (params: unknown) => void,
      });
    },
    []
  );

  // Unregister a command
  const unregisterCommand = useCallback((name: string) => {
    dispatch({ type: "UNREGISTER_COMMAND", name });
  }, []);

  // Get a command from the registry
  const getCommand = useCallback(
    <T,>(name: string): CommandFunction<T> | undefined => {
      return state.commandRegistry[name] as CommandFunction<T> | undefined;
    },
    [state.commandRegistry]
  );

  // Check if a command exists in the registry
  const hasCommand = useCallback(
    (name: string): boolean => {
      return !!state.commandRegistry[name];
    },
    [state.commandRegistry]
  );

  // Transaction methods
  
  // Begin a transaction
  const beginTransaction = useCallback((description?: string) => {
    dispatch({ type: "BEGIN_TRANSACTION", description });
  }, []);

  // Commit a transaction
  const commitTransaction = useCallback(() => {
    scheduleDeferredAction(() => {
      dispatch({ type: "COMMIT_TRANSACTION" });
    });
  }, [scheduleDeferredAction]);

  // Abort a transaction
  const abortTransaction = useCallback(() => {
    // First undo all operations in the buffer in reverse order
    if (state.transactionBuffer.length > 0) {
      [...state.transactionBuffer].reverse().forEach(command => {
        try {
          command.undo();
        } catch (error) {
          console.error("Error during transaction rollback:", error);
        }
      });
    }

    // Then discard the transaction buffer
    dispatch({ type: "ABORT_TRANSACTION" });
  }, [state.transactionBuffer]);

  // Build the context value
  const contextValue: StateHistoryContextType = {
    ...state,
    initialStateLoaded,
    execute,
    undo,
    redo,
    clear,
    setMaxStackSize,
    togglePersistence,
    registerCommand,
    unregisterCommand,
    getCommand,
    hasCommand,
    beginTransaction,
    commitTransaction,
    abortTransaction,
    isTransactionInProgress: state.transactionInProgress,
    isUndoing,
    isRedoing,
    lastCommandType,
  };

  return (
    <StateHistoryContext.Provider value={contextValue}>
      {children}
    </StateHistoryContext.Provider>
  );
};

/**
 * Hook to access the state history context
 * @throws Error if used outside a StateHistoryProvider
 */
export const useHistoryStateContext = (): StateHistoryContextType => {
  const context = useContext(StateHistoryContext);
  
  if (context === undefined) {
    throw new Error("useHistoryStateContext must be used within a StateHistoryProvider");
  }
  
  return context;
};

/**
 * Export the register command function for use outside the context
 * @param name Command name
 * @param executeFn Execute function
 * @param undoFn Undo function
 */
export function registerCommand<T>(
  name: string,
  executeFn: (params: T) => void,
  undoFn: (params: T) => void
): void {
  // Create and dispatch a custom event to register the command
  const event = new CustomEvent("register-command", {
    detail: { name, executeFn, undoFn },
  });
  
  document.dispatchEvent(event);
}

/**
 * Export has command check for use outside the context
 */
export function hasCommand(): boolean {
  // Implementation or return false if not implemented
  return false;
}

/**
 * Export get command function for use outside the context
 */
export function getCommand<T>(): CommandFunction<T> | undefined {
  // Implementation or return undefined if not implemented
  return undefined;
}
