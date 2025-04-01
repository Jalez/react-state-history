/** @format */
import React, { useRef, useState } from "react";
import {
  StateHistoryProvider,
  useTrackableState,
  HistoryControls,
} from "../../StateHistory";

/**
 * This example demonstrates the asymmetric operations feature of useTrackableState
 * with different parameter types, showing how to:
 * 1. Use different functions for execute vs undo operations
 * 2. Use different parameter types for add (full object) vs remove (just ID)
 */
interface Item {
  id: string;
  name: string;
  createdAt: Date;
}

const AsymmetricOperations: React.FC = () => {
  // UI state to force re-render
  const [, forceUpdate] = useState({});

  // Use a ref to store the collection to avoid re-renders on every change
  const itemsRef = useRef<Item[]>([]);

  // Action functions for adding and removing items
  // Add takes a full Item object
  const addItem = (item: Item) => {
    itemsRef.current = [...itemsRef.current, item];
    forceUpdate({}); // Force re-render to show changes
  };

  // Remove takes just the ID
  const removeItemById = (id: string) => {
    itemsRef.current = itemsRef.current.filter((item) => item.id !== id);
    forceUpdate({}); // Force re-render to show changes
  };

  // Create trackers with asymmetric operations AND different parameter types
  // For adding:
  // - execute uses addItem (takes full Item object)
  // - undo uses removeItemById (takes just string ID)
  const trackItemAddition = useTrackableState<Item, string>(
    "item-addition",
    addItem, // Execute takes Item
    removeItemById // Undo takes string ID
  );

  // For removing:
  // - execute uses removeItemById (takes string ID)
  // - undo uses addItem (takes full Item object)
  const trackItemRemoval = useTrackableState<string, Item>(
    "item-removal",
    removeItemById, // Execute takes string ID
    addItem // Undo takes Item
  );

  // Generate a unique item
  const generateItem = (): Item => ({
    id: `item-${Date.now()}`,
    name: `Item ${itemsRef.current.length + 1}`,
    createdAt: new Date(),
  });

  // Handle adding a new item
  const handleAddItem = () => {
    const newItem = generateItem();

    // Execute will use addItem with full object
    // Undo will use removeItemById with just the ID
    trackItemAddition(
      newItem, // newValue: full Item for execute
      newItem.id, // oldValue: just ID for undo
      `Added ${newItem.name}`
    );
  };

  // Handle removing an item
  const handleRemoveItem = (item: Item) => {
    // Execute will use removeItemById with just the ID
    // Undo will use addItem with the full Item
    trackItemRemoval(
      item.id, // newValue: just ID for execute
      item, // oldValue: full Item for undo
      `Removed ${item.name}`
    );
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Asymmetric Operations with Different Parameter Types</h2>
      <p>
        This example demonstrates useTrackableState with both different
        functions for execute vs undo operations and different parameter types.
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
                key={item.id}
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
                <div>
                  <strong>{item.name}</strong>
                  <div style={{ fontSize: "0.8em", color: "#666" }}>
                    Created: {item.createdAt.toLocaleTimeString()}
                  </div>
                  <div style={{ fontSize: "0.7em", color: "#999" }}>
                    ID: {item.id}
                  </div>
                </div>
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
          When adding items, we use both asymmetric functions and different
          parameter types:
        </p>
        <ul>
          <li>
            <strong>Execute:</strong> Uses <code>addItem(item: Item)</code> with
            full item object
          </li>
          <li>
            <strong>Undo:</strong> Uses <code>removeItemById(id: string)</code>{" "}
            with just the ID
          </li>
        </ul>
        <pre
          style={{
            backgroundColor: "#f0f0f0",
            padding: "10px",
            overflow: "auto",
          }}
        >
          {`// Different parameter types for execute vs undo
const trackItemAddition = useTrackableState<Item, string>(
  "item-addition",
  addItem,         // Execute takes Item
  removeItemById   // Undo takes string ID
);

// Usage: pass different types for newValue and oldValue
trackItemAddition(
  newItem,       // newValue: full Item for execute
  newItem.id,    // oldValue: just ID for undo
  "Added item"
);`}
        </pre>
        <p>
          Similarly, when removing items we use the reverse parameter types:
        </p>
        <ul>
          <li>
            <strong>Execute:</strong> Uses{" "}
            <code>removeItemById(id: string)</code> with just the ID
          </li>
          <li>
            <strong>Undo:</strong> Uses <code>addItem(item: Item)</code> with
            full item object
          </li>
        </ul>
        <p>
          This minimizes the amount of data we need to store for undo/redo
          operations while still maintaining all the information we need to
          restore state.
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
