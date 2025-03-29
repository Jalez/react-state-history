/**
 * Command Type Uniqueness Example
 * 
 * This example demonstrates why command types must be unique within the same StateHistoryProvider context.
 * It shows both the problem (using the same commandType for multiple components) and the solution.
 */

import { useState } from "react";
import {
  StateHistoryProvider,
  useHistoryState,
  HistoryControls,
} from "../../StateHistory";
import { Counter } from "../01-basic/Counter";

/**
 * ProblemExample: Shows what happens when two components use the same commandType
 * The second counter will interfere with the first one's history
 */
const ProblemExample = () => {
  return (
    <div className="example">
      <h3>🚫 Problem: Same Command Type</h3>
      <p>
        Both counters below use the same commandType. Notice how changing one affects the other's history:
      </p>
      <div style={{ display: "flex", gap: "2rem" }}>
        <div>
          <h4>Counter 1</h4>
          <Counter commandType="sharedCommand" />
        </div>
        <div>
          <h4>Counter 2</h4>
          <Counter commandType="sharedCommand" />
        </div>
      </div>
      <p className="note" style={{ color: "#e74c3c" }}>
        Try incrementing Counter 1, then incrementing Counter 2, then clicking Undo.
        Both counters will be affected by the same history!
      </p>
      <HistoryControls />
    </div>
  );
};

/**
 * SolutionExample: Shows the correct approach with unique commandTypes
 */
const SolutionExample = () => {
  return (
    <div className="example">
      <h3>✅ Solution: Unique Command Types</h3>
      <p>
        Each counter uses a unique commandType, keeping their history separate:
      </p>
      <div style={{ display: "flex", gap: "2rem" }}>
        <div>
          <h4>Counter 1</h4>
          <Counter commandType="uniqueCommand1" />
        </div>
        <div>
          <h4>Counter 2</h4>
          <Counter commandType="uniqueCommand2" />
        </div>
      </div>
      <p className="note" style={{ color: "#27ae60" }}>
        Now try the same experiment. When you undo, only the most recent counter change
        will be affected, maintaining separate history for each component.
      </p>
      <HistoryControls />
    </div>
  );
};

/**
 * Custom counter that shows its commandType
 * This helps illustrate what's happening behind the scenes
 */
const InstrumentedCounter = ({ commandType }: { commandType: string }) => {
  const [count, setCount, resetCount] = useHistoryState<number>(commandType, 0);
  
  return (
    <div className="instrumented-counter">
      <div className="controls">
        <button onClick={() => setCount(count + 1)}>Increment</button>
        <button onClick={() => setCount(count - 1)}>Decrement</button>
        <button onClick={resetCount}>Reset</button>
      </div>
      <div className="result">
        <p>Count: {count}</p>
        <p style={{ fontSize: '0.8em', color: '#666' }}>
          commandType: "{commandType}"
        </p>
      </div>
    </div>
  );
};

/**
 * Live example that lets users experiment with commandTypes
 */
const ExperimentExample = () => {
  const [counter1Type, setCounter1Type] = useState("counter1");
  const [counter2Type, setCounter2Type] = useState("counter2");
  
  return (
    <div className="example">
      <h3>🧪 Experiment: Try It Yourself</h3>
      <p>
        Change the commandType values below to see how it affects history behavior:
      </p>
      
      <div style={{ display: "flex", gap: "2rem" }}>
        <div>
          <h4>Counter 1</h4>
          <input
            type="text"
            value={counter1Type}
            onChange={(e) => setCounter1Type(e.target.value)}
            style={{ marginBottom: '0.5rem' }}
          />
          <InstrumentedCounter commandType={counter1Type} />
        </div>
        
        <div>
          <h4>Counter 2</h4>
          <input
            type="text"
            value={counter2Type}
            onChange={(e) => setCounter2Type(e.target.value)}
            style={{ marginBottom: '0.5rem' }}
          />
          <InstrumentedCounter commandType={counter2Type} />
        </div>
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        <p className="note">
          Try setting both inputs to the same value and notice how the counters
          share history. Then set them to different values to see isolated history.
        </p>
      </div>
      
      <HistoryControls />
    </div>
  );
};

// Main example component
export const DuplicateCommandTypesExample = () => {
  return (
    <>
      <h2>Command Type Uniqueness</h2>
      <div className="description">
        <p>
          This example demonstrates a critical concept in react-state-history:
          <strong> command types must be unique within the same context</strong>.
        </p>
        <p>
          While our library separates command registries between different
          <code>StateHistoryProvider</code> contexts, components within the
          same context must use unique command types to avoid interference.
        </p>
      </div>
      
      <StateHistoryProvider>
        <ProblemExample />
      </StateHistoryProvider>
      
      <StateHistoryProvider>
        <SolutionExample />
      </StateHistoryProvider>
      
      <StateHistoryProvider>
        <ExperimentExample />
      </StateHistoryProvider>
    </>
  );
};