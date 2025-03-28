/** @format */

// Export core functionality
export {
  StateHistoryProvider,
  useStateHistoryContext,
} from "./context/StateHistoryContext";

// Export reducer and related constants
export {
  commandHistoryReducer,
  initialState,
  placeholderFunction,
} from "./context/StateHistoryReducer";

// Export simplified hooks
export {
  useTrackableState,
  useStateHistory,
} from "./hooks/useTrackableState";

// Export StateChange utilities
export {
  createCompositeCommand,
  createCommand,
  generateCommandId,
  analyzeCommandString,
  createRegisteredCommand,
  registerValueChangeCommand,
  createValueChangeCommand,
} from "./utils/stateChangeUtils";

// Export StateChange registry
export {
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
export {
  useDeferredActions,
} from "./utils/renderUtils";

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
  StateHistoryProviderProps
} from "./types";

