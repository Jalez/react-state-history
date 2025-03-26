/**
 * Basic Example: Simple Counter with Undo/Redo
 *
 * This example demonstrates the most basic usage of the undo-redo-ts library
 * with a simple counter that can be incremented, decremented, and reset.
 *
 * Key concepts demonstrated:
 * - Setting up UndoRedoProvider
 * - Creating basic commands
 * - Using the useCommandHistory hook
 * - Basic undo/redo operations
 */
import React, { useState } from "react";
import {
  UndoRedoProvider,
  UndoRedoControls,
  useCommandHistory,
  createCommand,
} from "../../UndoRedo";

// Simple counter component with undo/redo functionality
const Counter = () => {
  const [count, setCount] = useState(0);
  const { execute } = useCommandHistory();

  // Create a command to change the counter value
  const updateCount = (newValue: number) => {
    const oldValue = count;

    const command = createCommand({
      execute: () => setCount(newValue),
      undo: () => setCount(oldValue),
      description: `Change counter from ${oldValue} to ${newValue}`,
    });

    execute(command);
  };

  return (
    <div className="example">
      <h2>Counter: {count}</h2>

      <div className="controls">
        <button onClick={() => updateCount(count + 1)}>Increment</button>

        <button onClick={() => updateCount(count - 1)}>Decrement</button>

        <button onClick={() => updateCount(0)}>Reset</button>
      </div>

      <div className="undo-redo">
        <UndoRedoControls />
      </div>

      <div className="description">
        <p>
          This counter demonstrates basic command creation and execution. Each
          button press creates a command that is added to the history stack.
        </p>
        <p>
          Try changing the counter value and then using the undo/redo buttons.
        </p>
      </div>
    </div>
  );
};

// Export the wrapped counter example
export const CounterExample = () => (
  <UndoRedoProvider>
    <h1>Basic Example: Counter with Undo/Redo</h1>
    <Counter />
  </UndoRedoProvider>
);
