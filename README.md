# Undo/Redo System

[![codecov](https://codecov.io/gh/Jalez/undo-redo/graph/badge.svg?token=H0ILMYGA2O)](https://codecov.io/gh/Jalez/undo-redo)

The undo/redo functionality in this project is implemented using the **Command Pattern** - a behavioral design pattern that turns operations into stand-alone objects.

## Architectural Patterns

### Command Pattern

The Command Pattern encapsulates all information needed to perform an action as an object, allowing actions to be:
- Delayed 
- Queued
- Undone
- Redone
- Logged

It separates the object that invokes the operation from the one that knows how to perform it.

#### Core Components

- **Command Interface**: Defines `execute()` and `undo()` methods
- **Command History**: Maintains stacks of executed and undone commands
- **Command Execution**: Handles the execution and tracking of commands

### Additional Patterns Used

- **Memento Pattern**: For capturing and storing previous states
- **Composite Pattern**: For combining multiple commands into a single undoable operation
- **Dependency Inversion**: Domain-specific modules depend on UndoRedo, not vice versa

## Architecture Diagrams

### Command Pattern Flow

```
┌──────────────┐       creates       ┌──────────────┐
│              │ ─────────────────> │              │
│  Component   │                    │   Command    │
│  (Invoker)   │ <─────────────────┐│   Object     │
│              │    is executed by  │              │
└──────────────┘                    └──────────────┘
        │                                   │
        │ uses                              │ operates on
        ▼                                   ▼
┌──────────────┐                    ┌──────────────┐
│              │                    │              │
│  Command     │                    │  Application │
│  History     │                    │  State       │
│              │                    │              │
└──────────────┘                    └──────────────┘
```

### Undo/Redo System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                     React Application                      │
└───────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────┐
│                     StateHistoryProvider                       │
└───────────────────────────────────────────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────┐     ┌───────────────────────────┐
│  StateHistoryContext  │     │ UndoRedoControlsRegister  │
└─────────────────────────┘     └───────────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────┐     ┌───────────────────────────┐
│  useStateHistoryStore │     │      HistoryControls     │
└─────────────────────────┘     └───────────────────────────┘
        │        │        
        │        │        ┌───────────────────────────┐
        │        └───────▶│    useNodeCommands        │
        │                 └───────────────────────────┘
        │                                │
        │                                ▼
        │                 ┌───────────────────────────┐
        │                 │     NodeStore             │
        │                 └───────────────────────────┘
        │        
        │                 ┌───────────────────────────┐
        └────────────────▶│    useEdgeCommands        │
                          └───────────────────────────┘
                                         │
                                         ▼
                          ┌───────────────────────────┐
                          │     EdgeStore             │
                          └───────────────────────────┘
```

### Command Execution Flow

```
┌──────────────────┐  1. Create Command  ┌──────────────────┐
│                  │ ─────────────────> │                  │
│  Component       │                    │  Command Object  │
│                  │                    │  (Node, Edge)    │
└──────────────────┘                    └──────────────────┘
         │                                       │
         │ 2. Execute                            │
         ▼                                       │
┌──────────────────┐                             │
│                  │                             │
│  Command History │                             │
│  Store           │                             │
│                  │                             │
└──────────────────┘                             │
         │                                       │
         │ 3. Add to undo stack                  │
         ▼                                       │
┌──────────────────┐                             │
│                  │                             │
│  UndoStack       │                             │
│                  │                             │
└──────────────────┘                             │
                                                 │
┌──────────────────┐  4. Modify state           │
│                  │ <────────────────────────────
│  Application     │                              
│  State           │                              
│                  │                              
└──────────────────┘
```

### Undo Operation Flow

```
┌──────────────────┐  1. Request undo  ┌──────────────────┐
│                  │ ─────────────────> │                  │
│  Component       │                    │  Command History │
│                  │                    │  Store           │
└──────────────────┘                    └──────────────────┘
                                                 │
                                                 │ 2. Pop from stack
                                                 ▼
┌──────────────────┐                    ┌──────────────────┐
│                  │                    │                  │
│  RedoStack       │                    │  UndoStack       │
│                  │                    │                  │
└──────────────────┘                    └──────────────────┘
         ▲                                       │
         │ 4. Push command                       │ 3. Get last command
         │                                       │
┌────────┴───────────┐                  ┌────────▼───────────┐
│                    │  5. Call undo()  │                    │
│  Command History   │ <────────────────┤   Last Command     │
│  Store             │                  │                    │
└────────────────────┘                  └────────────────────┘
                                                 │
                                                 │ 6. Restore state
                                                 ▼
                                        ┌──────────────────┐
                                        │                  │
                                        │  Application     │
                                        │  State           │
                                        │                  │
                                        └──────────────────┘
```

## Directory Structure

```
UndoRedo/
├── components/           # UI components for undo/redo
├── context/              # React context for command history
├── store/                # Zustand store implementation
├── types/                # TypeScript interfaces and types
├── utils/                # Helper utilities
└── README.md             # This documentation
```

## How It Works

1. Operations that modify state are wrapped as Command objects
2. When executed, these commands:
   - Perform the operation
   - Store information needed to undo the operation
   - Get added to the undo stack
3. When undo is requested:
   - The most recent command is popped from the undo stack
   - Its `undo()` method is called
   - The command is pushed to the redo stack
4. When redo is requested:
   - The most recent undone command is popped from the redo stack
   - Its `execute()` method is called
   - The command is pushed back to the undo stack

## Usage Guide

### Basic Setup

1. Wrap your app with the UndoRedo provider:

```tsx
import { StateHistoryProvider } from '../UndoRedo';

const App = () => (
  <StateHistoryProvider>
    <YourApplication />
  </StateHistoryProvider>
);
```

### Using Domain-Specific Commands

Domain modules like `Node` and `Edge` provide hooks that return commands specific to that domain:

```tsx
// In a component working with nodes
import { useNodeCommands } from '../../Node/hooks/useNodeCommands';

const NodeComponent = () => {
  const { addNode, updateNode, deleteNode } = useNodeCommands();
  
  const handleAddNode = () => {
    // This operation is automatically added to undo history
    addNode(newNode);
  };
  
  const handleUpdateNode = () => {
    updateNode(modifiedNode);
  };
  
  const handleDeleteNode = () => {
    deleteNode(nodeId);
  };
  
  return (/* Component JSX */);
};
```

### Creating Custom Commands

For operations not covered by existing domain hooks:

```tsx
import { createCommand, useStateHistory } from '../UndoRedo';

const CustomComponent = () => {
  const { execute } = useStateHistory();
  const [value, setValue] = useState('');
  
  const handleChange = (newValue: string) => {
    const oldValue = value;
    
    const command = createCommand({
      execute: () => setValue(newValue),
      undo: () => setValue(oldValue),
      description: `Change value from "${oldValue}" to "${newValue}"`
    });
    
    execute(command);
  };
};
```

### Complex Operations (Composite Commands)

For operations that involve multiple steps:

```tsx
import { createCompositeCommand, useStateHistory } from '../UndoRedo';
import { useNodeCommands } from '../../Node/hooks/useNodeCommands';

const ComplexComponent = () => {
  const { execute } = useStateHistory();
  const { commands: nodeCommands } = useNodeCommands();
  
  const handleComplexOperation = () => {
    // Create individual commands
    const addNodeCommand = nodeCommands.createAddNodeCommand(newNode);
    const updateNodeCommand = nodeCommands.createUpdateNodeCommand(existingNode);
    
    // Combine into a composite command
    const compositeCommand = createCompositeCommand(
      [addNodeCommand, updateNodeCommand],
      'Complex node operation'
    );
    
    // Execute as a single undoable operation
    execute(compositeCommand);
  };
};
```

### Accessing Undo/Redo State

To check if undo/redo operations are available:

```tsx
import { useStateHistory } from '../UndoRedo';

const StatusComponent = () => {
  const { canUndo, canRedo } = useStateHistory();
  
  return (
    <div>
      <span>Can undo: {canUndo ? 'Yes' : 'No'}</span>
      <span>Can redo: {canRedo ? 'Yes' : 'No'}</span>
    </div>
  );
};
```

### Keyboard Shortcuts

The system automatically integrates with keyboard shortcuts. Default bindings:
- **Ctrl+Z**: Undo
- **Ctrl+Y** or **Ctrl+Shift+Z**: Redo

## Best Practices

1. **Deep Clone State**: Always deep clone objects to prevent reference mutations:
   ```tsx
   const stateCopy = JSON.parse(JSON.stringify(originalState));
   ```
   
   Or use the provided utility:
   ```tsx
   import { deepClone } from '../UndoRedo';
   const stateCopy = deepClone(originalState);
   ```

2. **Command Descriptions**: Add meaningful descriptions to commands to help with debugging:
   ```tsx
   createCommand({
     execute: () => {...},
     undo: () => {...},
     description: 'Meaningful description of what this command does'
   });
   ```

3. **Command Validation**: Always validate state before creating commands:
   ```tsx
   const createUpdateCommand = (item) => {
     const original = getOriginalItem(item.id);
     if (!original) {
       console.warn('Cannot create command: Item not found');
       return null;
     }
     // Create and return command
   };
   ```

4. **Handle Command Failures**: Check for null/undefined commands:
   ```tsx
   const command = createUpdateCommand(item);
   if (command) execute(command);
   ```

## Architecture Decisions

### Decoupled Domain Logic

Domain-specific commands (for nodes, edges, etc.) are defined in their respective modules to keep the UndoRedo system generic and domain modules focused on their concerns.

### Command vs Registry Pattern

While the UI components use a Registry pattern for flexible registration, the undo/redo system uses the Command pattern as it's specifically designed for operation tracking and reversal.

### State Management

Zustand is used for managing command history state for consistency with the rest of the application's state management approach.