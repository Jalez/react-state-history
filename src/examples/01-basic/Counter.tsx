/**
 * Basic Example: Simple Counter with Undo/Redo
 *
 * This example demonstrates the most basic usage of the react-state-history library
 * with a simple counter that can be incremented, decremented, and reset.
 *
 * Key concepts demonstrated:
 * - Setting up StateHistoryProvider
 * - Using the useHistoryState hook for simplified state management
 * - Basic undo/redo operations
 *
 * @format
 */

import {
  StateHistoryProvider,
  useHistoryState,
  HistoryControls,
} from "../../StateHistory";

// Reusable counter logic component with undo/redo functionality
export const Counter = ({ 
  initialValue = 0,
  commandType = "counter/basic" // Default commandType for backwards compatibility
}: { 
  initialValue?: number;
  commandType?: string;
}) => {
  // useHistoryState provides a value and a setter that automatically creates commands
  const [count, setCount, resetCount] = useHistoryState<number>(
    commandType, // Use the provided commandType
    initialValue // Initial value
  );

  // No need to manually create commands - the hook handles that for us
  const increment = () =>
    setCount(count + 1, `Increment counter to ${count + 1}`);
  const decrement = () =>
    setCount(count - 1, `Decrement counter to ${count - 1}`);
  const reset = () => resetCount(); // Built-in reset functionality

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

// Export the wrapped counter example
export const CounterExample = () => (
  <StateHistoryProvider>
    <h2>Basic Example: Counter with Undo/Redo</h2>
    <div className="description">
      <p>
        This counter demonstrates basic StateChange creation and execution using
        the simplified <code>useHistoryState</code> hook. Each button press
        creates a StateChange that is added to the history stack. State
        management is fully handled by the useHistoryState hook.
      </p>
      <p>
        Try changing the counter value and then using the undo/redo buttons.
      </p>
    </div>
    <Counter commandType="counter/basic" />
    <HistoryControls />
  </StateHistoryProvider>
);
