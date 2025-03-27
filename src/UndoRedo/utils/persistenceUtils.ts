/** @format */
import { Command } from '../types';
import { STORAGE_KEY_PREFIX } from '../context/CommandHistoryReducer';
import { dehydrateCommand, hydrateCommand, SerializableCommand } from './commandRegistry';

/**
 * Serializes a command to a format that can be stored in localStorage
 */
export function serializeCommand(cmd: Command): SerializableCommand | Record<string, any> {
  // If the command has a commandName and params, use registry serialization
  if (cmd.commandName && cmd.params !== undefined) {
    return dehydrateCommand(cmd);
  }
  
  // Fall back to legacy serialization for non-registry commands
  console.warn('Command is not registry-based, using legacy serialization:', cmd.description);
  const result: Record<string, any> = {};
  
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
export function deserializeCommand(serialized: any): Command {
  // If the serialized command has commandName and params, use registry deserialization
  if (serialized.commandName && serialized.params !== undefined) {
    return hydrateCommand(serialized as SerializableCommand);
  }
  
  // Fall back to legacy deserialization for old commands
  console.warn('Command is using legacy format, using placeholder functions:', serialized.description);
  
  // Return a basic command with placeholder functions
  return {
    id: serialized.id,
    description: serialized.description || 'Legacy command',
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
export function loadStateFromStorage(storageKey: string): any {
  try {
    const savedState = localStorage.getItem(storageKey);
    if (!savedState) return null;
    console.log('Loading state from localStorage:', storageKey);
    const parsedState = JSON.parse(savedState);
    
    // Re-hydrate the commands with proper functions
    if (parsedState.undoStack) {
      parsedState.undoStack = parsedState.undoStack.map(deserializeCommand);
    }
    
    if (parsedState.redoStack) {
      parsedState.redoStack = parsedState.redoStack.map(deserializeCommand);
    }
    
    return parsedState;
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