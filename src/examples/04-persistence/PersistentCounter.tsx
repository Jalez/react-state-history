import React from "react";
import {
  UndoRedoProvider, 
  useCommandHistory,
  useHistoryState,
} from "../../UndoRedo";
import UndoRedoControls from "../../UndoRedo/components/UndoRedoControls";

// Counter with registry-based persistence using the simplified hooks
export const Counter = () => {
  // The useHistoryState hook registers commands automatically
  // and handles persistence without any additional boilerplate
  const [count, setCount, resetCount] = useHistoryState<number>(
    "persistentCounter/setValue",
    0
  );

  // Simple handlers that use the command-aware state setter
  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => resetCount();

  return (
    <div className="example">
      <div className="controls">
        <button onClick={increment}>Increment</button>
        <button onClick={decrement}>Decrement</button>
        <button onClick={reset}>Reset counter</button>
      </div>
      <div className="result">
        <p>Count: {count}</p>
      </div>
    </div>
  );
};

const CustomRenderControls = () => {
  const { 
    isPersistent, 
    togglePersistence,
    canUndo,
    canRedo,
    undo,
    redo,
    clear
  } = useCommandHistory();

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
      <button onClick={clear}>Clear History</button>
      {isPersistent !== undefined && (
        <div style={{ marginBottom: "1rem", display:"flex", alignItems: "center", gap: 2 }}>  
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
      )}
    </div>
  );
};

// Wrap the counter with UndoRedoProvider with persistence enabled by default
export const PersistentCounterExample: React.FC = () => {
  return ( 
    <UndoRedoProvider
      storageKey="persistent-counter-example"
      defaultPersistent={true}
    >
      <h2>Persistent Counter Example</h2>
      <div className="description">
        <p>
          This example demonstrates persistent undo/redo state using the simplified hooks.
          Toggle persistence and reload the page to see the state persist.
        </p>
        <p>
          The <code>useHistoryState</code> hook automatically handles command registration
          and persistence with minimal code.
        </p>
      </div>
      <Counter />
      <UndoRedoControls renderCustomControls={CustomRenderControls} />
    </UndoRedoProvider>
  );
};
