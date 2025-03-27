/** @format */
import React from "react";
import { CommandHistoryProvider } from "./context/CommandHistoryContext";

// Export core functionality
export {
  CommandHistoryProvider,
  useCommandHistory,
} from "./context/CommandHistoryContext";

// Export reducer and related constants
export {
  commandHistoryReducer,
  initialState,
  placeholderFunction,
} from "./context/CommandHistoryReducer";

// Export simplified hooks
export {
  useValueCommand,
  useHistoryState,
} from "./hooks/useValueCommand";

// Export command utilities
export {
  createCompositeCommand,
  createCommand,
  generateCommandId,
  analyzeCommandString,
  createRegisteredCommand,
  registerValueChangeCommand,
  createValueChangeCommand,
} from "./utils/commandUtils";

// Export command registry
export {
  registerCommand,
  getCommand,
  hasCommand,
  hydrateCommand,
  dehydrateCommand,
  createRegistryCommand,
} from "./utils/commandRegistry";

export type {
  CommandFunction,
  CommandRegistry,
  SerializableCommand,
} from "./utils/commandRegistry";

// Export persistence utilities
export {
  serializeCommand,
  deserializeCommand,
  getStorageKey,
  saveStateToStorage,
  loadStateFromStorage,
  clearStoredState,
} from "./utils/persistenceUtils";

// Export render utilities
export {
  useDeferredActions,
} from "./utils/renderUtils";

// Export components
export { default as UndoRedoControls } from "./components/UndoRedoControls";
export type {
  UndoRedoControlsProps,
  UndoRedoButtonProps,
} from "./components/UndoRedoControls";

// Export registration types and component
export { default as UndoRedoControlsRegistration } from "./UndoRedoControlsRegistration";
export type {
  RegisterControlFn,
  UnregisterControlFn,
  UndoRedoRegistrationProps,
} from "./UndoRedoControlsRegistration";

// Types
export type { 
  Command, 
  CommandFactory, 
  CommandHistoryState,
  CommandHistoryAction,
  CommandHistoryContextType,
  CommandHistoryProviderProps
} from "./types";

/**
 * UndoRedoProvider component
 * Provides undo/redo functionality to applications
 *
 * @example
 * ```jsx
 * <UndoRedoProvider>
 *   <YourApp />
 * </UndoRedoProvider>
 * ```
 */
export const UndoRedoProvider: React.FC<{
  children: React.ReactNode;
  maxStackSize?: number;
  storageKey?: string;
  defaultPersistent?: boolean;
}> = ({ children, maxStackSize, storageKey, defaultPersistent }) => {
  return (
    <CommandHistoryProvider
      maxStackSize={maxStackSize}
      storageKey={storageKey}
      defaultPersistent={defaultPersistent}
    >
      {children}
    </CommandHistoryProvider>
  );
};
