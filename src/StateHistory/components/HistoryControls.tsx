/** @format */
import React from "react";
import { useHistoryStateContext } from "../context/StateHistoryContext";

// Base button props shared by all control buttons
export interface HistoryButtonProps {
  onClick: () => void;
  disabled: boolean;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  position?: "left" | "middle" | "right";
}

// Props for the main HistoryControls component
export interface HistoryControlsProps {
  // Custom button components
  UndoButton?: React.ComponentType<HistoryButtonProps>;
  RedoButton?: React.ComponentType<HistoryButtonProps>;
  ClearButton?: React.ComponentType<HistoryButtonProps>;
  
  // Styling
  className?: string;
  
  // Custom rendering function
  renderCustomControls?: (props: {
    undo: () => void;
    redo: () => void;
    clear: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isPersistent: boolean;
    togglePersistence: () => void;
  }) => React.ReactNode;
  
  // Persistence toggle options
  showPersistenceToggle?: boolean;
  persistenceLabel?: string;
}

/**
 * Base button component with default styling
 */
const BaseButton: React.FC<HistoryButtonProps> = ({
  onClick,
  disabled,
  children,
  className,
  style = {},
  position,
}) => {
  // Calculate border radius based on position
  const getBorderRadius = () => {
    switch (position) {
      case "left": return "4px 0 0 4px";
      case "right": return "0 4px 4px 0";
      default: return "0";
    }
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
        borderRight: position === "left" || position === "middle" ? "none" : "1px solid #bbbbbb",
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
 * Default undo button implementation
 */
const DefaultUndoButton: React.FC<HistoryButtonProps> = (props) => (
  <BaseButton {...props} position="left">
    Undo
  </BaseButton>
);

/**
 * Default redo button implementation
 */
const DefaultRedoButton: React.FC<HistoryButtonProps> = (props) => (
  <BaseButton {...props} position="right">
    Redo
  </BaseButton>
);

/**
 * Default clear button implementation
 */
const DefaultClearButton: React.FC<HistoryButtonProps> = (props) => (
  <BaseButton {...props} position="middle">
    Clear History
  </BaseButton>
);

/**
 * Toggle switch for persistence
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
 * Displays a toolbar with undo, redo, clear, and optional persistence controls
 */
export const HistoryControls: React.FC<HistoryControlsProps> = ({
  // Component customization
  UndoButton = DefaultUndoButton,
  RedoButton = DefaultRedoButton,
  ClearButton = DefaultClearButton,
  className = "",
  renderCustomControls,
  
  // Persistence options
  showPersistenceToggle = false,
  persistenceLabel = "Persistent History",
}) => {
  // Get all necessary state and functions from context
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    clear,
    isPersistent,
    togglePersistence,
  } = useHistoryStateContext();

  // If custom rendering is provided, use that instead of default buttons
  if (renderCustomControls) {
    return (
      <>
        {renderCustomControls({
          undo,
          redo,
          clear,
          canUndo,
          canRedo,
          isPersistent,
          togglePersistence,
        })}
      </>
    );
  }

  // Default rendering with button components
  return (
    <div
      className={`history-controls ${className}`}
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
