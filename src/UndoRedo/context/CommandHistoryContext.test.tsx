import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  CommandHistoryProvider, 
  useCommandHistory 
} from './CommandHistoryContext';
import { setupMockLocalStorage } from '../../test/mockLocalStorage';
import { Command } from '../types';

describe('CommandHistoryContext', () => {
  const { restoreLocalStorage } = setupMockLocalStorage();
  
  // Cleanup after each test
  afterEach(() => {
    localStorage.clear();
    restoreLocalStorage();
    vi.clearAllMocks();
  });

  // Custom matcher for command history tests
  function expectCommandHistory(result: any, expectedProps: Record<string, any>) {
    Object.entries(expectedProps).forEach(([key, value]) => {
      expect(result.current[key as keyof typeof result.current]).toEqual(value);
    });
  }

  it('should initialize with expected values', () => {
    const { result } = renderHook(() => useCommandHistory(), {
      wrapper: ({ children }) => (
        <CommandHistoryProvider>{children}</CommandHistoryProvider>
      ),
    });

    expectCommandHistory(result, {
      canUndo: false,
      canRedo: false,
      isPersistent: false,
    });

    // Check that methods are defined
    expect(typeof result.current.undo).toBe('function');
    expect(typeof result.current.redo).toBe('function');
    expect(typeof result.current.execute).toBe('function');
    expect(typeof result.current.clear).toBe('function');
  });

  it('should execute commands and update state', () => {
    const mockExecute = vi.fn();
    const mockUndo = vi.fn();
    
    const testCommand: Command = {
      execute: mockExecute,
      undo: mockUndo,
      id: 'test-command',
      description: 'Test command'
    };

    const { result } = renderHook(() => useCommandHistory(), {
      wrapper: ({ children }) => (
        <CommandHistoryProvider>{children}</CommandHistoryProvider>
      ),
    });

    act(() => {
      result.current.execute(testCommand);
    });

    // After executing, we should be able to undo
    expectCommandHistory(result, {
      canUndo: true,
      canRedo: false,
    });

    // Execute should have been called
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('should support undo/redo operations', () => {
    const mockExecute = vi.fn();
    const mockUndo = vi.fn();
    
    const testCommand: Command = {
      execute: mockExecute,
      undo: mockUndo,
      id: 'test-command',
      description: 'Test command'
    };

    const { result } = renderHook(() => useCommandHistory(), {
      wrapper: ({ children }) => (
        <CommandHistoryProvider>{children}</CommandHistoryProvider>
      ),
    });

    act(() => {
      result.current.execute(testCommand);
    });

    // After executing, we should be able to undo
    expectCommandHistory(result, { canUndo: true, canRedo: false });

    act(() => {
      result.current.undo();
    });

    // After undoing, we should be able to redo but not undo again
    expectCommandHistory(result, { canUndo: false, canRedo: true });
    expect(mockUndo).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.redo();
    });

    // After redoing, we should be able to undo again but not redo
    expectCommandHistory(result, { canUndo: true, canRedo: false });
    expect(mockExecute).toHaveBeenCalledTimes(2); // Initial + redo
  });

  it('should clear command history', () => {
    const testCommand: Command = {
      execute: vi.fn(),
      undo: vi.fn(),
      id: 'test-command',
      description: 'Test command'
    };

    const { result } = renderHook(() => useCommandHistory(), {
      wrapper: ({ children }) => (
        <CommandHistoryProvider>{children}</CommandHistoryProvider>
      ),
    });

    act(() => {
      result.current.execute(testCommand);
    });

    expectCommandHistory(result, { canUndo: true, canRedo: false });

    act(() => {
      result.current.clear();
    });

    // After clearing, we should not be able to undo or redo
    expectCommandHistory(result, { canUndo: false, canRedo: false });
  });

  it('should support toggling persistence', () => {
    const { result } = renderHook(() => useCommandHistory(), {
      wrapper: ({ children }) => (
        <CommandHistoryProvider 
          storageKey="test-persistence"
        >
          {children}
        </CommandHistoryProvider>
      ),
    });

    // Initially persistence is off
    expectCommandHistory(result, { isPersistent: false });

    // Execute a command to have something to persist
    const testCommand: Command = {
      execute: vi.fn(),
      undo: vi.fn(),
      id: 'test',
      description: 'Test command'
    };

    act(() => {
      result.current.execute(testCommand);
      result.current.togglePersistence();
    });

    // Now persistence should be on
    expectCommandHistory(result, { isPersistent: true });

    // Verify something was saved to localStorage
    expect(localStorage.getItem('undoredo_history_test-persistence')).toBeTruthy();

    // Toggle off
    act(() => {
      result.current.togglePersistence();
    });

    // Now persistence should be off
    expectCommandHistory(result, { isPersistent: false });

    // Storage should be cleared
    expect(localStorage.getItem('undoredo_history_test-persistence')).toBeNull();
  });

  it('should load state from storage on initialization', () => {
    // First create and save a state
    const testCommand: Command = {
      execute: vi.fn(),
      undo: vi.fn(),
      id: 'test',
      description: 'Restored Command'
    };

    const { result: initialResult, unmount } = renderHook(() => useCommandHistory(), {
      wrapper: ({ children }) => (
        <CommandHistoryProvider 
          storageKey="test-load"
          defaultPersistent={true}
        >
          {children}
        </CommandHistoryProvider>
      ),
    });

    // Execute a command and ensure it's persisted
    act(() => {
      initialResult.current.execute(testCommand);
    });

    // Make sure the state was persisted
    expect(localStorage.getItem('undoredo_history_test-load')).toBeTruthy();

    // Unmount to simulate page reload
    unmount();

    // Now create a new hook that should load the persisted state
    const { result: newResult } = renderHook(() => useCommandHistory(), {
      wrapper: ({ children }) => (
        <CommandHistoryProvider 
          storageKey="test-load"
          defaultPersistent={true} 
        >
          {children}
        </CommandHistoryProvider>
      ),
    });

    // The new hook should have the persisted state
    expectCommandHistory(newResult, { canUndo: true, canRedo: false, isPersistent: true });
  });
});