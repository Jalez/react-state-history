import React, { useState } from "react";
import {
  UndoRedoProvider,
  useCommandHistory,
  createCommand,
} from "../../UndoRedo";
import UndoRedoControls from "../../UndoRedo/components/UndoRedoControls";
import { Command } from "../../UndoRedo/types";

const STORAGE_KEY = "persistent-toggle-counter";

interface CounterCommand extends Command {
  newValue: number;
  oldValue: number;
}

const Counter = () => {
  const [count, setCount] = useState(0);
  const { execute } = useCommandHistory();

  const createCounterCommand = (increment: boolean): CounterCommand => {
    const oldValue = count;
    const newValue = increment ? count + 1 : count - 1;

    return {
      execute: () => {
        setCount(newValue);
      },
      undo: () => {
        setCount(oldValue);
      },
      newValue,
      oldValue,
    };
  };

  const handleIncrement = () => {
    execute(createCounterCommand(true));
  };

  const handleDecrement = () => {
    execute(createCounterCommand(false));
  };

  return (
    <div className="counter-container">
      <button onClick={handleDecrement}>-</button>
      <span>{count}</span>
      <button onClick={handleIncrement}>+</button>
    </div>
  );
};

export const PersistentToggleCounter = () => {
  return (
    <div className="example-container">
      <h2>Persistent Toggle Counter</h2>
      <p>
        This example demonstrates toggling persistence on/off. The counter state
        will be preserved across page reloads when persistence is enabled.
      </p>

      <UndoRedoProvider storageKey={STORAGE_KEY} defaultPersistent={false}>
        <Counter />

        <UndoRedoControls
          showPersistenceToggle={true}
          persistenceLabel="Enable State Persistence"
        />

        <div className="info-text">
          Try changing the counter, then toggle persistence on and reload the
          page. The counter state will be preserved when persistence is enabled.
        </div>
      </UndoRedoProvider>
    </div>
  );
};
