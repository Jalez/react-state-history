/**
 * Transaction API Example - Data Grid
 *
 * This example demonstrates how to use the Transaction API to group multiple related
 * operations into a single undoable action. It implements a simple data grid where multiple
 * cells can be selected and edited in a batch.
 *
 * Key concepts demonstrated:
 * - Direct use of beginTransaction() and commitTransaction() methods
 * - Handling edits across multiple cells as a single operation
 * - Error handling with abortTransaction()
 */
import React, { useState, useCallback, useRef } from "react";
import {
  StateHistoryProvider,
  HistoryControls,
  useTrackableState,
  useTransaction,
} from "../../StateHistory";

// Define our data model
interface CellData {
  id: string;
  value: string;
}

interface RowData {
  id: string;
  cells: CellData[];
}

// Generate initial grid data
const generateInitialData = (rows: number, cols: number): RowData[] => {
  return Array.from({ length: rows }, (_, rowIndex) => ({
    id: `row-${rowIndex}`,
    cells: Array.from({ length: cols }, (_, colIndex) => ({
      id: `cell-${rowIndex}-${colIndex}`,
      value: `Row ${rowIndex + 1}, Col ${colIndex + 1}`,
    })),
  }));
};

// Cell component with selection support
const Cell: React.FC<{
  data: CellData;
  isSelected: boolean;
  onClick: () => void;
  onEdit: (newValue: string) => void;
}> = ({ data, isSelected, onClick, onEdit }) => {
  const handleDoubleClick = () => {
    const newValue = prompt("Enter new value:", data.value);
    if (newValue !== null) {
      onEdit(newValue);
    }
  };

  return (
    <td
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      style={{
        padding: "8px",
        border: "1px solid #ddd",
        backgroundColor: isSelected ? "#e6f7ff" : "white",
        cursor: "pointer",
      }}
    >
      {data.value}
    </td>
  );
};

// Main DataGrid component
const DataGrid: React.FC = () => {
  // Create state for the grid data (5 rows, 5 columns)
  const [gridData, setGridData] = useState<RowData[]>(() =>
    generateInitialData(5, 5)
  );

  // Track selected cells
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  // Track if an operation is in progress
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);

  // Reference to the last grid data before a batch edit
  const lastGridDataRef = useRef<RowData[]>(gridData);

  // Use our StateHistory hook to make grid changes trackable
  const trackGridChange = useTrackableState("gridData/update", setGridData);

  // Get transaction methods from our hook
  const {
    beginTransaction,
    commitTransaction,
    abortTransaction,
    isTransactionInProgress,
  } = useTransaction();

  // Toggle cell selection
  const toggleCellSelection = (cellId: string) => {
    setSelectedCells((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(cellId)) {
        newSelection.delete(cellId);
      } else {
        newSelection.add(cellId);
      }
      return newSelection;
    });
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedCells(new Set());
  };

  // Edit a single cell
  const editCell = useCallback(
    (rowIndex: number, cellIndex: number, newValue: string) => {
      setGridData((prevData) => {
        const newData = [...prevData];
        newData[rowIndex] = {
          ...newData[rowIndex],
          cells: [...newData[rowIndex].cells],
        };
        newData[rowIndex].cells[cellIndex] = {
          ...newData[rowIndex].cells[cellIndex],
          value: newValue,
        };
        return newData;
      });
    },
    []
  );

  // IMPORTANT: This is the core method demonstrating transaction API usage
  const editSelectedCells = useCallback(() => {
    if (selectedCells.size === 0) {
      alert("Please select at least one cell to edit");
      return;
    }

    // Prompt for the new value
    const newValue = prompt("Enter new value for all selected cells:");
    if (newValue === null) return; // User cancelled

    try {
      // Store the current grid data for undo
      lastGridDataRef.current = JSON.parse(JSON.stringify(gridData));

      // BEGIN TRANSACTION - all changes will be grouped as one undoable action
      setIsOperationInProgress(true);
      beginTransaction("Edit multiple cells");

      // Create a new grid with the updates
      const newGridData = gridData.map((row) => ({
        ...row,
        cells: row.cells.map((cell) => {
          // Only update selected cells
          if (selectedCells.has(cell.id)) {
            return { ...cell, value: newValue };
          }
          return cell;
        }),
      }));

      // Update the grid with all changes
      setGridData(newGridData);

      // Track the batch change for undo/redo
      trackGridChange(
        newGridData,
        lastGridDataRef.current,
        `Edit ${selectedCells.size} cells`
      );

      // COMMIT TRANSACTION - combine all the operations into a single undoable step
      commitTransaction();

      // Clear the selection after editing
      clearSelection();
    } catch (error) {
      // If there's an error, abort the transaction
      console.error("Error during batch edit:", error);
      abortTransaction();
      // Restore the previous grid state
      setGridData(lastGridDataRef.current);
      alert(
        "An error occurred while updating cells. Changes were not applied."
      );
    } finally {
      setIsOperationInProgress(false);
    }
  }, [
    selectedCells,
    gridData,
    beginTransaction,
    commitTransaction,
    abortTransaction,
    trackGridChange,
  ]);

  // Reset the grid to initial data
  const resetGrid = useCallback(() => {
    const initialData = generateInitialData(5, 5);
    const oldData = gridData;

    // Track the reset for undo/redo
    setGridData(initialData);
    trackGridChange(initialData, oldData, "Reset grid");
    clearSelection();
  }, [gridData, trackGridChange]);

  return (
    <div className="data-grid-container">
      <div
        style={{
          margin: "20px 0",
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <button
          onClick={editSelectedCells}
          disabled={isOperationInProgress || selectedCells.size === 0}
          style={{
            padding: "8px 16px",
            background: "#1890ff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: selectedCells.size > 0 ? "pointer" : "not-allowed",
            opacity:
              isOperationInProgress || selectedCells.size === 0 ? 0.6 : 1,
          }}
        >
          Edit Selected Cells ({selectedCells.size})
        </button>

        <button
          onClick={clearSelection}
          disabled={isOperationInProgress || selectedCells.size === 0}
          style={{
            padding: "8px 16px",
            background: "#ff4d4f",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: selectedCells.size > 0 ? "pointer" : "not-allowed",
            opacity:
              isOperationInProgress || selectedCells.size === 0 ? 0.6 : 1,
          }}
        >
          Clear Selection
        </button>

        <button
          onClick={resetGrid}
          disabled={isOperationInProgress}
          style={{
            padding: "8px 16px",
            background: "#faad14",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isOperationInProgress ? "not-allowed" : "pointer",
            opacity: isOperationInProgress ? 0.6 : 1,
          }}
        >
          Reset Grid
        </button>

        {isTransactionInProgress && (
          <span style={{ marginLeft: "10px", color: "#1890ff" }}>
            Transaction in progress...
          </span>
        )}
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #ddd",
        }}
      >
        <tbody>
          {gridData.map((row, rowIndex) => (
            <tr key={row.id}>
              {row.cells.map((cell, cellIndex) => (
                <Cell
                  key={cell.id}
                  data={cell}
                  isSelected={selectedCells.has(cell.id)}
                  onClick={() => toggleCellSelection(cell.id)}
                  onEdit={(newValue) => {
                    const oldData = [...gridData];
                    editCell(rowIndex, cellIndex, newValue);
                    // Track individual cell edits when not part of a batch
                    trackGridChange(
                      [...gridData], // Need to create a new array to capture latest state
                      oldData,
                      `Edit cell (${rowIndex}, ${cellIndex})`
                    );
                  }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Wrapper component with StateHistory context
export default function TransactionExample() {
  return (
    <div className="example-container">
      <h2>Transaction API Example - Data Grid</h2>
      <div className="description">
        <p>
          This example demonstrates using the Transaction API with explicit
          <code>beginTransaction()</code> and <code>commitTransaction()</code>{" "}
          calls to group multiple related operations as a single undoable
          action.
        </p>

        <div className="code-highlight">
          <h3>Transaction API Highlight:</h3>
          <pre>
            <code>{`// Get transaction methods from our hook
const { 
  beginTransaction, 
  commitTransaction, 
  abortTransaction,
  isTransactionInProgress 
} = useTransaction();

// Inside the batch edit function:
try {
  // Begin the transaction
  beginTransaction("Edit multiple cells");
  
  // Perform multiple state updates...
  setGridData(newGridData);
  
  // Track the changes
  trackGridChange(newGridData, oldData, "Edit cells");
  
  // Commit the transaction - combines everything into one undo step
  commitTransaction();
} catch (error) {
  // If there's an error, abort the transaction
  abortTransaction();
  // Restore previous state...
}`}</code>
          </pre>
        </div>

        <p>
          <strong>Instructions:</strong> Select multiple cells by clicking on
          them, then click "Edit Selected Cells" to change them all at once.
          This will be recorded as a single undo operation despite affecting
          multiple cells.
        </p>
      </div>

      <StateHistoryProvider
        storageKey="data-grid-example"
        defaultPersistent={true}
      >
        <DataGrid />
        <div style={{ marginTop: "20px" }}>
          <HistoryControls
            showPersistenceToggle={true}
            persistenceLabel="Persist Grid Data"
          />
        </div>
      </StateHistoryProvider>
    </div>
  );
}
