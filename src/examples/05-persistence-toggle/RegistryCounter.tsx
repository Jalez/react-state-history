import { useHistoryState } from "../../UndoRedo";

/**
 * RegistryCounter - A counter component that uses the simplified hooks
 * for better persistence and command restoration.
 * 
 * This component demonstrates how to use useHistoryState for seamless
 * integration with the command registry system.
 */
export const RegistryCounter = () => {
  // useHistoryState provides a value and setter that automatically:
  // 1. Registers the command type
  // 2. Creates commands when the setter is called
  // 3. Handles persistence through the registry system
  const [count, setCount, resetCount] = useHistoryState<number>(
    "registryCounter/setValue", 
    0
  );
  
  // Simple handlers that use the command-aware state setter
  const increment = () => setCount(count + 1, `Increment counter to ${count + 1}`);
  const decrement = () => setCount(count - 1, `Decrement counter to ${count - 1}`);
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
        <p className="note" style={{ fontSize: "0.8em", color: "#555" }}>
          This counter uses the simplified hooks with the command registry 
          for better persistence with minimal code.
        </p>
      </div>
    </div>
  );
};