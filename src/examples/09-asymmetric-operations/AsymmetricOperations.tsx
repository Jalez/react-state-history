/** @format */
import React, { useRef, useState } from "react";
import {
  StateHistoryProvider,
  useTrackableState,
  HistoryControls,
} from "../../StateHistory";

/**
 * This example demonstrates the asymmetric operations feature of useTrackableState.
 * It shows how to use different functions for execute vs undo operations, which is
 * useful for non-idempotent operations like adding/removing items from a collection.
 */
const AsymmetricOperations: React.FC = () => {
  // UI state to force re-render
  const [, forceUpdate] = useState({});

  // Use a ref to store the collection to avoid re-renders on every change
  const itemsRef = useRef<string[]>([]);

  // Action functions for adding and removing items
  const addItem = (item: string) => {
    itemsRef.current = [...itemsRef.current, item];
    forceUpdate({}); // Force re-render to show changes
  };

  const removeItem = (item: string) => {
    itemsRef.current = itemsRef.current.filter((i) => i !== item);
    forceUpdate({}); // Force re-render to show changes
  };

  // Create trackers with asymmetric operations
  // For adding: execute uses addItem, undo uses removeItem
  const trackItemAddition = useTrackableState<string>(
    "item-addition",
    addItem, // For execute - adds an item
    removeItem // For undo - removes the item
  );

  // For removing: execute uses removeItem, undo uses addItem
  const trackItemRemoval = useTrackableState<string>(
    "item-removal",
    removeItem, // For execute - removes an item
    addItem // For undo - adds the item back
  );

  // Generate a unique item ID
  const generateItemId = () => `item-${Date.now()}`;

  // Handle adding a new item
  const handleAddItem = () => {
    const newItem = generateItemId();
    // Execute will use addItem, undo will use removeItem
    trackItemAddition(newItem, newItem, `Added ${newItem}`);
  };

  // Handle removing an item
  const handleRemoveItem = (item: string) => {
    // Execute will use removeItem, undo will use addItem
    trackItemRemoval(item, item, `Removed ${item}`);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Asymmetric Operations Example</h2>
      <p>
        This example demonstrates how to use useTrackableState with different
        functions for execute vs undo operations.
      </p>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={handleAddItem}
          style={{ padding: "8px 16px", marginRight: "10px" }}
        >
          Add Item
        </button>

        <HistoryControls />
      </div>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "10px",
          backgroundColor: "#f9f9f9",
          minHeight: "100px",
        }}
      >
        <h3>Items ({itemsRef.current.length})</h3>
        {itemsRef.current.length === 0 ? (
          <p>No items. Click "Add Item" to create some.</p>
        ) : (
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {itemsRef.current.map((item) => (
              <li
                key={item}
                style={{
                  padding: "8px",
                  margin: "4px 0",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{item}</span>
                <button
                  onClick={() => handleRemoveItem(item)}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#ff4d4d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>How it works</h3>
        <p>
          When adding items, we use an <strong>asymmetric</strong> approach:
        </p>
        <ul>
          <li>
            <strong>Execute:</strong> Uses the <code>addItem</code> function
          </li>
          <li>
            <strong>Undo:</strong> Uses the <code>removeItem</code> function
          </li>
        </ul>
        <p>Similarly, when removing items we use the reverse:</p>
        <ul>
          <li>
            <strong>Execute:</strong> Uses the <code>removeItem</code> function
          </li>
          <li>
            <strong>Undo:</strong> Uses the <code>addItem</code> function
          </li>
        </ul>
        <p>
          This makes undo/redo work naturally with collection operations, where
          using the same function for both operations wouldn't work.
        </p>
      </div>
    </div>
  );
};

export default function AsymmetricOperationsExample() {
  return (
    <StateHistoryProvider>
      <AsymmetricOperations />
    </StateHistoryProvider>
  );
}
