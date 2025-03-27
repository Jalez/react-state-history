import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UndoRedoControls from '../components/UndoRedoControls';

// Mock the CommandHistoryContext hook
vi.mock('../context/CommandHistoryContext', () => {
  const mockUseCommandHistory = vi.fn().mockReturnValue({
    canUndo: true,
    canRedo: true,
    undo: vi.fn(),
    redo: vi.fn(),
    clear: vi.fn(),
    isPersistent: false,
    togglePersistence: vi.fn(),
  });
  
  return {
    useCommandHistory: mockUseCommandHistory,
    CommandHistoryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
  };
});

// Import the mocked module after mocking
import { useCommandHistory } from '../context/CommandHistoryContext';

describe('UndoRedoControls component', () => {
  it('renders default buttons', () => {
    render(<UndoRedoControls />);
    
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
    expect(screen.getByText('Clear history')).toBeInTheDocument();
  });
  
  it('calls undo/redo functions when buttons are clicked', async () => {
    const mockUseCommandHistory = useCommandHistory as ReturnType<typeof vi.fn>;
    const mockUndo = vi.fn();
    const mockRedo = vi.fn();
    
    mockUseCommandHistory.mockReturnValue({
      canUndo: true,
      canRedo: true,
      undo: mockUndo,
      redo: mockRedo,
      clear: vi.fn(),
      isPersistent: false,
      togglePersistence: vi.fn(),
    });
    
    render(<UndoRedoControls />);
    const user = userEvent.setup();
    
    const undoButton = screen.getByText('Undo');
    const redoButton = screen.getByText('Redo');
    
    await user.click(undoButton);
    expect(mockUndo).toHaveBeenCalledTimes(1);
    
    await user.click(redoButton);
    expect(mockRedo).toHaveBeenCalledTimes(1);
  });
  
  it('disables buttons when actions are not available', () => {
    const mockUseCommandHistory = useCommandHistory as ReturnType<typeof vi.fn>;
    mockUseCommandHistory.mockReturnValue({
      canUndo: false,
      canRedo: false,
      undo: vi.fn(),
      redo: vi.fn(),
      clear: vi.fn(),
      isPersistent: false,
      togglePersistence: vi.fn(),
    });
    
    render(<UndoRedoControls />);
    
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
      <UndoRedoControls 
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
    const mockUseCommandHistory = useCommandHistory as ReturnType<typeof vi.fn>;
    mockUseCommandHistory.mockReturnValue({
      canUndo: true,
      canRedo: true,
      undo: vi.fn(),
      redo: vi.fn(),
      clear: vi.fn(),
      isPersistent: true,
      togglePersistence: vi.fn(),
    });
    
    render(<UndoRedoControls showPersistenceToggle={true} />);
    
    expect(screen.getByLabelText(/Enable Persistence/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Enable Persistence/)).toBeChecked();
  });
  
  it('uses custom render function when provided', () => {
    const renderCustomControls = vi.fn().mockReturnValue(
      <div data-testid="custom-controls">Custom Controls</div>
    );
    
    render(<UndoRedoControls renderCustomControls={renderCustomControls} />);
    
    expect(screen.getByTestId('custom-controls')).toBeInTheDocument();
    expect(screen.getByText('Custom Controls')).toBeInTheDocument();
    expect(renderCustomControls).toHaveBeenCalled();
  });
});