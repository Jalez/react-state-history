import {
  StateHistoryProvider,
  useHistoryState,
  HistoryControls,
} from "../../StateHistory";

const STORAGE_KEY = "persistent-toggle-counter";

// Simple counter that uses the useHistoryState hook
const Counter = () => {
  const [count, setCount, resetCount] = useHistoryState<number>(
    "toggleCounter/setValue",
    0
  );

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

// Example focused specifically on demonstrating the persistence toggle feature
export const PersistentToggleCounter = () => {
  return (
    <div className="example-container">
      <h2>Persistence Toggle Example</h2>
      <div className="description">
        <p>
          This example focuses on demonstrating how to toggle persistence on and
          off. Unlike example 04 which starts with persistence enabled, this
          example starts with persistence disabled by default.
        </p>
      </div>

      <StateHistoryProvider storageKey={STORAGE_KEY} defaultPersistent={false}>
        <Counter />

        <div
          className="info-text"
          style={{ marginTop: "1rem", fontSize: "0.9em", color: "#666" }}
        >
          Try changing the counter value, then:
          <ol>
            <li>Enable persistence using the checkbox below</li>
            <li>Reload the page to see that your state is preserved</li>
            <li>Disable persistence and reload again to see the state reset</li>
          </ol>
          <strong>Key point:</strong> This demonstrates how users can control
          whether state persists between sessions.
        </div>
        <HistoryControls
          showPersistenceToggle={true}
          persistenceLabel="Enable State Persistence"
        />
      </StateHistoryProvider>
    </div>
  );
};
