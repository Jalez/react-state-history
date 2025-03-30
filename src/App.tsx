import { useRef } from "react";
import "./App.css";
import { CounterExample } from "./examples/01-basic/Counter";
import { TodoListExample } from "./examples/02-composite/TodoList";
import { ColorPickerExample } from "./examples/03-custom-ui/ColorPicker";
import { PersistentCounterExample } from "./examples/04-persistence/PersistentCounter";
import { PersistentToggleCounter } from "./examples/05-persistence-toggle/PersistentToggleCounter";
import { DuplicateCommandTypesExample } from "./examples/06-duplicate-command-types/DuplicateCommandTypes";
import Flow from "./examples/07-react-flow/reactFlowDelete";

function App() {
  // Refs for section navigation
  const basicRef = useRef<HTMLDivElement>(null);
  const compositeRef = useRef<HTMLDivElement>(null);
  const customUiRef = useRef<HTMLDivElement>(null);
  const persistenceRef = useRef<HTMLDivElement>(null);
  const registryRef = useRef<HTMLDivElement>(null);
  const duplicateTypesRef = useRef<HTMLDivElement>(null);
  const reactFlowRef = useRef<HTMLDivElement>(null);

  // Scroll to section - fix the type to match React.useRef's return type
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      // Use scrollIntoView with supported options
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>
          react-
          <span
            style={{
              textShadow: "1px 1px 2px white, -1px -1px 2px white",
              fontWeight: "bold",
              color: "black ",
            }}
          >
            state
          </span>
          -history
        </h1>
        <p>
        A General way to manage state history in your application. 
        </p>

        <div className="tabs">
          <button onClick={() => scrollToSection(basicRef)}>
            1. Basic Usage
          </button>
          <button onClick={() => scrollToSection(compositeRef)}>
            2. Composite Commands
          </button>
          <button onClick={() => scrollToSection(customUiRef)}>
            3. Custom UI
          </button>
          <button onClick={() => scrollToSection(persistenceRef)}>
            4. Persistence
          </button>
          <button onClick={() => scrollToSection(registryRef)}>
            5. StateChange Registry
          </button>
          <button onClick={() => scrollToSection(duplicateTypesRef)}>
            6. Command Type Uniqueness
          </button>
          <button onClick={() => scrollToSection(reactFlowRef)}>
            7. React Flow Integration
          </button>
        </div>
      </header>

      <main>
        <div className="section" id="basic" ref={basicRef}>
          <CounterExample key="basic-example" />
          <div className="section-divider">
            <button
              className="back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to Top
            </button>
          </div>
        </div>

        <div className="section" id="composite" ref={compositeRef}>
          <TodoListExample key="composite-example" />
          <div className="section-divider">
            <button
              className="back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to Top
            </button>
          </div>
        </div>

        <div className="section" id="custom-ui" ref={customUiRef}>
          <ColorPickerExample key="custom-ui-example" />
          <div className="section-divider">
            <button
              className="back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to Top
            </button>
          </div>
        </div>

        <div className="section" id="persistence" ref={persistenceRef}>
          <PersistentCounterExample key="persistence-example" />
          <div className="section-divider">
            <button
              className="back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to Top
            </button>
          </div>
        </div>
        
        <div className="section" id="registry" ref={registryRef}>
          <PersistentToggleCounter key="registry-example" />
          <div className="section-divider">
            <button
              className="back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to Top
            </button>
          </div>
        </div>
        
        <div className="section" id="duplicate-types" ref={duplicateTypesRef}>
          <DuplicateCommandTypesExample key="duplicate-types-example" />
          <div className="section-divider">
            <button
              className="back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to Top
            </button>
          </div>
        </div>

        <div className="section" id="react-flow" ref={reactFlowRef}>
          <Flow key="react-flow-example" />
          <div className="section-divider">
            <button
              className="back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to Top
            </button>
          </div>
        </div>
      </main>

      <footer>
        <p>
          <a
            href="https://github.com/jalez/undo-redo"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Repository
          </a>{" "}
          | Documentation and API reference in README.md
        </p>
      </footer>
    </div>
  );
}

export default App;
