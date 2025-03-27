import { useEffect } from "react";
import {
  UndoRedoProvider,
  registerCommand,
  registerValueChangeCommand,
} from "../../UndoRedo";
import UndoRedoControls from "../../UndoRedo/components/UndoRedoControls";
import { Counter } from "../01-basic/Counter";
import { RegistryCounter } from "./RegistryCounter";

const STORAGE_KEY = "persistent-toggle-counter";

export const PersistentToggleCounter = () => {
  // Register our counter commands - typically would be done at app startup
  useEffect(() => {
    // Register common counter commands
    registerValueChangeCommand<number>(
      "counter/setValue", 
      (value) => {
        // This is a dummy registration that will be overridden
        // by the actual implementation in the component
        console.log("Default setValue handler called with:", value);
      }
    );

    // You could also register individual commands
    registerCommand(
      "counter/increment",
      (params: { count: number }) => {
        // The actual implementation will be provided by the component
        console.log("Incrementing from", params.count);
      },
      (params: { count: number }) => {
        // The actual implementation will be provided by the component
        console.log("Undoing increment from", params.count + 1);
      }
    );

    registerCommand(
      "counter/reset",
      (params: { previousCount: number }) => {
        // Implementation will be provided by component
        console.log("Resetting from", params.previousCount);
      },
      (params: { previousCount: number }) => {
        // Implementation will be provided by component
        console.log("Undoing reset to", params.previousCount);
      }
    );
  }, []);

  return (
    <div className="example-container">
      <h2>Persistent Toggle Counter</h2>
      <p>
        This example demonstrates toggling persistence on/off. The counter state
        will be preserved across page reloads when persistence is enabled.
      </p>
      <UndoRedoProvider storageKey={STORAGE_KEY} defaultPersistent={false}>
        <div className="legacy-example">
          <h3>Legacy Counter (Function String Serialization)</h3>
          <Counter />
        </div>

        <div className="registry-example">
          <h3>Registry Counter (Command Registry)</h3>
          <RegistryCounter />
        </div>
        
        <div className="info-text" style={{ marginTop: "1rem", fontSize: "0.9em", color: "#666" }}>
          Try changing the counter, then toggle persistence on and reload the
          page. The counter state will be preserved when persistence is enabled.
          <br />
          <strong>Note:</strong> The Registry Counter properly restores state on reload,
          while the Legacy Counter will only preserve its value but not command functionality.
        </div>
        <UndoRedoControls
          showPersistenceToggle={true}
          persistenceLabel="Enable State Persistence"
        />
      </UndoRedoProvider>
    </div>
  );
};
