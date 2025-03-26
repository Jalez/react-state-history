/** @format */
import React from "react";
import { CommandHistoryProvider } from "./context/CommandHistoryContext";

// Export core functionality
export {
  CommandHistoryProvider,
  useCommandHistory,
} from "./context/CommandHistoryContext";

// Export command utilities
export {
  createCompositeCommand,
  createCommand,
  deepClone,
  generateCommandId,
} from "./utils/commandUtils";

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
export type { Command, CommandFactory } from "./types";

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
