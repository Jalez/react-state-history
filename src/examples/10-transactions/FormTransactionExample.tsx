/**
 * Transaction API Example - Form with Validation
 *
 * This example demonstrates how to use the Transaction API with a form submission flow,
 * where multiple field updates should be treated as a single atomic operation.
 *
 * Key concepts demonstrated:
 * - Using transactions with form validation
 * - Automatic transaction handling with useTransaction hook
 * - Rolling back changes when validation fails
 */
import React, { useState, useCallback } from "react";
import {
  StateHistoryProvider,
  HistoryControls,
  useTrackableState,
  useTransaction,
} from "../../StateHistory";

// User form data model
interface UserFormData {
  firstName: string;
  lastName: string;
  general: string;
}

// Form validation error model
interface FormErrors {
  firstName?: string;
  lastName?: string;
  general?: string;
}

// Form input component
const FormInput: React.FC<{
  label: string;
  name: string;
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, value, error, onChange }) => {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        htmlFor={name}
        style={{
          display: "block",
          marginBottom: "6px",
          fontWeight: "500",
        }}
      >
        {label}
      </label>
      <input id={name} name={name} value={value} onChange={onChange} />
      {error && (
        <div style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "4px" }}>
          {error}
        </div>
      )}
    </div>
  );
};

// Main form component
const UserForm: React.FC = () => {
  // Initial form data
  const defaultFormData: UserFormData = {
    firstName: "",
    lastName: "",
    general: "",
  };

  // State for form data and errors
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [shouldError, setShouldError] = useState(false);

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  // Track form changes with StateHistory
  const trackFirstNameChange = useTrackableState(
    "userForm/firstname/update",
    setFirstName
  );
  const trackLastNameChange = useTrackableState(
    "userForm/lastname/update",
    setLastName
  );
  const trackFormChange = useTrackableState("userForm/update", setFormData);

  // IMPORTANT: Get transaction methods from our hook
  const { beginTransaction, commitTransaction, abortTransaction } =
    useTransaction();

  // Update a single form field

  // Handle form submission with transaction
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Store the current form data for undo
      const oldFormData = { ...formData };

      try {
        // BEGIN TRANSACTION
        beginTransaction("Submit user form");

        // Simulate a successful form submission
        // In a real app, you might call an API here

        // Clear the form after successful submission
        const newFormData: UserFormData = {
          firstName: firstName,
          lastName: lastName,
          general: "",
        };
        trackFirstNameChange("", firstName, "First name change");
        trackLastNameChange("", lastName, "Last name change");
        // Track the form submission as a state change
        trackFormChange(newFormData, oldFormData, "Form submission");

        // Show success message

        // Clear any existing errors
        setFormErrors({});
        if (shouldError) {
          throw new Error("Simulated error");
        }

        // COMMIT TRANSACTION - all changes become one undoable action
        setSuccessMessage("User information submitted successfully!");
        commitTransaction();
      } catch (error) {
        // If something went wrong, abort the transaction
        // This will automatically roll back all state changes made during the transaction
        console.error("Error during form submission:", error);
        abortTransaction();

        // Set a general error message
        setFormErrors({
          general: "An error occurred during submission. Please try again.",
        });

        // No need to manually restore the form data anymore
        // The abortTransaction() call will undo all state changes
      }
    },
    [
      formData,
      beginTransaction,
      commitTransaction,
      abortTransaction,
      trackFormChange,
      defaultFormData,
    ]
  );

  // Reset the form to empty values
  const handleReset = useCallback(() => {
    // Store current values for undo
    const oldFormData = { ...formData };

    // Reset form to default values
    setFormData(defaultFormData);

    // Track the reset for undo/redo
    trackFormChange(defaultFormData, oldFormData, "Reset form");

    // Clear errors and success message
    setFormErrors({});
    setSuccessMessage(null);
  }, [formData, trackFormChange, defaultFormData]);

  return (
    <div className="user-form-container">
      {/* Success message banner */}
      {successMessage && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: "4px",
            marginBottom: "20px",
            color: "#52c41a",
          }}
        >
          {successMessage}
        </div>
      )}

      {/* General error message */}
      {formErrors.general && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fff2f0",
            border: "1px solid #ffccc7",
            borderRadius: "4px",
            marginBottom: "20px",
            color: "#ff4d4f",
          }}
        >
          {formErrors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <FormInput
          label="First Name"
          name="firstName"
          value={firstName}
          error={formErrors.firstName}
          onChange={(e) =>
            trackFirstNameChange(e.target.value, firstName, "First name change")
          }
        />

        <FormInput
          label="Last Name"
          name="lastName"
          value={lastName}
          error={formErrors.lastName}
          onChange={(e) =>
            trackLastNameChange(e.target.value, lastName, "Last name change")
          }
        />

        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button type="submit">Submit</button>

          <button type="button" onClick={handleReset}>
            Reset
          </button>
          {/* Add a checkbox to toggle errors */}
          <label>
            <input
              type="checkbox"
              checked={shouldError}
              onChange={(e) => setShouldError(e.target.checked)}
            />
            Force Error
          </label>
        </div>
      </form>
    </div>
  );
};

// Wrapper component with StateHistory context
export default function FormTransactionExample() {
  return (
    <div className="example-container">
      <h2>Transaction API Example - Form Submission</h2>
      <div className="description">
        <p>
          This example demonstrates using the Transaction API to handle form
          submission as a single undoable action, including validation and error
          handling.
        </p>

        <div className="code-highlight">
          <h3>Transaction API Highlight:</h3>
          <pre></pre>
        </div>

        <p>
          <strong>Instructions:</strong> Fill out the form and submit it. The
          entire form submission (including clearing all fields) is treated as a
          single undoable action. Try submitting, then use the undo button to
          restore all form fields at once.
        </p>
      </div>

      <StateHistoryProvider
        storageKey="form-transaction-example"
        defaultPersistent={true}
      >
        <UserForm />
        <div style={{ marginTop: "20px" }}>
          <HistoryControls
            showPersistenceToggle={true}
            persistenceLabel="Persist Form Data"
          />
        </div>
      </StateHistoryProvider>
    </div>
  );
}
