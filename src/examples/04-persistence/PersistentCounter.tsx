/** @format */

import React from "react";
import { StateHistoryProvider, HistoryControls } from "../../StateHistory";
import { Counter } from "../01-basic/Counter";

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
      <Counter commandType="counter/persistent" />
      <HistoryControls showPersistenceToggle={true} />
    </StateHistoryProvider>
  );
};
