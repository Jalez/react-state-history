import React, { useState } from "react";
import {
  UndoRedoProvider,
  useCommandHistory,
  createCommand,
} from "../../UndoRedo";
import UndoRedoControls from "../../UndoRedo/components/UndoRedoControls";

// Counter component with persistence toggle
const Counter: React.FC = () => {
  const [count, setCount] = useState(0);
  const { execute, isPersistent, togglePersistence } = useCommandHistory();

  const increment = () => {
    execute(
      createCommand({
        execute: () => setCount((c) => c + 1),
        undo: () => setCount((c) => c - 1),
      })
    );
  };

  const decrement = () => {
    execute(
      createCommand({
        execute: () => setCount((c) => c - 1),
        undo: () => setCount((c) => c + 1),
      })
    );
  };

  return (
    <div className="example">
      <h2>Persistent Counter Example</h2>
      <div className="description">
        <p>
          This example demonstrates persistent undo/redo state. Toggle
          persistence and reload the page to see the state persist.
        </p>
        <p>Current value: {count}</p>
      </div>
      <div className="controls">
        <button onClick={decrement}>-</button>
        <button onClick={increment}>+</button>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label>
          <input
            type="checkbox"
            checked={isPersistent}
            onChange={togglePersistence}
          />{" "}
          Enable Persistence
        </label>
        <p className="note" style={{ fontSize: "0.9em", color: "#666" }}>
          {isPersistent
            ? "State will be saved and restored on page reload"
            : "State will be reset on page reload"}
        </p>
      </div>
      <UndoRedoControls />
    </div>
  );
};

// Wrap the counter with UndoRedoProvider with a unique storage key
export const PersistentCounterExample: React.FC = () => {
  return (
    <UndoRedoProvider
      storageKey="persistent-counter-example"
      defaultPersistent={false}
    >
      <Counter />
    </UndoRedoProvider>
  );
};
