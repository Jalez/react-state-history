/**
 * Custom UI Example: Color Picker
 *
 * This example demonstrates how to customize the undo/redo UI
 * with your own components and styling.
 *
 * Key concepts demonstrated:
 * - Using useHistoryState for simple state management
 * - Custom undo/redo buttons
 * - Custom rendering of controls
 * - Accessing undo/redo state directly
 */
import React from "react";
import {
  UndoRedoProvider,
  UndoRedoControls,
  UndoRedoButtonProps,
  useCommandHistory,
  useHistoryState,
} from "../../UndoRedo";

// Custom styled undo button
const CustomUndoButton: React.FC<UndoRedoButtonProps> = ({
  onClick,
  disabled,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: "8px 12px",
      background: disabled ? "#e0e0e0" : "#3f51b5",
      color: disabled ? "#999" : "white",
      border: "none",
      borderRadius: "4px",
      cursor: disabled ? "default" : "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "14px",
      transition: "all 0.2s ease",
    }}
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 4L2 8L6 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 8H10C12.2091 8 14 9.79086 14 12V12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    Undo
  </button>
);

// Custom styled redo button
const CustomRedoButton: React.FC<UndoRedoButtonProps> = ({
  onClick,
  disabled,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: "8px 12px",
      background: disabled ? "#e0e0e0" : "#3f51b5",
      color: disabled ? "#999" : "white",
      border: "none",
      borderRadius: "4px",
      cursor: disabled ? "default" : "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "14px",
      transition: "all 0.2s ease",
    }}
  >
    Redo
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 4L14 8L10 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 8H6C3.79086 8 2 9.79086 2 12V12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

// Color picker component with undo/redo
const ColorPicker = () => {
  // Use the simplified useHistoryState hook instead of manual command creation
  const [color, setColor] = useHistoryState<string>(
    "colorPicker/changeColor",
    "#3f51b5"
  );
  
  const { canUndo, canRedo, undo, redo } = useCommandHistory();

  // Simple handler that uses the command-aware state setter
  const handleColorChange = (newColor: string) => {
    setColor(newColor, `Change color from ${color} to ${newColor}`);
  };

  // Custom rendering function example - shows how to implement custom controls layout
  const renderCustomControls = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={undo}
          disabled={!canUndo}
          style={{
            padding: "5px 10px",
            background: canUndo ? "#f44336" : "#e0e0e0",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: canUndo ? "pointer" : "default",
          }}
        >
          ← Previous Color
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          style={{
            padding: "5px 10px",
            background: canRedo ? "#4caf50" : "#e0e0e0",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: canRedo ? "pointer" : "default",
          }}
        >
          Next Color →
        </button>
      </div>

      <div style={{ fontSize: "12px", color: "#666" }}>
        History navigation: {canUndo ? "Available" : "At oldest state"} |
        {canRedo ? "Forward states available" : "At newest state"}
      </div>
    </div>
  );

  return (
    <div className="example">
      <div
        style={{
          background: color,
          width: "100%",
          height: "120px",
          borderRadius: "8px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: getLuminance(color) > 0.5 ? "#333" : "white",
          fontSize: "18px",
          fontWeight: "bold",
        }}
      >
        Selected Color: {color}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="colorPicker"
          style={{ display: "block", marginBottom: "5px", color: "#333" }}
        >
          Select a color:
        </label>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            id="colorPicker"
            type="color"
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            style={{ width: "50px", height: "50px" }}
          />
          <input
            type="text"
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            style={{ flex: 1, padding: "8px", color: "#333" }}
          />
        </div>
      </div>

      <div className="undo-redo-examples">
        <h3>Example 1: Custom Button Components</h3>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <UndoRedoControls
            UndoButton={CustomUndoButton}
            RedoButton={CustomRedoButton}
          />
        </div>

        <h3>Example 2: Custom Rendering Function</h3>
        <div style={{ marginBottom: "20px" }}>
          <UndoRedoControls renderCustomControls={renderCustomControls} />
        </div>
      </div>

      <div className="description">
        <p>
          This example showcases how to customize the undo/redo controls UI:
        </p>
        <ol>
          <li>Custom button components with unique styling</li>
          <li>Custom rendering function for complete control over layout</li>
          <li>Accessing undo/redo state directly with useCommandHistory</li>
          <li>Using <code>useHistoryState</code> for simplified state management</li>
        </ol>
      </div>
    </div>
  );
};

// Helper function to determine text color based on background luminance
const getLuminance = (hex: string): number => {
  // Remove # if present
  hex = hex.replace("#", "");

  // Parse r, g, b values
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Calculate luminance using the formula for perceived brightness
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Export the wrapped color picker example
export const ColorPickerExample = () => (
  <UndoRedoProvider>
    <h2>Custom UI Example: Color Picker</h2>
    <ColorPicker />
  </UndoRedoProvider>
);
