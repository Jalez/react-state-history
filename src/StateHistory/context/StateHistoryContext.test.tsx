/** @format */

import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  StateHistoryProvider,
  useHistoryStateContext,
} from "./StateHistoryContext";
import { setupMockLocalStorage } from "../../test/mockLocalStorage";
import { StateChange } from "../types";

describe("StateHistoryContext", () => {
  const { restoreLocalStorage } = setupMockLocalStorage();

  // Cleanup after each test
  afterEach(() => {
    localStorage.clear();
    restoreLocalStorage();
    vi.clearAllMocks();
  });

  // Custom matcher for StateChange history tests
  async function expectCommandHistory(
    result: { current: ReturnType<typeof useHistoryStateContext> },
    expectedProps: Partial<ReturnType<typeof useHistoryStateContext>>
  ) {
    await waitFor(() => {
      Object.entries(expectedProps).forEach(([key, value]) => {
        expect(result.current[key as keyof typeof result.current]).toEqual(
          value
        );
      });
    });
  }

  it("should initialize with expected values", async () => {
    const { result } = renderHook(() => useHistoryStateContext(), {
      wrapper: ({ children }) => (
        <StateHistoryProvider>{children}</StateHistoryProvider>
      ),
    });

    await expectCommandHistory(result, {
      canUndo: false,
      canRedo: false,
      isPersistent: false,
    });

    // Check that methods are defined
    expect(typeof result.current.undo).toBe("function");
    expect(typeof result.current.redo).toBe("function");
    expect(typeof result.current.execute).toBe("function");
    expect(typeof result.current.clear).toBe("function");
  });

  it("should execute commands and update state", async () => {
    const mockExecute = vi.fn();
    const mockUndo = vi.fn();

    const testCommand: StateChange = {
      execute: mockExecute,
      undo: mockUndo,
      id: "test-StateChange",
      description: "Test StateChange",
    };

    const { result } = renderHook(() => useHistoryStateContext(), {
      wrapper: ({ children }) => (
        <StateHistoryProvider>{children}</StateHistoryProvider>
      ),
    });

    await act(async () => {
      result.current.execute(testCommand);
      // Add a small delay to ensure the state update completes
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // After executing, we should be able to undo
    await expectCommandHistory(result, {
      canUndo: true,
      canRedo: false,
    });

    // Execute should have been called
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it("should support undo/redo operations", async () => {
    const mockExecute = vi.fn();
    const mockUndo = vi.fn();

    const testCommand: StateChange = {
      execute: mockExecute,
      undo: mockUndo,
      id: "test-StateChange",
      description: "Test StateChange",
    };

    const { result } = renderHook(() => useHistoryStateContext(), {
      wrapper: ({ children }) => (
        <StateHistoryProvider>{children}</StateHistoryProvider>
      ),
    });

    await act(async () => {
      result.current.execute(testCommand);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // After executing, we should be able to undo
    await expectCommandHistory(result, { canUndo: true, canRedo: false });

    await act(async () => {
      result.current.undo();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // After undoing, we should be able to redo but not undo again
    await expectCommandHistory(result, { canUndo: false, canRedo: true });
    expect(mockUndo).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.redo();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // After redoing, we should be able to undo again but not redo
    await expectCommandHistory(result, { canUndo: true, canRedo: false });
    expect(mockExecute).toHaveBeenCalledTimes(2); // Initial + redo
  });

  it("should clear StateChange history", async () => {
    const testCommand: StateChange = {
      execute: vi.fn(),
      undo: vi.fn(),
      id: "test-StateChange",
      description: "Test StateChange",
    };

    const { result } = renderHook(() => useHistoryStateContext(), {
      wrapper: ({ children }) => (
        <StateHistoryProvider>{children}</StateHistoryProvider>
      ),
    });

    await act(async () => {
      result.current.execute(testCommand);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    await expectCommandHistory(result, { canUndo: true, canRedo: false });

    await act(async () => {
      result.current.clear();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // After clearing, we should not be able to undo or redo
    await expectCommandHistory(result, { canUndo: false, canRedo: false });
  });

  it("should support toggling persistence", async () => {
    const { result } = renderHook(() => useHistoryStateContext(), {
      wrapper: ({ children }) => (
        <StateHistoryProvider storageKey="test-persistence">
          {children}
        </StateHistoryProvider>
      ),
    });

    // Initially persistence is off
    await expectCommandHistory(result, { isPersistent: false });

    // Execute a StateChange to have something to persist
    const testCommand: StateChange = {
      execute: vi.fn(),
      undo: vi.fn(),
      id: "test",
      description: "Test StateChange",
    };

    await act(async () => {
      result.current.execute(testCommand);
      await new Promise((resolve) => setTimeout(resolve, 10));
      result.current.togglePersistence();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Now persistence should be on
    await expectCommandHistory(result, { isPersistent: true });

    // Verify something was saved to localStorage
    expect(localStorage.getItem("state_history_test-persistence")).toBeTruthy();

    // Toggle off
    await act(async () => {
      result.current.togglePersistence();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Now persistence should be off
    await expectCommandHistory(result, { isPersistent: false });

    // Storage should be cleared
    expect(localStorage.getItem("state_history_test-persistence")).toBeNull();
  });

  it("should load state from storage on initialization", async () => {
    // First create and save a state
    const testCommand: StateChange = {
      execute: vi.fn(),
      undo: vi.fn(),
      id: "test",
      description: "Restored StateChange",
    };

    const { result: initialResult, unmount } = renderHook(
      () => useHistoryStateContext(),
      {
        wrapper: ({ children }) => (
          <StateHistoryProvider storageKey="test-load" defaultPersistent={true}>
            {children}
          </StateHistoryProvider>
        ),
      }
    );

    // Execute a StateChange and ensure it's persisted
    await act(async () => {
      initialResult.current.execute(testCommand);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Make sure the state was persisted
    expect(localStorage.getItem("state_history_test-load")).toBeTruthy();

    // Unmount to simulate page reload
    unmount();

    // Now create a new hook that should load the persisted state
    const { result: newResult } = renderHook(() => useHistoryStateContext(), {
      wrapper: ({ children }) => (
        <StateHistoryProvider storageKey="test-load" defaultPersistent={true}>
          {children}
        </StateHistoryProvider>
      ),
    });

    // Wait for the initial load to complete
    await waitFor(() => {
      expect(newResult.current.initialStateLoaded).toBe(true);
    });

    // The new hook should have the persisted state
    await expectCommandHistory(newResult, {
      canUndo: true,
      canRedo: false,
      isPersistent: true,
    });
  });
});
