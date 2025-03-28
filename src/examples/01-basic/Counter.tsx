/**
 * Basic Example: Simple Counter with Undo/Redo
 *
 * This example demonstrates the most basic usage of the undo-redo-ts library
 * with a simple counter that can be incremented, decremented, and reset.
 *
 * Key concepts demonstrated:
 * - Setting up StateHistoryProvider
 * - Using the useStateHistory hook for simplified state management
 * - Basic undo/redo operations
 */
import {
  StateHistoryProvider,
  useStateHistory,
} from "../../StateHistory";

import HistoryControls from "../../StateHistory/components/HistoryControls";
// Reusable counter logic component with undo/redo functionality
export const Counter = ({
  initialValue = 0,
}: {
  initialValue?: number;
}) => {
  // useStateHistory provides a value and a setter that automatically creates commands
  const [count, setCount, resetCount] = useStateHistory<number>(
    "counter/setValue", // StateChange type identifier
    initialValue // Initial value
  );

  // No need to manually create commands - the hook handles that for us
  const increment = () => setCount(count + 1, `Increment counter to ${count + 1}`);
  const decrement = () => setCount(count - 1, `Decrement counter to ${count - 1}`);
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

      <div className="undo-redo">
      </div>
    </div>
  )
}

// Export the wrapped counter example
export const CounterExample = () => (
  <StateHistoryProvider>
    <h2>Basic Example: Counter with Undo/Redo</h2>
    <div className="description">
      <p>
        This counter demonstrates basic StateChange creation and execution using the
        simplified <code>useStateHistory</code> hook. Each button press creates
        a StateChange that is added to the history stack.
      </p>
      <p>
        Try changing the counter value and then using the undo/redo buttons.
      </p>
    </div>
    <HistoryControls />
    <Counter />
  </StateHistoryProvider>
);
