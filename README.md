<!-- @format -->

[![codecov](https://codecov.io/gh/Jalez/undo-redo/graph/badge.svg?token=H0ILMYGA2O)](https://codecov.io/gh/Jalez/undo-redo)

# `react-state-history`: React State History Management

`react-state-history` provides a flexible and robust system for managing state history (undo/redo) in React applications using TypeScript. It leverages the Command Pattern and offers features like state persistence, composite commands, and a command registry for serializable actions.

## What's New in v0.1.2

- **Code Simplification**: The core logic has been streamlined for better maintainability without removing any functionality.
- **Improved Error Handling**: Enhanced error detection and recovery in command serialization and hydration.
- **Better Type Safety**: Strengthened TypeScript type definitions throughout the codebase.
- **Fixed Issues**: Addressed edge cases in command reconnection and serialization.
- **New useLatestState Hook**: Added a specialized hook for retrieving the latest state from history.
- **Enhanced React Flow Example**: Improved demonstration of complex third-party library integration.

## What is the Command Pattern?

The Command Pattern is a behavioral design pattern that encapsulates a request as an object, allowing for parameterization of clients with different requests, queuing of requests, and logging of the operations. In `react-state-history`, this pattern is central to how undo/redo functionality works:

- **Commands as Objects**: Each state change is represented as a `StateChange` object with specific methods.
- **Execute & Undo**: Every command knows how to perform its action (`execute`) and how to reverse it (`undo`).
- **Command History**: Commands are stored in stacks, enabling traversal through state history.
- **Serialization**: Commands can be converted to/from JSON for persistence.
- **Composition**: Multiple commands can be grouped into a single composite command.

This approach separates the logic that modifies state from the components that trigger these modifications, making the system more maintainable and enabling powerful features like undo/redo and state persistence.

## Features

- **Command Pattern:** Encapsulates state changes as `StateChange` objects with `execute` and `undo` methods.
- **React Context API:** Uses `StateHistoryProvider` and `useHistoryStateContext` for easy integration.
- **Stack Size Management:** Configurable history stack size limit (default: 50) to prevent memory issues.
- **Flexible Hooks:**
  - `useHistoryState`: A simple hook, similar to `useState`, that automatically handles state and command creation for basic scenarios.
  - `useTrackableState`: A lower-level hook to integrate with existing state management solutions, requiring manual tracking of previous values.
  - `useLatestState`: A specialized hook for retrieving the latest state from history, perfect for third-party library integrations.
- **StateChange Registry:** Enables defining serializable command types for persistence.
- **Persistence:** Optionally persists undo/redo history to `localStorage`.
- **Composite Commands:** Group multiple actions into a single undoable/redoable step.
- **Customizable UI:** Provides `HistoryControls` component with options for custom buttons or rendering logic.
- **TypeScript:** Fully typed for better developer experience and safety.

## Core Concepts

1.  **`StateChange` Object:** The fundamental unit representing an action. It must have `execute` and `undo` functions. For persistence, it should also include `commandName` and `params`.
2.  **`StateHistoryProvider`:** Wraps your application (or relevant part) to provide the undo/redo context. Manages the undo/redo stacks, persistence, and stack size limits.
3.  **`useHistoryStateContext`:** Hook to access the context's state (`canUndo`, `canRedo`, `undoStack`, `redoStack`, `isPersistent`) and actions (`execute`, `undo`, `redo`, `clear`, `togglePersistence`, `setMaxStackSize`).
4.  **StateChange Registry:** A global registry (`registerCommand`, `getCommand`) where you define _how_ to execute and undo specific types of commands based on their `commandName` and `params`. This is crucial for rehydrating commands from persistent storage.

## Basic Setup

Wrap the part of your application that needs undo/redo capabilities with `StateHistoryProvider`.

```typescript
// filepath: src/main.tsx or src/App.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { StateHistoryProvider } from "./StateHistory"; // Adjust path as needed
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StateHistoryProvider>
      <App />
    </StateHistoryProvider>
  </React.StrictMode>
);
```

## Usage Guide

### 1. Simple State with `useHistoryState`

For managing simple state values (like counters, toggles, or form inputs) where you want automatic undo/redo tracking.

```typescript
// filepath: src/components/MyCounter.tsx
import React from "react";
import { useHistoryState, HistoryControls } from "../StateHistory"; // Adjust path

export function MyCounter() {
  // useHistoryState returns [value, setValue, resetValue]
  // 'counter/set' is a unique name for this state change type.
  // The hook handles command registration automatically
  const [count, setCount, resetCount] = useHistoryState<number>(
    "counter/set",
    0
  );

  const increment = () => setCount(count + 1, `Increment to ${count + 1}`);
  const decrement = () => setCount(count - 1, `Decrement to ${count - 1}`);

  return (
    <div>
      <h2>Counter: {count}</h2>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={resetCount}>Reset</button>
      <HistoryControls />
    </div>
  );
}
```

### 2. Integrating with Existing State (`useTrackableState`)

Use this hook when you already have a state setter function (e.g., from `useState`, `useReducer`, or another library) and want to add undo/redo capabilities. You need to provide the `oldValue` manually.

```typescript
// filepath: src/components/MyTrackedInput.tsx
import React, { useState } from "react";
import { useTrackableState, HistoryControls } from "../StateHistory"; // Adjust path

export function MyTrackedInput() {
  const [text, setTextDirect] = useState("");

  // useTrackableState automatically registers the command type internally
  // No need to call registerValueChangeCommand separately
  const trackTextChange = useTrackableState<string>("input/set", setTextDirect);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const oldValue = text; // Capture the old value *before* setting the new one
    setTextDirect(newValue); // Update the local state directly

    // Track the change for undo/redo
    trackTextChange(newValue, oldValue, `Set text to "${newValue}"`);
  };

  return (
    <div>
      <input type="text" value={text} onChange={handleChange} />
      <p>Current Text: {text}</p>
      <HistoryControls />
    </div>
  );
}
```

### 3. Creating Custom Commands (`createCommand`)

For actions that don't fit the simple value change pattern or don't need persistence.

```typescript
import {
  useHistoryStateContext,
  createCommand,
  HistoryControls,
} from "../StateHistory";

function CustomActionComponent() {
  const { execute } = useHistoryStateContext();
  const [logs, setLogs] = React.useState<string[]>([]);

  const performAction = () => {
    const timestamp = new Date().toISOString();
    const logMessage = `Action performed at ${timestamp}`;

    const command = createCommand({
      execute: () => setLogs((prev) => [...prev, logMessage]),
      undo: () => setLogs((prev) => prev.slice(0, -1)),
      description: "Log timestamp",
    });

    execute(command);
  };

  return (
    <div>
      <button onClick={performAction}>Perform Custom Action</button>
      <ul>
        {logs.map((log, i) => (
          <li key={i}>{log}</li>
        ))}
      </ul>
      <HistoryControls />
    </div>
  );
}
```

### 4. Composite Commands (`createCompositeCommand`)

Group multiple commands into one atomic undo/redo operation.

```typescript
import {
  useHistoryStateContext,
  createCompositeCommand,
  createValueChangeCommand,
} from "../StateHistory";
import { useHistoryState } from "../StateHistory"; // For example state

function CompositeActionComponent() {
  const { execute } = useHistoryStateContext();
  const [valueA, setValueA] = useHistoryState<number>("valueA/set", 0);
  const [valueB, setValueB] = useHistoryState<string>("valueB/set", "abc");

  const performCompositeAction = () => {
    const newValueA = valueA + 10;
    const newValueB = valueB + "x";

    // Create individual commands using the registry for persistence
    const commandA = createValueChangeCommand("valueA/set", valueA, newValueA);
    const commandB = createValueChangeCommand("valueB/set", valueB, newValueB);

    // Combine them
    const composite = createCompositeCommand(
      [commandA, commandB],
      `Set A to ${newValueA} and B to ${newValueB}`
    );

    // Execute the composite command
    // Note: The individual setValue calls from useHistoryState are bypassed here.
    // The composite command's execute function handles the state updates.
    execute(composite);
  };

  return (
    <div>
      <p>Value A: {valueA}</p>
      <p>Value B: {valueB}</p>
      <button onClick={performCompositeAction}>Perform Composite Action</button>
      <HistoryControls />
    </div>
  );
}
```

### 5. Persistence

Enable persistence by setting `defaultPersistent={true}` or providing a `storageKey` on the `StateHistoryProvider`.

For persistence to work correctly:

- When using `useHistoryState` or `useTrackableState` hooks, registration is handled automatically
- For custom commands, use `createValueChangeCommand` or `createRegisteredCommand` after registering with `registerCommand` or `registerValueChangeCommand`

```typescript
// In your main application setup
<StateHistoryProvider defaultPersistent={true} storageKey="myAppHistory">
  <App />
</StateHistoryProvider>;

// --- Or toggle persistence via UI ---

import { HistoryControls, useHistoryStateContext } from "../StateHistory";

function PersistenceToggle() {
  const { isPersistent, togglePersistence } = useHistoryStateContext();
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={isPersistent}
          onChange={togglePersistence}
        />
        Enable Persistence
      </label>
      <HistoryControls showPersistenceToggle={true} /> {/* Or use the built-in toggle */}
    </div>
  );
}
```

### 6. UI Controls (`HistoryControls`)

Use the `HistoryControls` component to render standard Undo, Redo, and Clear buttons.

```typescript
import { HistoryControls } from "../StateHistory";

function MyComponent() {
  // ... component logic using useHistoryState or useTrackableState
  return (
    <div>
      {/* ... other UI */}
      <div className="undo-redo-controls">
        <HistoryControls />
      </div>
      {/* Optional: Show persistence toggle */}
      <div className="persistence-controls">
        <HistoryControls
          showPersistenceToggle={true}
          persistenceLabel="Save History"
        />
      </div>
    </div>
  );
}
```

You can also provide custom button components or a completely custom render function.

## API Reference (Core Exports)

- **Providers:**
  - `StateHistoryProvider`: Context provider component.
- **Hooks:**
  - `useHistoryStateContext`: Accesses the history state and actions.
  - `useHistoryState`: Manages simple state with automatic history tracking.
  - `useTrackableState`: Integrates history tracking with existing state setters.
  - `useLatestState`: Retrieves the latest state for a specific command type from the undo stack, ideal for third-party integrations.
- **Components:**
  - `HistoryControls`: Renders undo/redo/clear UI controls.
- **Command Creation:**
  - `createCommand`: Creates a basic (non-serializable) `StateChange`.
  - `createCompositeCommand`: Creates a command that groups others.
  - `createValueChangeCommand`: Creates a serializable command for simple value changes (requires registration).
  - `createRegisteredCommand`: Creates a serializable command using a registered type and parameters.
- **Command Registry:**
  - `registerCommand`: Registers a custom command type with execute/undo logic.
  - `registerValueChangeCommand`: Helper to register simple value change command types.
  - `getCommand`, `hasCommand`: Check the registry.
  - `hydrateCommand`, `dehydrateCommand`: Used internally for persistence.
- **Types:**
  - `StateChange`: Interface for command objects.
  - `StateHistoryContextType`: Type for the history context.
  - `StateHistoryProviderProps`: Props for the provider.
  - `HistoryControlsProps`, `HistoryButtonProps`: Props for UI controls.
  - `SerializableStateChange`, `CommandFunction`: Types related to the registry.

## Directory Structure

```
src/StateHistory/
├── components/           # UI components (HistoryControls)
│   └── HistoryControls.tsx
│   └── HistoryControls.test.tsx
├── context/              # React context and reducer
│   └── StateHistoryContext.tsx
│   └── StateHistoryContext.test.tsx
│   └── StateHistoryReducer.ts
│   └── StateHistoryReducer.test.tsx
├── hooks/                # Core hooks
│   └── useTrackableState.ts
│   └── useTrackableState.test.tsx # (Assuming tests exist)
├── types/                # TypeScript interfaces and types
│   └── index.ts
├── utils/                # Helper utilities
│   └── stateChangeUtils.ts
│   └── stateChangeRegistry.ts
│   └── persistenceUtils.ts
│   └── renderUtils.ts # (Helper for safe state updates)
└── index.tsx             # Main export file
```

## Best Practices

- **Unique Command Names:** Use distinct `commandType` strings when using `useHistoryState`, `useTrackableState`, or registering commands, especially if using persistence. Prefixing with the feature area (e.g., `'counter/increment'`, `'userProfile/updateName'`) is recommended.

  - ⚠️ **Important:** When reusing components that use `useHistoryState` or `useTrackableState`, make sure to pass unique `commandType` values to each instance. Using the same `commandType` for multiple instances will cause them to share state and overwrite each other's history.

  ```tsx
  // DON'T - Both counters will share state and overwrite each other's history
  <Counter />
  <Counter />

  // DO - Each counter has its own unique state history
  <Counter commandType="counter/first" />
  <Counter commandType="counter/second" />
  ```

- **Automatic Registration:** Both `useHistoryState` and `useTrackableState` automatically register command types internally, so manual registration is only needed for custom commands that aren't created with these hooks.
- **Immutability:** Ensure your `execute` and `undo` functions handle state immutably, especially when dealing with objects or arrays.
- **Descriptions:** Provide clear `description` strings when creating commands for better debugging and potential UI display.
