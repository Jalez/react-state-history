/** @format */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AsymmetricOperations from "./AsymmetricOperations";
import { act } from "react"; // Import from react, not react-dom/test-utils
import { describe, expect, it } from "vitest";

describe("AsymmetricOperations", () => {
  it("should add and remove items with undo/redo support", async () => {
    // Render the component
    render(<AsymmetricOperations />);

    // Initially, there should be no items
    expect(
      screen.getByText('No items. Click "Add Item" to create some.')
    ).toBeInTheDocument();

    // Add an item - wrap in act and waitFor to ensure state updates complete
    await act(async () => {
      fireEvent.click(screen.getByText("Add Item"));
      // Small delay to ensure state updates
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Now there should be one item
    await waitFor(() => {
      expect(
        screen.queryByText('No items. Click "Add Item" to create some.')
      ).not.toBeInTheDocument();
      expect(screen.getByText(/item-\d+/)).toBeInTheDocument();
    });

    // Get the remove button for the item
    const removeButton = screen.getByText("Remove");

    // Remove the item - wrap in act
    await act(async () => {
      fireEvent.click(removeButton);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // The item should be gone
    await waitFor(() => {
      expect(
        screen.getByText('No items. Click "Add Item" to create some.')
      ).toBeInTheDocument();
    });

    // Undo the removal (should add the item back) - wrap in act
    await act(async () => {
      fireEvent.click(screen.getByText("Undo"));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // The item should be back
    await waitFor(() => {
      expect(
        screen.queryByText('No items. Click "Add Item" to create some.')
      ).not.toBeInTheDocument();
      expect(screen.getByText(/item-\d+/)).toBeInTheDocument();
    });

    // Undo again (should undo the addition) - wrap in act
    await act(async () => {
      fireEvent.click(screen.getByText("Undo"));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // The item should be gone again
    await waitFor(() => {
      expect(
        screen.getByText('No items. Click "Add Item" to create some.')
      ).toBeInTheDocument();
    });

    // Redo the addition - wrap in act
    await act(async () => {
      fireEvent.click(screen.getByText("Redo"));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // The item should be back
    await waitFor(() => {
      expect(
        screen.queryByText('No items. Click "Add Item" to create some.')
      ).not.toBeInTheDocument();
      expect(screen.getByText(/item-\d+/)).toBeInTheDocument();
    });
  });

  it("should support multiple undo/redo operations", async () => {
    // Create a simplified test that's more robust
    render(<AsymmetricOperations />);

    // Initially, there should be no items
    expect(
      screen.getByText('No items. Click "Add Item" to create some.')
    ).toBeInTheDocument();

    // Add two items with longer delays
    await act(async () => {
      fireEvent.click(screen.getByText("Add Item"));
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Add Item"));
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify we have 2 items
    await waitFor(() => {
      const removeButtons = screen.getAllByText("Remove");
      expect(removeButtons.length).toBe(2);
    });

    // Undo both additions
    await act(async () => {
      fireEvent.click(screen.getByText("Undo"));
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Undo"));
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify we have no items
    await waitFor(() => {
      expect(screen.queryByText(/item-\d+/)).not.toBeInTheDocument();
      expect(
        screen.getByText('No items. Click "Add Item" to create some.')
      ).toBeInTheDocument();
    });

    // Redo both operations
    await act(async () => {
      fireEvent.click(screen.getByText("Redo"));
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Redo"));
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify we have 2 items again
    await waitFor(() => {
      const removeButtons = screen.getAllByText("Remove");
      expect(removeButtons.length).toBe(2);
    });
  });
});
