import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoListExample } from '../02-composite/TodoList';

describe('TodoList component', () => {
  it('renders with initial todo items', () => {
    render(<TodoListExample />);
    
    const todoItems = screen.getAllByRole('listitem');
    expect(todoItems.length).toBe(2);
    expect(todoItems[0]).toHaveTextContent('Learn about Command Pattern');
    expect(todoItems[1]).toHaveTextContent('Implement Undo/Redo');
  });
  
  it('adds a new todo when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<TodoListExample />);
    
    // Type in a new todo
    const input = screen.getByPlaceholderText('Add new todo');
    await user.type(input, 'Test the TodoList component');
    
    // Click the add button
    const addButton = screen.getByText('Add');
    await user.click(addButton);
    
    // Check if the new todo was added
    const todoItems = screen.getAllByRole('listitem');
    expect(todoItems.length).toBe(3);
    expect(todoItems[2]).toHaveTextContent('Test the TodoList component');
  });
  
  it('toggles todo completion when clicked', async () => {
    const user = userEvent.setup();
    render(<TodoListExample />);
    
    // Get the first todo item
    const firstTodo = screen.getAllByRole('listitem')[0];
    
    // Initially, it should not be completed
    expect(firstTodo).not.toHaveStyle('text-decoration: line-through');
    
    // Click on it to toggle completion
    await user.click(firstTodo);
    
    // Now it should be marked as completed
    expect(firstTodo).toHaveStyle('text-decoration: line-through');
    
    // Click again to toggle back to incomplete
    await user.click(firstTodo);
    
    // Should be back to incomplete
    expect(firstTodo).not.toHaveStyle('text-decoration: line-through');
  });
  
  it('completes all todos when Complete All button is clicked', async () => {
    const user = userEvent.setup();
    render(<TodoListExample />);
    
    // Click the Complete All button
    const completeAllButton = screen.getByText('Complete All');
    await user.click(completeAllButton);
    
    // All todos should be completed
    const todoItems = screen.getAllByRole('listitem');
    todoItems.forEach(todo => {
      expect(todo).toHaveStyle('text-decoration: line-through');
    });
  });
  
  it('undoes and redoes actions using the controls', async () => {
    const user = userEvent.setup();
    render(<TodoListExample />);
    
    // Add a new todo
    const input = screen.getByPlaceholderText('Add new todo');
    await user.type(input, 'New test todo');
    
    const addButton = screen.getByText('Add');
    await user.click(addButton);
    
    // Verify it was added
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    
    // Complete the first todo
    const firstTodo = screen.getAllByRole('listitem')[0];
    await user.click(firstTodo);
    
    // Now undo the completion
    const undoButton = screen.getByText('Undo');
    await user.click(undoButton);
    
    // First todo should be incomplete again
    expect(firstTodo).not.toHaveStyle('text-decoration: line-through');
    
    // Undo again to remove the added todo
    await user.click(undoButton);
    
    // Should be back to 2 todos
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    
    // Redo to add the todo back
    const redoButton = screen.getByText('Redo');
    await user.click(redoButton);
    
    // Should have 3 todos again
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});