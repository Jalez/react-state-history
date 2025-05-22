/** @format */
import { StateChange, StateHistory } from "../types";
import { STORAGE_KEY_PREFIX } from "../context/StateHistoryReducer";
import {
  dehydrateCommand,
  hydrateCommand,
  SerializableStateChange,
} from "./stateChangeRegistry";

/**
 * Interface for the serialized state structure
 */
interface SerializedState {
  undoStack: SerializableStateChange[];
  redoStack: SerializableStateChange[];
  maxStackSize: number;
  isPersistent: boolean;
}

/**
 * Serializes a StateChange for storage
 */
export function serializeCommand(cmd: StateChange): SerializableStateChange {
  // Ensure the command has a commandName for proper serialization
  if (!cmd.commandName || cmd.params === undefined) {
    throw new Error(`Cannot serialize command without commandName or params: ${cmd.description}`);
  }
  
  return dehydrateCommand(cmd);
}

/**
 * Deserializes a StateChange from storage format
 */
export function deserializeCommand(
  serialized: SerializableStateChange,
  contextRegistry?: Record<string, { execute: (params: unknown) => void; undo: (params: unknown) => void }>
): StateChange {
  return hydrateCommand<unknown>(serialized, contextRegistry);
}

/**
 * Generates a consistent storage key
 */
export function getStorageKey(customKey?: string): string {
  // If an explicit storage key is provided, use it with the prefix
  if (customKey) {
    return STORAGE_KEY_PREFIX + customKey;
  }

  // Otherwise use the current pathname as the key
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  // Remove trailing slashes for consistency
  const normalizedPath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return STORAGE_KEY_PREFIX + (normalizedPath || "root");
}

/**
 * Saves the state history to localStorage
 */
export function saveStateToStorage(
  storageKey: string,
  undoStack: StateChange[],
  redoStack: StateChange[],
  maxStackSize: number,
  isPersistent: boolean
): void {
  if (!isPersistent) return;

  try {
    // Filter out commands that can't be serialized (no commandName or params)
    const serializableUndoStack = undoStack.filter(cmd => cmd.commandName && cmd.params !== undefined);
    const serializableRedoStack = redoStack.filter(cmd => cmd.commandName && cmd.params !== undefined);

    const stateToSave: SerializedState = {
      undoStack: serializableUndoStack.map(serializeCommand),
      redoStack: serializableRedoStack.map(serializeCommand),
      maxStackSize,
      isPersistent,
    };

    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    
  } catch (error) {
    console.error("Error saving persistent state:", error);
  }
}

/**
 * Loads the state history from localStorage
 */
export function loadStateFromStorage(
  storageKey: string,
  contextRegistry?: Record<string, { execute: (params: unknown) => void; undo: (params: unknown) => void }>
): Partial<StateHistory> | null {
  try {
    const savedState = localStorage.getItem(storageKey);
    if (!savedState) return null;

    const parsedState = JSON.parse(savedState) as SerializedState;

    // Create a restored state with hydrated commands
    return {
      undoStack: Array.isArray(parsedState.undoStack)
        ? parsedState.undoStack.map(cmd => deserializeCommand(cmd, contextRegistry))
        : [],
      redoStack: Array.isArray(parsedState.redoStack)
        ? parsedState.redoStack.map(cmd => deserializeCommand(cmd, contextRegistry))
        : [],
      maxStackSize: parsedState.maxStackSize,
      isPersistent: parsedState.isPersistent,
      canUndo: Array.isArray(parsedState.undoStack) && parsedState.undoStack.length > 0,
      canRedo: Array.isArray(parsedState.redoStack) && parsedState.redoStack.length > 0,
    };
  } catch (error) {
    console.error("Error loading persistent state:", error);
    return null;
  }
}

/**
 * Clears the stored state from localStorage
 */
export function clearStoredState(storageKey: string): void {
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Error clearing persistent state:", error);
  }
}
