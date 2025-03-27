/** @format */
import { Command, CommandHistoryState } from '../types';
import { STORAGE_KEY_PREFIX } from '../context/CommandHistoryReducer';
import { dehydrateCommand, hydrateCommand, SerializableCommand } from './commandRegistry';

interface SerializedState {
  undoStack: (SerializableCommand | Record<string, unknown>)[];
  redoStack: (SerializableCommand | Record<string, unknown>)[];
  maxStackSize: number;
  isPersistent: boolean;
}

/**
 * Serializes a command to a format that can be stored in localStorage
 */
export function serializeCommand(cmd: Command): SerializableCommand | Record<string, unknown> {
  // If the command has a commandName and params, use registry serialization
  if (cmd.commandName && cmd.params !== undefined) {
    return dehydrateCommand(cmd);
  }
  
  // Fall back to legacy serialization for non-registry commands
  console.warn('Command is not registry-based, using legacy serialization:', cmd.description);
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
 * Deserializes a command from localStorage format
 */
export function deserializeCommand(serialized: SerializableCommand | Record<string, unknown>): Command {
  // If the serialized command has commandName and params, use registry deserialization
  if ('commandName' in serialized && 'params' in serialized) {
    return hydrateCommand(serialized as SerializableCommand);
  }
  
  // Fall back to legacy deserialization for old commands
  console.warn('Command is using legacy format, using placeholder functions:', serialized.description);
  
  // Return a basic command with placeholder functions
  return {
    id: String(serialized.id ?? ''),
    description: String(serialized.description ?? 'Legacy command'),
    // Use placeholder functions
    execute: () => console.warn(`Cannot execute legacy command: ${serialized.description}`),
    undo: () => console.warn(`Cannot undo legacy command: ${serialized.description}`),
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
 * Saves the command history state to localStorage
 */
export function saveStateToStorage(
  storageKey: string, 
  undoStack: Command[],
  redoStack: Command[],
  maxStackSize: number,
  isPersistent: boolean
): void {
  try {
    const stateToSave = {
      undoStack: undoStack.map(serializeCommand),
      redoStack: redoStack.map(serializeCommand),
      maxStackSize,
      isPersistent,
    };
    
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    console.log('State saved to localStorage:', {
      key: storageKey,
      undoStackSize: undoStack.length,
      redoStackSize: redoStack.length
    });
  } catch (error) {
    console.error("Error saving persistent state:", error);
  }
}

/**
 * Loads the command history state from localStorage
 */
export function loadStateFromStorage(storageKey: string): Partial<CommandHistoryState> | null {
  try {
    const savedState = localStorage.getItem(storageKey);
    if (!savedState) return null;
    console.log('Loading state from localStorage:', storageKey);
    const parsedState = JSON.parse(savedState) as SerializedState;
    
    // Create a new state object that matches CommandHistoryState
    const restoredState: Partial<CommandHistoryState> = {
      maxStackSize: parsedState.maxStackSize,
      isPersistent: parsedState.isPersistent,
    };
    
    // Re-hydrate the command stacks with proper functions
    if (parsedState.undoStack) {
      restoredState.undoStack = parsedState.undoStack.map(deserializeCommand);
      restoredState.canUndo = restoredState.undoStack.length > 0;
    }
    
    if (parsedState.redoStack) {
      restoredState.redoStack = parsedState.redoStack.map(deserializeCommand);
      restoredState.canRedo = restoredState.redoStack.length > 0;
    }
    
    return restoredState;
  } catch (error) {
    console.error("Error loading persistent state:", error);
    return null;
  }
}

/**
 * Removes the command history state from localStorage
 */
export function clearStoredState(storageKey: string): void {
  localStorage.removeItem(storageKey);
  console.log('Cleared state from localStorage:', storageKey);
}