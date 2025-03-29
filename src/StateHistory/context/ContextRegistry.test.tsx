/** @format */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StateHistoryProvider } from './StateHistoryContext';

describe('Context Registry', () => {
  // Simple counter component for testing context isolation
  const Counter = ({ id, onIncrement }: { id: string, onIncrement?: () => void }) => {
    const [count, setCount] = React.useState(0);
    
    return (
      <div data-testid={`counter-${id}`}>
        <div data-testid={`value-${id}`}>{count}</div>
        <button 
          data-testid={`increment-${id}`}
          onClick={() => {
            setCount(count + 1);
            if (onIncrement) onIncrement();
          }}
        >
          Increment
        </button>
      </div>
    );
  };
  
  it('should isolate state between different StateHistoryProvider contexts', () => {
    // Create mock functions to track command executions in each context
    const context1Increment = vi.fn();
    const context2Increment = vi.fn();
    
    render(
      <>
        <div data-testid="context-1">
          <StateHistoryProvider>
            <Counter id="1" onIncrement={context1Increment} />
          </StateHistoryProvider>
        </div>
        <div data-testid="context-2">
          <StateHistoryProvider>
            <Counter id="2" onIncrement={context2Increment} />
          </StateHistoryProvider>
        </div>
      </>
    );
    
    // Initial state
    expect(screen.getByTestId('value-1').textContent).toBe('0');
    expect(screen.getByTestId('value-2').textContent).toBe('0');
    
    // Increment counter in first context
    fireEvent.click(screen.getByTestId('increment-1'));
    
    // Only the first counter should be incremented
    expect(screen.getByTestId('value-1').textContent).toBe('1');
    expect(screen.getByTestId('value-2').textContent).toBe('0');
    expect(context1Increment).toHaveBeenCalledTimes(1);
    expect(context2Increment).not.toHaveBeenCalled();
    
    // Increment counter in second context
    fireEvent.click(screen.getByTestId('increment-2'));
    
    // Both counters should have their own independent values
    expect(screen.getByTestId('value-1').textContent).toBe('1');
    expect(screen.getByTestId('value-2').textContent).toBe('1');
    expect(context1Increment).toHaveBeenCalledTimes(1);
    expect(context2Increment).toHaveBeenCalledTimes(1);
  });
  
  it('should share state between components in the same context', () => {
    // Create a component that uses the same context for two counters
    const SharedContextComponent = () => (
      <StateHistoryProvider>
        <div data-testid="shared-context">
          <Counter id="a" />
          <Counter id="b" />
        </div>
      </StateHistoryProvider>
    );
    
    render(<SharedContextComponent />);
    
    // Initial state
    expect(screen.getByTestId('value-a').textContent).toBe('0');
    expect(screen.getByTestId('value-b').textContent).toBe('0');
    
    // Click increment on first counter
    fireEvent.click(screen.getByTestId('increment-a'));
    
    // First counter should be incremented
    expect(screen.getByTestId('value-a').textContent).toBe('1');
    
    // Second counter should remain at 0 (no shared state by default)
    // This tests that unrelated components don't affect each other
    expect(screen.getByTestId('value-b').textContent).toBe('0');
  });
});