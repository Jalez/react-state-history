import { useRef, useState, useEffect } from "react";
import "./App.css";
import { CounterExample } from "./examples/01-basic/Counter";
import { TodoListExample } from "./examples/02-composite/TodoList";
import { ColorPickerExample } from "./examples/03-custom-ui/ColorPicker";
import { PersistentCounterExample } from "./examples/04-persistence/PersistentCounter";
import { PersistentToggleCounter } from "./examples/05-persistence-toggle/PersistentToggleCounter";
import { DuplicateCommandTypesExample } from "./examples/06-duplicate-command-types/DuplicateCommandTypes";
import Flow from "./examples/07-react-flow/reactFlowDelete";
import AsymmetricOperationsExample from "./examples/09-asymmetric-operations/AsymmetricOperations";
import FormTransactionExample from "./examples/10-transactions/FormTransactionExample";

function App() {
  // Refs for section navigation
  const basicRef = useRef<HTMLDivElement>(null);
  const compositeRef = useRef<HTMLDivElement>(null);
  const customUiRef = useRef<HTMLDivElement>(null);
  const persistenceRef = useRef<HTMLDivElement>(null);
  const registryRef = useRef<HTMLDivElement>(null);
  const duplicateTypesRef = useRef<HTMLDivElement>(null);
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const asymmetricOperationsRef = useRef<HTMLDivElement>(null);
  const FormTransactionRef = useRef<HTMLDivElement>(null);

  // Track active section and scroll position
  const [activeSection, setActiveSection] = useState<string>("");
  const [isScrolled, setIsScrolled] = useState(false);

  // Update URL hash without triggering scroll
  const updateHash = (hash: string) => {
    window.history.pushState(null, "", hash);
  };

  // Scroll to section
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>, hash: string) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
      updateHash(hash);
      setActiveSection(hash.replace('#', ''));
    }
  };

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Initial check
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Set active section based on URL hash on initial load
  useEffect(() => {
    const hash = window.location.hash || "#basic";
    setActiveSection(hash.replace('#', ''));
    
    // If hash exists in URL, scroll to that section
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <aside className="sidebar">
          <div className={`sidebar-header ${isScrolled ? 'scrolled' : ''}`}>
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
            <p>A General way to manage state history in your application.</p>
          </div>
          
          <nav className="nav-links">
            <a 
              href="#basic" 
              className={activeSection === "basic" ? "active" : ""}
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(basicRef, "#basic"); 
              }}
            >
              1. Basic Usage
            </a>
            <a 
              href="#composite" 
              className={activeSection === "composite" ? "active" : ""}
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(compositeRef, "#composite"); 
              }}
            >
              2. Composite Commands
            </a>
            <a 
              href="#custom-ui" 
              className={activeSection === "custom-ui" ? "active" : ""}
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(customUiRef, "#custom-ui"); 
              }}
            >
              3. Custom UI
            </a>
            <a 
              href="#persistence" 
              className={activeSection === "persistence" ? "active" : ""}
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(persistenceRef, "#persistence"); 
              }}
            >
              4. Persistence
            </a>
            <a 
              href="#registry" 
              className={activeSection === "registry" ? "active" : ""}
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(registryRef, "#registry"); 
              }}
            >
              5. StateChange Registry
            </a>
            <a 
              href="#duplicate-types" 
              className={activeSection === "duplicate-types" ? "active" : ""}
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(duplicateTypesRef, "#duplicate-types"); 
              }}
            >
              6. Command Type Uniqueness
            </a>
            <a 
              href="#react-flow" 
              className={activeSection === "react-flow" ? "active" : ""}
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(reactFlowRef, "#react-flow"); 
              }}
            >
              7. React Flow Integration
            </a>
            <a 
              href="#asymmetric-operations" 
              className={activeSection === "asymmetric-operations" ? "active" : ""}
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(asymmetricOperationsRef, "#asymmetric-operations"); 
              }}
            >
              8. Asymmetric Operations
            </a>
            <a 
              href="#form-transaction" 
              className={activeSection === "form-transaction" ? "active" : ""}
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(FormTransactionRef, "#form-transaction"); 
              }}
            >
              9. Form Transaction Example
            </a>
          </nav>
        </aside>

        <main>
          <div className="section" id="basic" ref={basicRef}>
            <CounterExample key="basic-example" />
            <div className="section-divider">
              <a 
                href="#top" 
                className="back-to-top"
                onClick={(e) => { 
                  e.preventDefault(); 
                  window.scrollTo({ top: 0, behavior: "smooth" }); 
                  updateHash("");
                }}
              >
                Back to Top
              </a>
            </div>
          </div>

          <div className="section" id="composite" ref={compositeRef}>
            <TodoListExample key="composite-example" />
            <div className="section-divider">
              <a 
                href="#top" 
                className="back-to-top"
                onClick={(e) => { 
                  e.preventDefault(); 
                  window.scrollTo({ top: 0, behavior: "smooth" }); 
                  updateHash("");
                }}
              >
                Back to Top
              </a>
            </div>
          </div>

          <div className="section" id="custom-ui" ref={customUiRef}>
            <ColorPickerExample key="custom-ui-example" />
            <div className="section-divider">
              <a 
                href="#top" 
                className="back-to-top"
                onClick={(e) => { 
                  e.preventDefault(); 
                  window.scrollTo({ top: 0, behavior: "smooth" }); 
                  updateHash("");
                }}
              >
                Back to Top
              </a>
            </div>
          </div>

          <div className="section" id="persistence" ref={persistenceRef}>
            <PersistentCounterExample key="persistence-example" />
            <div className="section-divider">
              <a 
                href="#top" 
                className="back-to-top"
                onClick={(e) => { 
                  e.preventDefault(); 
                  window.scrollTo({ top: 0, behavior: "smooth" }); 
                  updateHash("");
                }}
              >
                Back to Top
              </a>
            </div>
          </div>

          <div className="section" id="registry" ref={registryRef}>
            <PersistentToggleCounter key="registry-example" />
            <div className="section-divider">
              <a 
                href="#top" 
                className="back-to-top"
                onClick={(e) => { 
                  e.preventDefault(); 
                  window.scrollTo({ top: 0, behavior: "smooth" }); 
                  updateHash("");
                }}
              >
                Back to Top
              </a>
            </div>
          </div>

          <div className="section" id="duplicate-types" ref={duplicateTypesRef}>
            <DuplicateCommandTypesExample key="duplicate-types-example" />
            <div className="section-divider">
              <a 
                href="#top" 
                className="back-to-top"
                onClick={(e) => { 
                  e.preventDefault(); 
                  window.scrollTo({ top: 0, behavior: "smooth" }); 
                  updateHash("");
                }}
              >
                Back to Top
              </a>
            </div>
          </div>

          <div className="section" id="react-flow" ref={reactFlowRef}>
            <Flow key="react-flow-example" />
            <div className="section-divider">
              <a 
                href="#top" 
                className="back-to-top"
                onClick={(e) => { 
                  e.preventDefault(); 
                  window.scrollTo({ top: 0, behavior: "smooth" }); 
                  updateHash("");
                }}
              >
                Back to Top
              </a>
            </div>
          </div>

          <div
            className="section"
            id="asymmetric-operations"
            ref={asymmetricOperationsRef}
          >
            <AsymmetricOperationsExample key="asymmetric-operations-example" />
            <div className="section-divider">
              <a 
                href="#top" 
                className="back-to-top"
                onClick={(e) => { 
                  e.preventDefault(); 
                  window.scrollTo({ top: 0, behavior: "smooth" }); 
                  updateHash("");
                }}
              >
                Back to Top
              </a>
            </div>
          </div>
          <div className="section" id="form-transaction" ref={FormTransactionRef}>
            <FormTransactionExample key="form-transaction-example" />
            <div className="section-divider">
              <a 
                href="#top" 
                className="back-to-top"
                onClick={(e) => { 
                  e.preventDefault(); 
                  window.scrollTo({ top: 0, behavior: "smooth" }); 
                  updateHash("");
                }}
              >
                Back to Top
              </a>
            </div>
          </div>
        </main>
      </div>

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
