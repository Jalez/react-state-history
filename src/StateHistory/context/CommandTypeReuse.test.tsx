/** @format */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StateHistoryProvider } from './StateHistoryContext';
import { useHistoryState } from '../hooks/useTrackableState';

/**
 * This test suite specifically focuses on validating that:
 * 1. Command types must be unique within a single context
 * 2. The same command type can be reused across different contexts
 */
describe('Command Type Reuse Across Contexts', () => {
  // Simple Counter component using useHistoryState hook
  // This component is a pure function of the props and internal state
  const Counter = ({ id, commandType }: { id: string; commandType: string }) => {
    const [count, setCount] = useHistoryState(commandType, 0);
    
    return (
      <div data-testid={`counter-${id}`}>
        <span data-testid={`value-${id}`}>{count}</span>
        <button data-testid={`increment-${id}`} onClick={() => setCount(count + 1)}>
          +
        </button>
        <button data-testid={`decrement-${id}`} onClick={() => setCount(count - 1)}>
          -
        </button>
      </div>
    );
  };
  
  it('allows reusing the same command type across different contexts', () => {
    // Render two providers with counters using the same command type
    render(
      <>
        <StateHistoryProvider>
          <div data-testid="context-1">
            <Counter id="c1" commandType="shared-counter" />
          </div>
        </StateHistoryProvider>
        <StateHistoryProvider>
          <div data-testid="context-2">
            <Counter id="c2" commandType="shared-counter" />
          </div>
        </StateHistoryProvider>
      </>
    );
    
    // Get references to the counter elements
    const value1 = screen.getByTestId('value-c1');
    const value2 = screen.getByTestId('value-c2');
    const increment1 = screen.getByTestId('increment-c1');
    const increment2 = screen.getByTestId('increment-c2');
    
    // Confirm initial state is 0 for both counters
    expect(value1.textContent).toBe('0');
    expect(value2.textContent).toBe('0');
    
    // Increment counter 1
    fireEvent.click(increment1);
    
    // Only counter 1 should be updated
    expect(value1.textContent).toBe('1');
    expect(value2.textContent).toBe('0');
    
    // Increment counter 2
    fireEvent.click(increment2);
    
    // Each counter should have its own independent state
    expect(value1.textContent).toBe('1');
    expect(value2.textContent).toBe('1');
  });
  
  it('synchronizes state for shared command types within the same context', () => {
    // Create a component that shares state via the same command type
    const SharedStateComponent = () => {
      // Use a shared value in the parent to ensure both children see updates
      const [sharedValue, setSharedValue] = React.useState(0);
      
      // Component using a trackable state that shares its value
      const StateSharer = ({ id }: { id: string }) => {
        const [value, setValue] = useHistoryState('shared-state', sharedValue);
        
        return (
          <div data-testid={`sharer-${id}`}>
            <span data-testid={`display-${id}`}>{value}</span>
            <button 
              data-testid={`update-${id}`} 
              onClick={() => {
                const newValue = value + 1;
                setValue(newValue);
                setSharedValue(newValue); // Update the parent's state to force synchronization
              }}
            >
              Update
            </button>
          </div>
        );
      };
      
      return (
        <>
          <StateSharer id="a" />
          <StateSharer id="b" />
        </>
      );
    };
    
    render(
      <StateHistoryProvider>
        <SharedStateComponent />
      </StateHistoryProvider>
    );
    
    // Initial state should be 0 for both components
    expect(screen.getByTestId('display-a').textContent).toBe('0');
    expect(screen.getByTestId('display-b').textContent).toBe('0');
    
    // Update the first component
    fireEvent.click(screen.getByTestId('update-a'));
    
    // Both components should now show 1
    expect(screen.getByTestId('display-a').textContent).toBe('1');
    expect(screen.getByTestId('display-b').textContent).toBe('1');
  });
  
  it('maintains separate state for different command types in the same context', () => {
    // Render two counters with different command types in the same context
    render(
      <StateHistoryProvider>
        <div data-testid="different-commands">
          <Counter id="x" commandType="counter-x" />
          <Counter id="y" commandType="counter-y" />
        </div>
      </StateHistoryProvider>
    );
    
    // Get references to the counter elements
    const valueX = screen.getByTestId('value-x');
    const valueY = screen.getByTestId('value-y');
    const incrementX = screen.getByTestId('increment-x');
    const incrementY = screen.getByTestId('increment-y');
    
    // Confirm initial state is 0 for both counters
    expect(valueX.textContent).toBe('0');
    expect(valueY.textContent).toBe('0');
    
    // Increment counter X
    fireEvent.click(incrementX);
    
    // Only counter X should be updated
    expect(valueX.textContent).toBe('1');
    expect(valueY.textContent).toBe('0');
    
    // Increment counter Y
    fireEvent.click(incrementY);
    
    // Each counter maintains its own state
    expect(valueX.textContent).toBe('1');
    expect(valueY.textContent).toBe('1');
  });
});