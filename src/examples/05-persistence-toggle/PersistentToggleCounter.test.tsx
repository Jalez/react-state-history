import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersistentToggleCounter } from "../05-persistence-toggle/PersistentToggleCounter";
import { setupMockLocalStorage } from "../../test/mockLocalStorage";

describe("PersistentToggleCounter component", () => {
  const { restoreLocalStorage } = setupMockLocalStorage();

  // Clean up after all tests
  afterEach(() => {
    localStorage.clear();
    restoreLocalStorage();
    vi.clearAllMocks();
  });

  // Silence common messages
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders the counter component with persistence disabled by default", async () => {
    render(<PersistentToggleCounter />);

    // Check for the heading
    const heading = await screen.findByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Persistence Toggle Example");

    // Should display Count: 0 initially
    const countText = await screen.findByText(/Count: 0/);
    expect(countText).toBeInTheDocument();

    // Persistence should be disabled by default
    const persistenceCheckbox = await screen.findByLabelText(
      /Enable State Persistence/
    );
    expect(persistenceCheckbox).not.toBeChecked();
  });

  it("allows the counter to be incremented", async () => {
    const user = userEvent.setup();
    render(<PersistentToggleCounter />);

    // Find the increment button
    const incrementButton = await screen.findByText("Increment");

    // Increment counter
    await user.click(incrementButton);

    // We need to wait for the state changes to be reflected in the UI
    await waitFor(
      () => {
        const countElement = screen.getByText(/Count:/);
        expect(countElement.textContent).toContain("1");
      },
      { timeout: 3000 }
    );
  });

  it("supports toggling persistence on and off", async () => {
    const user = userEvent.setup();
    render(<PersistentToggleCounter />);

    // Persistence should be disabled by default
    const persistenceCheckbox = await screen.findByLabelText(
      /Enable State Persistence/
    );
    expect(persistenceCheckbox).not.toBeChecked();

    // Enable persistence
    await user.click(persistenceCheckbox);
    expect(persistenceCheckbox).toBeChecked();

    // Update counter
    const incrementButton = await screen.findByText("Increment");
    await user.click(incrementButton);

    // Check that localStorage has data
    expect(
      localStorage.getItem("state_history_persistent-toggle-counter")
    ).toBeTruthy();

    // Disable persistence
    await user.click(persistenceCheckbox);
    expect(persistenceCheckbox).not.toBeChecked();

    // Storage should be cleared when persistence is disabled
    expect(
      localStorage.getItem("state_history_persistent-toggle-counter")
    ).toBeNull();
  });

  it("supports undo/redo operations", async () => {
    const user = userEvent.setup();
    render(<PersistentToggleCounter />);

    // Get reference to the counter value before any changes
    const initialCounter = await screen.findByText(/Count: 0/);
    expect(initialCounter).toBeInTheDocument();

    // Increment counter twice
    const incrementButton = await screen.findByText("Increment");
    await user.click(incrementButton);
    await user.click(incrementButton);

    // Wait for counter update
    await waitFor(
      () => {
        const counter = screen.getByText(/Count:/);
        expect(counter.textContent).toContain("2");
      },
      { timeout: 2000 }
    );

    // Find and click the Undo button
    const undoButton = await screen.findByText("Undo");
    await user.click(undoButton);

    // Wait for the undo operation to complete
    await waitFor(
      () => {
        const counterValue = screen.getByText(/Count:/);
        expect(counterValue.textContent).toContain("1");
      },
      { timeout: 2000 }
    );

    // Redo the operation
    const redoButton = await screen.findByText("Redo");
    await user.click(redoButton);

    // Counter should be 2 again
    await waitFor(
      () => {
        const counterValue = screen.getByText(/Count:/);
        expect(counterValue.textContent).toContain("2");
      },
      { timeout: 2000 }
    );
  });
});
