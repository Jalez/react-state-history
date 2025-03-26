/** @format */
import React, { useEffect } from "react";

/**
 * Type for control registration function
 * This is provided by consuming applications
 */
export type RegisterControlFn = (
  section: string,
  type: string,
  id: string,
  component: React.ComponentType<any>,
  props?: object,
  priority?: number
) => void;

/**
 * Type for control unregistration function
 * This is provided by consuming applications
 */
export type UnregisterControlFn = (
  section: string,
  type: string,
  id: string
) => void;

/**
 * Props for the UndoRedoControlsRegistration component
 */
export interface UndoRedoRegistrationProps {
  /** Registration function provided by the host application */
  registerControl: RegisterControlFn;
  /** Unregistration function provided by the host application */
  unregisterControl: UnregisterControlFn;
  /** The section to register the controls in (e.g., "navigation") */
  section?: string;
  /** The control type (e.g., "mindmap", "editor") */
  controlType?: string;
  /** The priority of the control (lower numbers appear first) */
  priority?: number;
}

/**
 * Component that registers the undo/redo controls in an external control registry
 *
 * This optional integration component allows the undo/redo controls
 * to be registered with a host application's control registry.
 */
const UndoRedoControlsRegistration: React.FC<UndoRedoRegistrationProps> = ({
  registerControl,
  unregisterControl,
  section = "navigation",
  controlType = "default",
  priority = 5,
}) => {
  // Import here to avoid circular dependencies
  const UndoRedoControls = React.lazy(
    () => import("./components/UndoRedoControls")
  );

  useEffect(() => {
    // Register the undo/redo controls in the specified section
    registerControl(
      section,
      controlType,
      "UNDO_REDO_CONTROLS",
      UndoRedoControls,
      {}, // No props needed as component uses context
      priority
    );

    // Cleanup when unmounted
    return () => {
      unregisterControl(section, controlType, "UNDO_REDO_CONTROLS");
    };
  }, [registerControl, unregisterControl, section, controlType, priority]);

  // This component doesn't render anything
  return null;
};

export default UndoRedoControlsRegistration;
