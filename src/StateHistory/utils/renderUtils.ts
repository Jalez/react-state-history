/** @format */
import { useCallback } from "react";

/**
 * Hook to safely schedule actions outside of the render cycle
 * This implementation is designed to be compatible with both React 18 and React 19
 */
export function useDeferredActions() {
  // Function to safely schedule state updates outside of render
  const scheduleDeferredAction = useCallback((action: () => void) => {
    // Use queueMicrotask to ensure we're outside the render cycle
    // This is more compatible across different React versions
    queueMicrotask(() => {
      try {
        action();
      } catch (err) {
        console.error("Error in deferred action:", err);
      }
    });
  }, []);

  return scheduleDeferredAction;
}
