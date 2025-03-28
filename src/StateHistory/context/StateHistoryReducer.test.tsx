import { describe, it, expect } from 'vitest';
import { commandHistoryReducer, initialState } from './StateHistoryReducer';
import { StateChange, StateHistoryAction, StateHistory } from '../types';

describe('commandHistoryReducer', () => {
  // Create mock commands for testing
  const createMockCommand = (id: string): StateChange => ({
    execute: () => {},
    undo: () => {},
    id,
    description: `Mock StateChange ${id}`
  });

  it('should initialize with correct initial state', () => {
    expect(initialState).toEqual({
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
      maxStackSize: 50,
      isPersistent: false,
    });
  });

  it('should handle EXECUTE action', () => {
    const StateChange = createMockCommand('cmd1');
    const action: StateHistoryAction = { type: 'EXECUTE', StateChange };
    
    const nextState = commandHistoryReducer(initialState, action);
    
    expect(nextState.undoStack).toEqual([StateChange]);
    expect(nextState.redoStack).toEqual([]);
    expect(nextState.canUndo).toBe(true);
    expect(nextState.canRedo).toBe(false);
  });

  it('should handle UNDO action', () => {
    const command1 = createMockCommand('cmd1');
    const command2 = createMockCommand('cmd2');
    
    // Set up state with two commands in the undo stack
    const currentState: StateHistory = {
      ...initialState,
      undoStack: [command1, command2],
      canUndo: true
    };
    
    const action: StateHistoryAction = { type: 'UNDO' };
    const nextState = commandHistoryReducer(currentState, action);
    
    expect(nextState.undoStack).toEqual([command1]);
    expect(nextState.redoStack).toEqual([command2]);
    expect(nextState.canUndo).toBe(true); // Still true because command1 is still in the stack
    expect(nextState.canRedo).toBe(true); // Now true because command2 is in the redo stack
  });
  
  it('should handle REDO action', () => {
    const command1 = createMockCommand('cmd1');
    const command2 = createMockCommand('cmd2');
    
    // Set up state with one StateChange in each stack
    const currentState: StateHistory = {
      ...initialState,
      undoStack: [command1],
      redoStack: [command2],
      canUndo: true,
      canRedo: true
    };
    
    const action: StateHistoryAction = { type: 'REDO' };
    const nextState = commandHistoryReducer(currentState, action);
    
    expect(nextState.undoStack).toEqual([command1, command2]);
    expect(nextState.redoStack).toEqual([]);
    expect(nextState.canUndo).toBe(true);
    expect(nextState.canRedo).toBe(false);
  });
  
  it('should handle CLEAR action', () => {
    // Set up state with commands in both stacks
    const currentState: StateHistory = {
      ...initialState,
      undoStack: [createMockCommand('cmd1')],
      redoStack: [createMockCommand('cmd2')],
      canUndo: true,
      canRedo: true
    };
    
    const action: StateHistoryAction = { type: 'CLEAR' };
    const nextState = commandHistoryReducer(currentState, action);
    
    expect(nextState.undoStack).toEqual([]);
    expect(nextState.redoStack).toEqual([]);
    expect(nextState.canUndo).toBe(false);
    expect(nextState.canRedo).toBe(false);
  });
  
  it('should handle SET_MAX_STACK_SIZE action', () => {
    const commands = Array.from({ length: 10 }, (_, i) => createMockCommand(`cmd${i}`));
    
    // Set up state with multiple commands
    const currentState: StateHistory = {
      ...initialState,
      undoStack: commands,
      canUndo: true
    };
    
    // Reduce the max stack size to 5
    const action: StateHistoryAction = { type: 'SET_MAX_STACK_SIZE', size: 5 };
    const nextState = commandHistoryReducer(currentState, action);
    
    // Should trim the stack to only the 5 most recent commands
    expect(nextState.undoStack.length).toBe(5);
    expect(nextState.undoStack[0].id).toBe('cmd5'); // Should keep the 5 most recent
    expect(nextState.undoStack[4].id).toBe('cmd9');
    expect(nextState.maxStackSize).toBe(5);
  });
  
  it('should handle TOGGLE_PERSISTENCE action', () => {
    // Start with persistence disabled
    const state: StateHistory = { ...initialState, isPersistent: false };
    
    // Toggle on
    const action: StateHistoryAction = { type: 'TOGGLE_PERSISTENCE' };
    let nextState = commandHistoryReducer(state, action);
    expect(nextState.isPersistent).toBe(true);
    
    // Toggle off
    nextState = commandHistoryReducer(nextState, action);
    expect(nextState.isPersistent).toBe(false);
  });
  
  it('should handle LOAD_PERSISTENT_STATE action', () => {
    const commands = [createMockCommand('cmd1'), createMockCommand('cmd2')];
    
    // Create a partial state to load
    const persistedState: Partial<StateHistory> = {
      undoStack: commands,
      redoStack: [],
      maxStackSize: 100,
      isPersistent: true
    };
    
    // Load a persistent state
    const action: StateHistoryAction = { 
      type: 'LOAD_PERSISTENT_STATE', 
      state: persistedState
    };
    
    const nextState = commandHistoryReducer(initialState, action);
    
    expect(nextState.undoStack).toEqual(commands);
    expect(nextState.canUndo).toBe(true);
    expect(nextState.maxStackSize).toBe(100);
    expect(nextState.isPersistent).toBe(true);
  });
  
  it('should respect maxStackSize when executing commands', () => {
    // Create a state with maxStackSize of 3
    let state: StateHistory = { ...initialState, maxStackSize: 3 };
    
    // Add 4 commands
    for (let i = 0; i < 4; i++) {
      const StateChange = createMockCommand(`cmd${i}`);
      const action: StateHistoryAction = { type: 'EXECUTE', StateChange };
      state = commandHistoryReducer(state, action);
    }
    
    // Should only keep the 3 most recent commands
    expect(state.undoStack.length).toBe(3);
    expect(state.undoStack[0].id).toBe('cmd1'); // First StateChange should be dropped
    expect(state.undoStack[1].id).toBe('cmd2');
    expect(state.undoStack[2].id).toBe('cmd3');
  });
});