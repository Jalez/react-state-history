/** @format */
import React from "react";
import { useCommandHistory } from "../context/CommandHistoryContext";

export interface UndoRedoButtonProps {
  onClick: () => void;
  disabled: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface UndoRedoControlsProps {
  UndoButton?: React.ComponentType<UndoRedoButtonProps>;
  RedoButton?: React.ComponentType<UndoRedoButtonProps>;
  className?: string;
  renderCustomControls?: (props: {
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
  }) => React.ReactNode;
  showPersistenceToggle?: boolean;
  persistenceLabel?: string;
}

/**
 * Default button component used when no custom button is provided
 */
const DefaultButton: React.FC<UndoRedoButtonProps> = ({
  onClick,
  disabled,
  children,
  className,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={className}
    style={{
      padding: "8px",
      margin: "0 4px",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {children}
  </button>
);

/**
 * Default undo button
 */
const DefaultUndoButton: React.FC<UndoRedoButtonProps> = (props) => (
  <DefaultButton {...props}>Undo</DefaultButton>
);

/**
 * Default redo button
 */
const DefaultRedoButton: React.FC<UndoRedoButtonProps> = (props) => (
  <DefaultButton {...props}>Redo</DefaultButton>
);

/**
 * UndoRedoControls component
 *
 * Displays undo and redo buttons that can be customized
 * Enables users to undo/redo operations
 */
const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({
  UndoButton = DefaultUndoButton,
  RedoButton = DefaultRedoButton,
  className,
  renderCustomControls,
  showPersistenceToggle = false,
  persistenceLabel = "Enable Persistence",
}) => {
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    clear,
    isPersistent,
    togglePersistence,
  } = useCommandHistory();

  // If custom rendering is provided, use that
  if (renderCustomControls) {
    return <>{renderCustomControls({ undo, redo, canUndo, canRedo })}</>;
  }

  // Default rendering with customizable buttons
  return (
    <div className={className} style={{ display: "inline-flex" }}>
      <UndoButton onClick={undo} disabled={!canUndo} />
      <RedoButton onClick={redo} disabled={!canRedo} />
      <button onClick={clear}>Clear History</button>
      {showPersistenceToggle && (
        <label className="persistence-toggle">
          <input
            type="checkbox"
            checked={isPersistent}
            onChange={togglePersistence}
          />
          {persistenceLabel}
        </label>
      )}
    </div>
  );
};

export default UndoRedoControls;
