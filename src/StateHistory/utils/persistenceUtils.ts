/** @format */
import { StateChange, StateHistory } from '../types';
import { STORAGE_KEY_PREFIX } from '../context/StateHistoryReducer';
import { dehydrateCommand, hydrateCommand, SerializableStateChange } from './stateChangeRegistry';

interface SerializedState {
  undoStack: (SerializableStateChange | Record<string, unknown>)[];
  redoStack: (SerializableStateChange | Record<string, unknown>)[];
  maxStackSize: number;
  isPersistent: boolean;
}

/**
 * Serializes a StateChange to a format that can be stored in localStorage
 */
export function serializeCommand(cmd: StateChange): SerializableStateChange | Record<string, unknown> {
  // If the StateChange has a commandName and params, use registry serialization
  if (cmd.commandName && cmd.params !== undefined) {
    return dehydrateCommand(cmd);
  }
  
  // Fall back to legacy serialization for non-registry commands
  console.warn('StateChange is not registry-based, using legacy serialization:', cmd.description);
  const result: Record<string, unknown> = {};
  
  // Copy all properties except functions
  Object.entries(cmd).forEach(([key, value]) => {
    if (typeof value !== 'function') {
      result[key] = value;
    }
  });
  
  // Add the serialized functions (legacy approach)
  result.execute = cmd.execute.toString();
  result.undo = cmd.undo.toString();
  
  return result;
}

/**
 * Deserializes a StateChange from localStorage format
 */
export function deserializeCommand<T>(
  serialized: SerializableStateChange | Record<string, unknown>,
  contextRegistry?: Record<string, { execute: (params: T) => void; undo: (params: T) => void }>

): StateChange {
  // If the serialized StateChange has commandName and params, use registry deserialization
  if ('commandName' in serialized && 'params' in serialized) {
    return hydrateCommand(serialized as SerializableStateChange<T>, contextRegistry);
  }
  
  // Fall back to legacy deserialization for old commands
  console.warn('StateChange is using legacy format, using placeholder functions:', serialized.description);
  
  // Return a basic StateChange with placeholder functions
  return {
    id: String(serialized.id ?? ''),
    description: String(serialized.description ?? 'Legacy StateChange'),
    // Use placeholder functions
    execute: () => console.warn(`Cannot execute legacy StateChange: ${serialized.description}`),
    undo: () => console.warn(`Cannot undo legacy StateChange: ${serialized.description}`),
  };
}

/**
 * Generates a storage key for the given path
 */
export function getStorageKey(storageKey?: string): string {
  // If an explicit storage key is provided, use it directly with the prefix
  if (storageKey) {
    return STORAGE_KEY_PREFIX + storageKey;
  }
  
  // Otherwise use the current pathname as the key
  // This helps avoid key conflicts between different pages
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  // Remove trailing slashes for consistency
  const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return STORAGE_KEY_PREFIX + (normalizedPath || 'root');
}

/**
 * Saves the StateChange history state to localStorage
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
    const stateToSave = {
      undoStack: undoStack.map(serializeCommand),
      redoStack: redoStack.map(serializeCommand),
      maxStackSize,
      isPersistent,
    };
    
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    console.log(`State saved to localStorage (key: ${storageKey}, undo: ${undoStack.length}, redo: ${redoStack.length})`);
  } catch (error) {
    console.error("Error saving persistent state:", error);
  }
}

/**
 * Loads the StateChange history state from localStorage
 */
export function loadStateFromStorage<T>(
  storageKey: string,
  contextRegistry?: Record<string, { execute: (params: T) => void; undo: (params: T) => void }>

): Partial<StateHistory> | null {
  try {
    const savedState = localStorage.getItem(storageKey);
    if (!savedState) return null;
    
    const parsedState = JSON.parse(savedState) as SerializedState;
    
    // Create a restored state with hydrated commands
    return {
      undoStack: Array.isArray(parsedState.undoStack) ? 
        parsedState.undoStack.map(cmd => deserializeCommand(cmd, contextRegistry)) : [],
      redoStack: Array.isArray(parsedState.redoStack) ? 
        parsedState.redoStack.map(cmd => deserializeCommand(cmd, contextRegistry)) : [],
      maxStackSize: parsedState.maxStackSize,
      isPersistent: parsedState.isPersistent,
      canUndo: Array.isArray(parsedState.undoStack) && parsedState.undoStack.length > 0,
      canRedo: Array.isArray(parsedState.redoStack) && parsedState.redoStack.length > 0
    };
  } catch (error) {
    console.error("Error loading persistent state:", error);
    return null;
  }
}

/**
 * Removes state from localStorage
 */
export function clearStoredState(storageKey: string): void {
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Error clearing persistent state:", error);
  }
}