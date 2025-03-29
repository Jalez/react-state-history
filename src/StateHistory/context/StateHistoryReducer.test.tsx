/** @format */
import { describe, it, expect } from 'vitest';
import { HistoryAction } from './StateHistoryReducer';
import { commandHistoryReducer, initialState } from './StateHistoryReducer';

describe('commandHistoryReducer', () => {
  it('should initialize with correct initial state', () => {
    const state = commandHistoryReducer(undefined, { type: '@@INIT' } as HistoryAction);
    expect(state).toEqual(initialState);
  });

  it('should handle EXECUTE action', () => {
    const testCommand = {
      execute: () => {},
      undo: () => {},
      id: 'test-id',
      description: 'Test command',
    };

    const state = commandHistoryReducer(initialState, {
      type: 'EXECUTE',
      StateChange: testCommand,
    });

    expect(state.undoStack).toHaveLength(1);
    expect(state.undoStack[0]).toBe(testCommand);
    expect(state.redoStack).toHaveLength(0);
    expect(state.canUndo).toBe(true);
    expect(state.canRedo).toBe(false);
  });

  it('should handle UNDO action', () => {
    const testCommand = {
      execute: () => {},
      undo: () => {},
      id: 'test-id',
      description: 'Test command',
    };

    // Set up the initial state with a command in the undoStack
    const startingState = {
      ...initialState,
      undoStack: [testCommand],
      canUndo: true,
    };

    const state = commandHistoryReducer(startingState, { type: 'UNDO' });

    expect(state.undoStack).toHaveLength(0);
    expect(state.redoStack).toHaveLength(1);
    expect(state.redoStack[0]).toBe(testCommand);
    expect(state.canUndo).toBe(false);
    expect(state.canRedo).toBe(true);
  });

  it('should handle REDO action', () => {
    const testCommand = {
      execute: () => {},
      undo: () => {},
      id: 'test-id',
      description: 'Test command',
    };

    // Set up the initial state with a command in the redoStack
    const startingState = {
      ...initialState,
      redoStack: [testCommand],
      canRedo: true,
    };

    const state = commandHistoryReducer(startingState, { type: 'REDO' });

    expect(state.undoStack).toHaveLength(1);
    expect(state.undoStack[0]).toBe(testCommand);
    expect(state.redoStack).toHaveLength(0);
    expect(state.canUndo).toBe(true);
    expect(state.canRedo).toBe(false);
  });

  it('should handle CLEAR action', () => {
    const testCommand = {
      execute: () => {},
      undo: () => {},
      id: 'test-id',
      description: 'Test command',
    };

    // Set up the initial state with commands in both stacks
    const startingState = {
      ...initialState,
      undoStack: [testCommand],
      redoStack: [testCommand],
      canUndo: true,
      canRedo: true,
    };

    const state = commandHistoryReducer(startingState, { type: 'CLEAR' });

    expect(state.undoStack).toHaveLength(0);
    expect(state.redoStack).toHaveLength(0);
    expect(state.canUndo).toBe(false);
    expect(state.canRedo).toBe(false);
  });

  it('should handle SET_MAX_STACK_SIZE action', () => {
    const testCommand1 = {
      execute: () => {},
      undo: () => {},
      id: 'test-id-1',
      description: 'Test command 1',
    };
    const testCommand2 = {
      execute: () => {},
      undo: () => {},
      id: 'test-id-2',
      description: 'Test command 2',
    };

    // Set up the initial state with two commands in the undoStack
    const startingState = {
      ...initialState,
      undoStack: [testCommand1, testCommand2],
      canUndo: true,
    };

    // Set max stack size to 1 - this should truncate the undoStack
    const state = commandHistoryReducer(startingState, {
      type: 'SET_MAX_STACK_SIZE',
      size: 1,
    });

    expect(state.maxStackSize).toBe(1);
    expect(state.undoStack).toHaveLength(1);
    expect(state.undoStack[0]).toBe(testCommand2);
  });

  it('should handle TOGGLE_PERSISTENCE action', () => {
    const state = commandHistoryReducer(initialState, {
      type: 'TOGGLE_PERSISTENCE',
    });

    expect(state.isPersistent).toBe(true);

    const nextState = commandHistoryReducer(state, {
      type: 'TOGGLE_PERSISTENCE',
    });

    expect(nextState.isPersistent).toBe(false);
  });

  it('should handle LOAD_PERSISTENT_STATE action', () => {
    const testCommand = {
      execute: () => {},
      undo: () => {},
      id: 'test-id',
      description: 'Test command',
    };

    const loadedState = {
      undoStack: [testCommand],
      redoStack: [],
      maxStackSize: 100,
      isPersistent: true,
    };

    const state = commandHistoryReducer(initialState, {
      type: 'LOAD_PERSISTENT_STATE',
      state: loadedState,
    });

    expect(state.undoStack).toEqual([testCommand]);
    expect(state.redoStack).toEqual([]);
    expect(state.maxStackSize).toBe(100);
    expect(state.isPersistent).toBe(true);
    expect(state.canUndo).toBe(true);
    expect(state.canRedo).toBe(false);
    // Command registry should be preserved from the initial state
    expect(state.commandRegistry).toEqual(initialState.commandRegistry);
  });

  it('should respect maxStackSize when executing commands', () => {
    const testCommand1 = {
      execute: () => {},
      undo: () => {},
      id: 'test-id-1',
      description: 'Test command 1',
    };
    const testCommand2 = {
      execute: () => {},
      undo: () => {},
      id: 'test-id-2',
      description: 'Test command 2',
    };
    const testCommand3 = {
      execute: () => {},
      undo: () => {},
      id: 'test-id-3',
      description: 'Test command 3',
    };

    // Set up a starting state with max stack size of 2
    const startingState = {
      ...initialState,
      maxStackSize: 2,
      undoStack: [testCommand1, testCommand2],
      canUndo: true,
    };

    // Execute a new command - this should push out the oldest command
    const state = commandHistoryReducer(startingState, {
      type: 'EXECUTE',
      StateChange: testCommand3,
    });

    expect(state.undoStack).toHaveLength(2);
    expect(state.undoStack[0]).toBe(testCommand2);
    expect(state.undoStack[1]).toBe(testCommand3);
  });
});