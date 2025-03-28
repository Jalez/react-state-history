/** @format */
import React from 'react';
import { useHistoryStateContext } from '../context/StateHistoryContext';

export interface HistoryButtonProps {
  onClick: () => void;
  disabled: boolean;
  className?: string;
  children?: React.ReactNode;
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
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={className}
    style={{
      padding: '8px',
      margin: '0 4px',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}>
    {children}
  </button>
);

/**
 * Default undo button
 */
const DefaultUndoButton: React.FC<HistoryButtonProps> = (props) => (
  <DefaultButton {...props}>Undo</DefaultButton>
);

/**
 * Default redo button
 */
const DefaultRedoButton: React.FC<HistoryButtonProps> = (props) => (
  <DefaultButton {...props}>Redo</DefaultButton>
);

/**
 * Default clear button
 */
const DefaultClearButton: React.FC<HistoryButtonProps> = (props) => (
  <DefaultButton {...props}>Clear history</DefaultButton>
);

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
  persistenceLabel = 'Enable Persistence',
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

  // Default rendering with customizable buttons
  return (
    <div className={className} style={{ display: 'inline-flex' }}>
      <UndoButton onClick={undo} disabled={!canUndo} />
      <ClearButton onClick={clear} disabled={canUndo || canRedo} />
      <RedoButton onClick={redo} disabled={!canRedo} />
      {showPersistenceToggle && (
        <label className='persistence-toggle'>
          <input
            type='checkbox'
            checked={isPersistent}
            onChange={togglePersistence}
          />
          {persistenceLabel}
        </label>
      )}
    </div>
  );
};

export default HistoryControls;
