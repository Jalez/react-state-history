import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PersistentCounterExample } from './PersistentCounter';
import { setupMockLocalStorage } from '../../test/mockLocalStorage';

describe('PersistentCounter component', () => {
  const { restoreLocalStorage } = setupMockLocalStorage();

  afterEach(() => {
    localStorage.clear();
    restoreLocalStorage();
  });

  it('renders with initial counter value', () => {
    render(<PersistentCounterExample />);
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('updates counter value when buttons are clicked', async () => {
    const user = userEvent.setup();
    render(<PersistentCounterExample />);

    // Initial value
    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    // Increment
    const incrementButton = screen.getByText('Increment');
    await user.click(incrementButton);
    expect(screen.getByText('Count: 1')).toBeInTheDocument();

    // Increment again
    await user.click(incrementButton);
    expect(screen.getByText('Count: 2')).toBeInTheDocument();

    // Decrement
    const decrementButton = screen.getByText('Decrement');
    await user.click(decrementButton);
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('persists state to localStorage when persistence is enabled', async () => {
    const user = userEvent.setup();
    render(<PersistentCounterExample />);

    // Persistence should be enabled by default in this component
    const checkbox = screen.getByLabelText(/Enable Persistence/);
    expect(checkbox).toBeChecked();

    // Change the value
    const incrementButton = screen.getByText('Increment');
    await user.click(incrementButton);
    await user.click(incrementButton);
    expect(screen.getByText('Count: 2')).toBeInTheDocument();

    // Local storage should have been updated
    expect(localStorage.getItem('undoredo_history_persistent-counter-example')).toBeTruthy();
  });

  it('supports undo/redo operations', async () => {
    const user = userEvent.setup();
    render(<PersistentCounterExample />);

    // Increment a few times
    const incrementButton = screen.getByText('Increment');
    await user.click(incrementButton);
    await user.click(incrementButton);
    await user.click(incrementButton);
    expect(screen.getByText('Count: 3')).toBeInTheDocument();

    // Undo once
    const undoButton = screen.getByText('Undo');
    await user.click(undoButton);
    expect(screen.getByText('Count: 2')).toBeInTheDocument();

    // Undo again
    await user.click(undoButton);
    expect(screen.getByText('Count: 1')).toBeInTheDocument();

    // Redo
    const redoButton = screen.getByText('Redo');
    await user.click(redoButton);
    expect(screen.getByText('Count: 2')).toBeInTheDocument();
  });

  it('clears history when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<PersistentCounterExample />);

    // Increment a couple times
    const incrementButton = screen.getByText('Increment');
    await user.click(incrementButton);
    await user.click(incrementButton);
    expect(screen.getByText('Count: 2')).toBeInTheDocument();

    // Clear the history
    const clearButton = screen.getByText('Clear History');
    await user.click(clearButton);

    // Value should remain, but undo should not work
    expect(screen.getByText('Count: 2')).toBeInTheDocument(); // Still 2

    // Try to undo (should be disabled or have no effect)
    const undoButton = screen.getByText('Undo');
    expect(undoButton).toBeDisabled();
  });
});