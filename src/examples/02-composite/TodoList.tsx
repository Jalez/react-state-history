/**
 * Composite Commands Example: Todo List
 *
 * This example demonstrates how to use the simplified hooks with
 * more complex data structures and composite commands.
 *
 * Key concepts demonstrated:
 * - Using useTrackableState for complex state (arrays of objects)
 * - Grouping multiple state changes as one undoable operation
 */
import { useState, useCallback } from "react";
import {
  StateHistoryProvider,
  HistoryControls,
  useTrackableState,
} from "../../StateHistory";

// Todo item interface
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// Simple todo list with undo/redo using our simplified hook
const TodoList = () => {
  // Regular React state for the todos
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "Learn about StateChange Pattern", completed: false },
    { id: 2, text: "Implement Undo/Redo", completed: false },
  ]);

  // Regular React state for the input field
  const [newTodoText, setNewTodoText] = useState("");

  // Create a StateChange-aware state setter for todos
  // This hook registers the StateChange type automatically
  const updateTodos = useTrackableState<Todo[]>(
    "todoList/updateTodos",
    setTodos
  );

  // Add a single todo with the StateChange-aware state setter
  const addTodo = () => {
    if (!newTodoText.trim()) return;

    const newTodo: Todo = {
      id: Date.now(),
      text: newTodoText,
      completed: false,
    };

    // Use our StateChange-aware state setter
    updateTodos([...todos, newTodo], todos, `Add todo: ${newTodo.text}`);
    setNewTodoText(""); // Clear input (doesn't need undo/redo)
  };

  // Complete all todos at once
  const completeAllTodos = useCallback(() => {
    // Only proceed if there are incomplete todos
    const incompleteTodos = todos.filter((todo) => !todo.completed);
    if (incompleteTodos.length === 0) return;

    // Create new todos with all items completed
    const newTodos = todos.map((todo) => ({ ...todo, completed: true }));

    // Use our StateChange-aware state setter with a descriptive message
    // This is a composite operation that changes multiple todos at once
    updateTodos(newTodos, todos, `Complete ${incompleteTodos.length} todos`);
  }, [todos, updateTodos]);

  // Toggle a single todo's completion status
  const toggleTodo = useCallback(
    (id: number) => {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return;

      const newTodos = todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      );

      // Use our StateChange-aware state setter
      updateTodos(newTodos, todos, `Toggle "${todo.text}"`);
    },
    [todos, updateTodos]
  );

  return (
    <div className="example">
      <div className="todo-input">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add new todo"
        />
        <button onClick={addTodo}>Add</button>
        <button onClick={completeAllTodos}>Complete All</button>
      </div>

      <ul className="todo-list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            onClick={() => toggleTodo(todo.id)}
            style={{
              textDecoration: todo.completed ? "line-through" : "none",
              cursor: "pointer",
            }}
          >
            {todo.text}
          </li>
        ))}
      </ul>

      <div className="undo-redo">
        <HistoryControls />
      </div>

      <div className="description">
        <p>
          This example demonstrates using the <code>useTrackableState</code>{" "}
          hook with a more complex data structure (an array of todo items).
        </p>
        <p>
          <strong>Key Point:</strong> The "Complete All" button shows a
          composite command that changes multiple todos at once but is treated
          as a single operation in the history. Try completing multiple todos
          and then using undo to reverse them all at once.
        </p>
      </div>
    </div>
  );
};

// Export the wrapped todo list example
export const TodoListExample = () => (
  <StateHistoryProvider>
    <h2>Composite Commands Example: Todo List</h2>
    <TodoList />
  </StateHistoryProvider>
);
