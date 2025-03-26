/**
 * Composite Commands Example: Todo List
 *
 * This example demonstrates how to use composite commands to group
 * multiple operations into a single undoable action.
 *
 * Key concepts demonstrated:
 * - Creating composite commands
 * - Grouping multiple state changes as one undoable operation
 * - Maintaining data consistency during undo/redo
 */
import React, { useState } from "react";
import {
  UndoRedoProvider,
  UndoRedoControls,
  useCommandHistory,
  createCommand,
  createCompositeCommand,
} from "../../UndoRedo";

// Todo item interface
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// Simple todo list with undo/redo using composite commands
const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "Learn about Command Pattern", completed: false },
    { id: 2, text: "Implement Undo/Redo", completed: false },
  ]);
  const [newTodoText, setNewTodoText] = useState("");
  const { execute } = useCommandHistory();

  // Add a single todo
  const addTodo = () => {
    if (!newTodoText.trim()) return;

    const newTodo: Todo = {
      id: Date.now(),
      text: newTodoText,
      completed: false,
    };

    // Create a command that both adds a todo and clears the input
    const addCommand = createCommand({
      execute: () => {
        setTodos([...todos, newTodo]);
        setNewTodoText("");
      },
      undo: () => {
        setTodos(todos.filter((todo) => todo.id !== newTodo.id));
      },
      description: `Add todo: ${newTodo.text}`,
    });

    execute(addCommand);
  };

  // Complete all todos (demonstrates composite commands)
  const completeAllTodos = () => {
    // Only proceed if there are incomplete todos
    const incompleteTodos = todos.filter((todo) => !todo.completed);
    if (incompleteTodos.length === 0) return;

    // Track old state to support undo
    const oldTodos = [...todos];
    const newTodos = todos.map((todo) => ({ ...todo, completed: true }));

    // Create individual commands for each todo being completed
    const commands = incompleteTodos.map((todo) =>
      createCommand({
        execute: () => {}, // Empty because we'll handle state update in the composite
        undo: () => {}, // Empty because we'll handle state update in the composite
        description: `Complete "${todo.text}"`,
      })
    );

    // Create a composite command that handles all todos at once
    const compositeCommand = createCompositeCommand(
      commands,
      `Complete ${incompleteTodos.length} todos`
    );

    // Wrap with an outer command that actually updates the state
    const batchCommand = createCommand({
      execute: () => {
        compositeCommand?.execute();
        setTodos(newTodos);
      },
      undo: () => {
        compositeCommand?.undo();
        setTodos(oldTodos);
      },
      description: `Complete all todos`,
    });

    execute(batchCommand);
  };

  // Toggle a single todo's completion status
  const toggleTodo = (id: number) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    const oldTodos = [...todos];
    const newTodos = todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );

    const command = createCommand({
      execute: () => setTodos(newTodos),
      undo: () => setTodos(oldTodos),
      description: `Toggle "${todo.text}"`,
    });

    execute(command);
  };

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
        <UndoRedoControls />
      </div>

      <div className="description">
        <p>
          This example demonstrates composite commands by grouping multiple todo
          updates into a single undoable operation. The "Complete All" button
          creates a single undo step despite changing multiple todo items.
        </p>
        <p>
          Try adding todos, marking them complete individually or all at once,
          then using undo to see the difference.
        </p>
      </div>
    </div>
  );
};

// Export the wrapped todo list example
export const TodoListExample = () => (
  <UndoRedoProvider>
    <h1>Composite Commands Example: Todo List</h1>
    <TodoList />
  </UndoRedoProvider>
);
