/** @format */
import React from "react";
import { useHistoryStateContext } from "../context/StateHistoryContext";

export interface HistoryButtonProps {
  onClick: () => void;
  disabled: boolean;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  position?: "left" | "middle" | "right";
}

export interface HistoryControlsProps {
  UndoButton?: React.ComponentType<HistoryButtonProps>;
  RedoButton?: React.ComponentType<HistoryButtonProps>;
  ClearButton?: React.ComponentType<HistoryButtonProps>;
  className?: string;
  renderCustomControls?: (props: {
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isPersistent?: boolean;
    togglePersistence?: () => void;
  }) => React.ReactNode;
  showPersistenceToggle?: boolean;
  persistenceLabel?: string;
}

/**
 * Default button component used when no custom button is provided
 */
const DefaultButton: React.FC<HistoryButtonProps> = ({
  onClick,
  disabled,
  children,
  className,
  style = {},
  position,
}) => {
  // Define border radius based on position
  const getBorderRadius = () => {
    if (position === "left") return "4px 0 0 4px";
    if (position === "right") return "0 4px 4px 0";
    return "0";
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        padding: "8px 12px",
        margin: "0",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        backgroundColor: "#e0e0e0",
        color: "#333333",
        border: "1px solid #bbbbbb",
        borderRadius: getBorderRadius(),
        borderRight:
          position === "left" || position === "middle"
            ? "none"
            : "1px solid #bbbbbb",
        fontSize: "14px",
        fontWeight: "500",
        transition: "all 0.2s",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

/**
 * Default undo button
 */
const DefaultUndoButton: React.FC<HistoryButtonProps> = (props) => (
  <DefaultButton {...props} position="left">
    Undo
  </DefaultButton>
);

/**
 * Default redo button
 */
const DefaultRedoButton: React.FC<HistoryButtonProps> = (props) => (
  <DefaultButton {...props} position="right">
    Redo
  </DefaultButton>
);

/**
 * Default clear button
 */
const DefaultClearButton: React.FC<HistoryButtonProps> = (props) => (
  <DefaultButton {...props} position="middle">
    Clear History
  </DefaultButton>
);

/**
 * Persistence toggle button
 */
const PersistenceToggle: React.FC<{
  isPersistent: boolean;
  togglePersistence: () => void;
  persistenceLabel?: string;
}> = ({
  isPersistent,
  togglePersistence,
  persistenceLabel = "Persistent History",
}) => {
  return (
    <button
      onClick={togglePersistence}
      className="persistence-toggle-button"
      style={{
        padding: "8px 12px",
        margin: "0",
        backgroundColor: "#e0e0e0",
        color: "#333333",
        border: "1px solid #bbbbbb",
        borderLeft: "none",
        borderRight: "none",
        fontSize: "14px",
        fontWeight: "500",
        display: "flex",
        alignItems: "center",
        borderRadius: "0",
        gap: "6px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      <input
        type="checkbox"
        checked={isPersistent}
        onChange={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{ margin: 0 }}
      />
      {persistenceLabel}
    </button>
  );
};

/**
 * HistoryControls component
 *
 * Displays undo and redo buttons that can be customized
 * Enables users to undo/redo operations
 */
export const HistoryControls: React.FC<HistoryControlsProps> = ({
  UndoButton = DefaultUndoButton,
  RedoButton = DefaultRedoButton,
  ClearButton = DefaultClearButton,
  className,
  renderCustomControls,
  showPersistenceToggle = false,
  persistenceLabel = "Persistent History",
}) => {
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    clear,
    isPersistent,
    togglePersistence,
  } = useHistoryStateContext();

  // If custom rendering is provided, use that
  if (renderCustomControls) {
    return (
      <>
        {renderCustomControls({
          undo,
          redo,
          canUndo,
          canRedo,
          isPersistent,
          togglePersistence,
        })}
      </>
    );
  }

  // Default rendering with customizable buttons and connected layout
  return (
    <div
      className={`history-controls ${className || ""}`}
      style={{
        display: "inline-flex",
        margin: "10px 0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
        borderRadius: "4px",
      }}
    >
      <UndoButton onClick={undo} disabled={!canUndo} position="left" />

      {showPersistenceToggle && (
        <PersistenceToggle
          isPersistent={isPersistent}
          togglePersistence={togglePersistence}
          persistenceLabel={persistenceLabel}
        />
      )}

      <ClearButton
        onClick={clear}
        disabled={!(canUndo || canRedo)}
        position="middle"
      />
      <RedoButton onClick={redo} disabled={!canRedo} position="right" />
    </div>
  );
};

export default HistoryControls;
