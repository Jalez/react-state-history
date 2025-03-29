/** @format */

import React from "react";
import {
  StateHistoryProvider,
  useHistoryState,
  HistoryControls,
} from "../../StateHistory";

// Counter with registry-based persistence using the simplified hooks
export const Counter = () => {
  // The useHistoryState hook registers commands automatically
  // and handles persistence without any additional boilerplate
  const [count, setCount, resetCount] = useHistoryState<number>(
    "persistentCounter/setValue",
    0
  );

  // Simple handlers that use the StateChange-aware state setter
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

// Wrap the counter with StateHistoryProvider with persistence enabled by default
export const PersistentCounterExample: React.FC = () => {
  return (
    <StateHistoryProvider
      storageKey="persistent-counter-example"
      defaultPersistent={true}
    >
      <h2>Persistent Counter Example</h2>
      <div className="description">
        <p>
          This example demonstrates persistent undo/redo state using the
          simplified hooks. The state will be saved to localStorage and restored
          when you reload the page.
        </p>
        <p>
          The <code>useHistoryState</code> hook automatically handles
          StateChange registration and persistence with minimal code.
        </p>
        <p className="note" style={{ fontSize: "0.9em", color: "#666" }}>
          Key point: Persistence is enabled by default in this example. Try
          changing the value and refreshing the page to see it persist.
        </p>
      </div>
      <Counter />
      <HistoryControls showPersistenceToggle={true} />
    </StateHistoryProvider>
  );
};
