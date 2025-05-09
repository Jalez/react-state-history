/** @format */

// Export core functionality
export {
  StateHistoryProvider,
  useHistoryStateContext,
} from "./context/StateHistoryContext";

// Export reducer and related constants
export {
  commandHistoryReducer,
  initialState,
} from "./context/StateHistoryReducer";

// Export simplified hooks
export { useTrackableState, useHistoryState } from "./hooks/useTrackableState";
export { useLatestState } from "./hooks/useLatestState";
export { useTransaction } from "./hooks/useTransaction";

// Export StateChange utilities
export {
  createCompositeCommand,
  createCommand,
  generateCommandId,
  createValueChangeCommand,
  useRegisterValueChangeCommand,
  // For backwards compatibility
  registerCommand as registerValueChangeCommand,
} from "./utils/stateChangeUtils";

// Export StateChange registry
export {
  useRegisterCommand,
  registerCommand,
  getCommand,
  hasCommand,
  hydrateCommand,
  dehydrateCommand,
  createRegistryCommand,
} from "./utils/stateChangeRegistry";

export type {
  CommandFunction,
  CommandRegistry,
  SerializableStateChange,
} from "./utils/stateChangeRegistry";

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
export { useDeferredActions } from "./utils/renderUtils";

// Export components
export { default as HistoryControls } from "./components/HistoryControls";
export type {
  HistoryControlsProps,
  HistoryButtonProps,
} from "./components/HistoryControls";

// Types
export type {
  StateChange,
  StateChangeFactory,
  StateHistory,
  StateHistoryAction,
  StateHistoryContextType,
  StateHistoryProviderProps,
} from "./types";
