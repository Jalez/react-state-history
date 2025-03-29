/** @format */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistoryControls, HistoryButtonProps } from "./HistoryControls";
import * as ContextModule from "../context/StateHistoryContext";
import { StateHistoryContextType } from "../types";

// Mock the useHistoryStateContext hook instead of trying to use the Context directly
vi.mock("../context/StateHistoryContext", () => ({
  useHistoryStateContext: vi.fn(),
}));

describe("HistoryControls", () => {
  // Setup default mock return for the useHistoryStateContext hook
  const mockContextValue: StateHistoryContextType = {
    undo: vi.fn(),
    redo: vi.fn(),
    clear: vi.fn(),
    execute: vi.fn(),
    setMaxStackSize: vi.fn(),
    canUndo: true,
    canRedo: true,
    isPersistent: false,
    togglePersistence: vi.fn(),
    undoStack: [],
    redoStack: [],
    maxStackSize: 50,
  };

  // Helper to set up the mock context for each test
  const setupMockContext = (overrides = {}) => {
    const contextValue = { ...mockContextValue, ...overrides };
    vi.mocked(ContextModule.useHistoryStateContext).mockReturnValue(
      contextValue
    );
    return contextValue;
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });

  it("renders default buttons", () => {
    setupMockContext();
    render(<HistoryControls />);

    expect(screen.getByText("Undo")).toBeInTheDocument();
    expect(screen.getByText("Clear History")).toBeInTheDocument();
    expect(screen.getByText("Redo")).toBeInTheDocument();
  });

  it("calls undo/redo/clear functions when buttons clicked", async () => {
    const mockContext = setupMockContext();
    render(<HistoryControls />);
    const user = userEvent.setup();

    // Click undo button
    await user.click(screen.getByText("Undo"));
    expect(mockContext.undo).toHaveBeenCalled();

    // Click redo button
    await user.click(screen.getByText("Redo"));
    expect(mockContext.redo).toHaveBeenCalled();

    // Click clear button
    await user.click(screen.getByText("Clear History"));
    expect(mockContext.clear).toHaveBeenCalled();
  });

  it("disables buttons when canUndo/canRedo is false", () => {
    setupMockContext({
      canUndo: false,
      canRedo: false,
    });

    render(<HistoryControls />);

    const undoButton = screen.getByText("Undo");
    const redoButton = screen.getByText("Redo");
    const clearButton = screen.getByText("Clear History");

    expect(undoButton).toBeDisabled();
    expect(redoButton).toBeDisabled();
    expect(clearButton).toBeDisabled();
  });

  it("shows persistence toggle when showPersistenceToggle is true", () => {
    setupMockContext();

    render(<HistoryControls showPersistenceToggle={true} />);

    // Check for the toggle button with the checkbox
    const toggleButton = screen.getByText("Persistent History");
    expect(toggleButton).toBeInTheDocument();

    // Find the actual checkbox inside the button
    const checkbox = toggleButton.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("calls togglePersistence when persistence button is clicked", async () => {
    const mockContext = setupMockContext();

    render(<HistoryControls showPersistenceToggle={true} />);
    const user = userEvent.setup();

    // Find the button that contains the persistence toggle
    const toggleButton = screen.getByText("Persistent History");
    await user.click(toggleButton);

    expect(mockContext.togglePersistence).toHaveBeenCalled();
  });

  it("renders custom label for persistence toggle", () => {
    setupMockContext();

    render(
      <HistoryControls
        showPersistenceToggle={true}
        persistenceLabel="Custom Label"
      />
    );

    // Custom label should be visible
    expect(screen.getByText("Custom Label")).toBeInTheDocument();
  });

  it("allows custom buttons to be provided", () => {
    setupMockContext();

    // Properly type the custom button components
    const CustomUndoButton: React.FC<HistoryButtonProps> = ({
      onClick,
      disabled,
    }) => (
      <button onClick={onClick} disabled={disabled} data-testid="custom-undo">
        Custom Undo
      </button>
    );

    const CustomRedoButton: React.FC<HistoryButtonProps> = ({
      onClick,
      disabled,
    }) => (
      <button onClick={onClick} disabled={disabled} data-testid="custom-redo">
        Custom Redo
      </button>
    );

    render(
      <HistoryControls
        UndoButton={CustomUndoButton}
        RedoButton={CustomRedoButton}
      />
    );

    expect(screen.getByTestId("custom-undo")).toBeInTheDocument();
    expect(screen.getByTestId("custom-redo")).toBeInTheDocument();
    expect(screen.getByText("Custom Undo")).toBeInTheDocument();
    expect(screen.getByText("Custom Redo")).toBeInTheDocument();
  });

  it("uses custom rendering function when provided", () => {
    setupMockContext();

    // Properly type the renderCustomControls function
    const renderCustomControls = ({
      undo,
      redo,
    }: {
      undo: () => void;
      redo: () => void;
      canUndo?: boolean;
      canRedo?: boolean;
      isPersistent?: boolean;
      togglePersistence?: () => void;
    }) => (
      <div data-testid="custom-controls">
        <button onClick={undo} data-testid="custom-func-undo">
          Custom Func Undo
        </button>
        <button onClick={redo} data-testid="custom-func-redo">
          Custom Func Redo
        </button>
      </div>
    );

    render(<HistoryControls renderCustomControls={renderCustomControls} />);

    expect(screen.getByTestId("custom-controls")).toBeInTheDocument();
    expect(screen.getByTestId("custom-func-undo")).toBeInTheDocument();
    expect(screen.getByTestId("custom-func-redo")).toBeInTheDocument();
    expect(screen.queryByText("Undo")).not.toBeInTheDocument(); // Default buttons should not be rendered
  });
});
