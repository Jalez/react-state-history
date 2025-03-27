/** @format */
import { useRef, useEffect, useCallback } from 'react';

/**
 * Hook to track if the component is currently rendering
 * and provide a safe way to schedule actions outside of render
 */
export function useDeferredActions() {
  // Track if we're currently in a render cycle to avoid setState during render
  const isRenderingRef = useRef(false);
  
  // Queue for deferred commands
  const pendingActionsRef = useRef<Array<() => void>>([]);

  // Function to safely schedule state updates outside of render
  const scheduleDeferredAction = useCallback((action: () => void) => {
    if (isRenderingRef.current) {
      // If we're currently rendering, add the action to the queue
      pendingActionsRef.current.push(action);
    } else {
      // Otherwise, execute it immediately
      action();
    }
  }, []);

  // Process any pending actions after render
  useEffect(() => {
    const pendingActions = [...pendingActionsRef.current];
    pendingActionsRef.current = [];
    
    pendingActions.forEach(action => action());
  });

  // Set up render tracking lifecycle
  useEffect(() => {
    // This effect runs after render
    isRenderingRef.current = false;
    
    return () => {
      // This cleanup function runs before the next render
      isRenderingRef.current = true;
    };
  });

  return scheduleDeferredAction;
}