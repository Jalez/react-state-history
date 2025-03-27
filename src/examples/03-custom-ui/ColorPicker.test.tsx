import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPickerExample } from './ColorPicker';

describe('ColorPicker component', () => {
  beforeEach(() => {
    render(<ColorPickerExample />);
  });

  it('renders with initial color', () => {
    // Check if the initial color display is visible
    expect(screen.getByText(/Selected Color:/)).toBeInTheDocument();
    
    // The default color should be #3f51b5 (visible in the text)
    expect(screen.getByText(/Selected Color:/).textContent).toContain('#3f51b5');
  });

  it('updates color when input value changes', async () => {
    const user = userEvent.setup();

    // Get the text input by its role and type
    const colorInput = screen.getAllByDisplayValue('#3f51b5')
      .find(input => input.getAttribute('type') === 'text');
    expect(colorInput).toBeInTheDocument();

    // Change the color
    await user.clear(colorInput!);
    await user.type(colorInput!, '#ff0000');

    // Check if the color display updated
    expect(screen.getByText(/Selected Color:/).textContent).toContain('#ff0000');
  });

  it('renders custom undo/redo buttons', () => {
    // Check if custom buttons exist
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
    
    // Check the custom buttons from the second example
    expect(screen.getByText('← Previous Color')).toBeInTheDocument();
    expect(screen.getByText('Next Color →')).toBeInTheDocument();
  });

  it('supports undo/redo functionality', async () => {
    const user = userEvent.setup();

    // Get the text input by its role and type
    const colorInput = screen.getAllByDisplayValue('#3f51b5')
      .find(input => input.getAttribute('type') === 'text');

    // Change the color
    await user.clear(colorInput!);
    await user.type(colorInput!, '#ff0000');

    // Verify color changed
    expect(screen.getByText(/Selected Color:/).textContent).toContain('#ff0000');

    // Click the first Undo button
    const undoButton = screen.getAllByText('Undo')[0]; // Get the first Undo button
    await user.click(undoButton);

    // Color should be back to original
    const colorText = screen.getByText(/Selected Color:/);
    expect(colorText.textContent).not.toContain('#ff0000');
    
    // Click the Redo button
    const redoButton = screen.getAllByText('Redo')[0]; // Get the first Redo button
    await user.click(redoButton);

    // Color should be changed again
    expect(screen.getByText(/Selected Color:/).textContent).toContain('#ff0000');
  });

  it('supports custom UI undo/redo functionality', async () => {
    const user = userEvent.setup();

    // Get the text input by its role and type
    const colorInput = screen.getAllByDisplayValue('#3f51b5')
      .find(input => input.getAttribute('type') === 'text');

    // Change the color
    await user.clear(colorInput!);
    await user.type(colorInput!, '#ff0000');

    // Verify color changed
    expect(screen.getByText(/Selected Color:/).textContent).toContain('#ff0000');

    // Click the custom Previous Color button
    const prevColorButton = screen.getByText('← Previous Color');
    await user.click(prevColorButton);

    // Color should be back to original
    const colorText = screen.getByText(/Selected Color:/);
    expect(colorText.textContent).not.toContain('#ff0000');
    
    // Click the custom Next Color button
    const nextColorButton = screen.getByText('Next Color →');
    await user.click(nextColorButton);

    // Color should be changed again
    expect(screen.getByText(/Selected Color:/).textContent).toContain('#ff0000');
  });
});