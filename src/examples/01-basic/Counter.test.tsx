import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from '../01-basic/Counter';
import { UndoRedoProvider } from '../../UndoRedo';

// Wrap Counter in UndoRedoProvider to provide the required context
const CounterWithProvider = ({ initialValue }: { initialValue?: number }) => (
  <UndoRedoProvider>
    <Counter initialValue={initialValue} />
  </UndoRedoProvider>
);

describe('Counter component', () => {
  it('renders with initial counter value', () => {
    render(<CounterWithProvider initialValue={5} />);
    expect(screen.getByText(/count: 5/i)).toBeInTheDocument();
  });
  
  it('increments counter when increment button is clicked', async () => {
    render(<CounterWithProvider />);
    const user = userEvent.setup();
    
    // Get initial value
    expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
    
    // Click increment button
    const incrementButton = screen.getByText('Increment');
    await user.click(incrementButton);
    
    // Counter should be incremented
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
  });
  
  it('decrements counter when decrement button is clicked', async () => {
    render(<CounterWithProvider initialValue={5} />);
    const user = userEvent.setup();
    
    // Get initial value
    expect(screen.getByText(/count: 5/i)).toBeInTheDocument();
    
    // Click decrement button
    const decrementButton = screen.getByText('Decrement');
    await user.click(decrementButton);
    
    // Counter should be decremented
    expect(screen.getByText(/count: 4/i)).toBeInTheDocument();
  });
  
  it('resets counter when reset button is clicked', async () => {
    render(<CounterWithProvider initialValue={5} />);
    const user = userEvent.setup();
    
    // Get initial value
    expect(screen.getByText(/count: 5/i)).toBeInTheDocument();
    
    // Click decrement button to change the value
    const decrementButton = screen.getByText('Decrement');
    await user.click(decrementButton);
    expect(screen.getByText(/count: 4/i)).toBeInTheDocument();
    
    // Click reset button
    const resetButton = screen.getByText('Reset counter');
    await user.click(resetButton);
    
    // Counter should be back to initial value
    expect(screen.getByText(/count: 5/i)).toBeInTheDocument();
  });
});