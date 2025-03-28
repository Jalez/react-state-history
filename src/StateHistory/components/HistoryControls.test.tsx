import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryControls from './HistoryControls';

// Mock the StateHistoryContext hook
vi.mock('../context/StateHistoryContext', () => {
  const mockuseStateHistory = vi.fn().mockReturnValue({
    canUndo: true,
    canRedo: true,
    undo: vi.fn(),
    redo: vi.fn(),
    clear: vi.fn(),
    isPersistent: false,
    togglePersistence: vi.fn(),
  });
  
  return {
    useStateHistory: mockuseStateHistory,
    StateHistoryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
  };
});

// Import the mocked module after mocking
import { useStateHistoryContext } from '../context/StateHistoryContext';

describe('HistoryControls component', () => {
  it('renders default buttons', () => {
    render(<HistoryControls />);
    
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
    expect(screen.getByText('Clear history')).toBeInTheDocument();
  });
  
  it('calls undo/redo functions when buttons are clicked', async () => {
    const mockuseStateHistory = useStateHistoryContext as ReturnType<typeof vi.fn>;
    const mockUndo = vi.fn();
    const mockRedo = vi.fn();
    
    mockuseStateHistory.mockReturnValue({
      canUndo: true,
      canRedo: true,
      undo: mockUndo,
      redo: mockRedo,
      clear: vi.fn(),
      isPersistent: false,
      togglePersistence: vi.fn(),
    });
    
    render(<HistoryControls />);
    const user = userEvent.setup();
    
    const undoButton = screen.getByText('Undo');
    const redoButton = screen.getByText('Redo');
    
    await user.click(undoButton);
    expect(mockUndo).toHaveBeenCalledTimes(1);
    
    await user.click(redoButton);
    expect(mockRedo).toHaveBeenCalledTimes(1);
  });
  
  it('disables buttons when actions are not available', () => {
    const mockuseStateHistory = useStateHistoryContext as ReturnType<typeof vi.fn>;
    mockuseStateHistory.mockReturnValue({
      canUndo: false,
      canRedo: false,
      undo: vi.fn(),
      redo: vi.fn(),
      clear: vi.fn(),
      isPersistent: false,
      togglePersistence: vi.fn(),
    });
    
    render(<HistoryControls />);
    
    const undoButton = screen.getByText('Undo');
    const redoButton = screen.getByText('Redo');
    
    expect(undoButton).toBeDisabled();
    expect(redoButton).toBeDisabled();
  });
  
  it('uses custom button components when provided', () => {
    const CustomUndo = ({ onClick }: { onClick: () => void }) => (
      <button onClick={onClick} data-testid="custom-undo">Custom Undo</button>
    );
    
    const CustomRedo = ({ onClick }: { onClick: () => void }) => (
      <button onClick={onClick} data-testid="custom-redo">Custom Redo</button>
    );
    
    render(
      <HistoryControls 
        UndoButton={CustomUndo}
        RedoButton={CustomRedo}
      />
    );
    
    expect(screen.getByTestId('custom-undo')).toBeInTheDocument();
    expect(screen.getByTestId('custom-redo')).toBeInTheDocument();
    expect(screen.getByText('Custom Undo')).toBeInTheDocument();
    expect(screen.getByText('Custom Redo')).toBeInTheDocument();
  });
  
  it('shows persistence toggle when enabled', () => {
    const mockuseStateHistory = useStateHistoryContext as ReturnType<typeof vi.fn>;
    mockuseStateHistory.mockReturnValue({
      canUndo: true,
      canRedo: true,
      undo: vi.fn(),
      redo: vi.fn(),
      clear: vi.fn(),
      isPersistent: true,
      togglePersistence: vi.fn(),
    });
    
    render(<HistoryControls showPersistenceToggle={true} />);
    
    expect(screen.getByLabelText(/Enable Persistence/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Enable Persistence/)).toBeChecked();
  });
  
  it('uses custom render function when provided', () => {
    const renderCustomControls = vi.fn().mockReturnValue(
      <div data-testid="custom-controls">Custom Controls</div>
    );
    
    render(<HistoryControls renderCustomControls={renderCustomControls} />);
    
    expect(screen.getByTestId('custom-controls')).toBeInTheDocument();
    expect(screen.getByText('Custom Controls')).toBeInTheDocument();
    expect(renderCustomControls).toHaveBeenCalled();
  });
});