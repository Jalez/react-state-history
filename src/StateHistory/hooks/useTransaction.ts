/** @format */
import { useCallback, useEffect, useRef } from "react";
import { useHistoryStateContext } from "../context/StateHistoryContext";
import { StateChange } from "../types";

// Define the transaction command type
const TRANSACTION_COMMAND_TYPE = "transaction";

// Define the type for transaction command parameters
interface TransactionCommandParams {
  commands: StateChange[];
}

/**
 * Hook for managing transactions to group multiple operations into a single undoable action
 *
 * @returns Transaction control methods
 */
export function useTransaction() {
  const {
    beginTransaction,
    commitTransaction,
    abortTransaction,
    isTransactionInProgress,
    registerCommand,
    hasCommand
  } = useHistoryStateContext();
  
  // Track if we've registered the command
  const isRegistered = useRef(false);

  // Register the transaction command type when the hook is initialized
  useEffect(() => {
    if (!isRegistered.current && !hasCommand(TRANSACTION_COMMAND_TYPE)) {
      // Register the transaction command type
      registerCommand<TransactionCommandParams>(
        TRANSACTION_COMMAND_TYPE,
        (params) => {
          // The execute function executes all commands in the buffer
          // Make sure each command has an execute method
          if (params && params.commands) {
            params.commands.forEach(cmd => {
              if (cmd && typeof cmd.execute === 'function') {
                cmd.execute();
              } else {
                console.warn('Transaction command missing execute method:', cmd);
              }
            });
          }
        },
        (params) => {
          // The undo function undoes all commands in reverse order
          // Make sure each command has an undo method
          if (params && params.commands) {
            [...params.commands].reverse().forEach(cmd => {
              if (cmd && typeof cmd.undo === 'function') {
                cmd.undo();
              } else {
                console.warn('Transaction command missing undo method:', cmd);
              }
            });
          }
        }
      );
      isRegistered.current = true;
    }
  }, [registerCommand, hasCommand]);

  /**
   * Executes a function within a transaction context
   * All state changes made during the function will be grouped into a single undoable operation
   *
   * @param fn Function to execute within the transaction
   * @param description Optional description for the transaction
   */
  const withTransaction = useCallback(
    (fn: () => void, description?: string) => {
      try {
        beginTransaction(description);
        fn();
        commitTransaction();
      } catch (error) {
        // If an error occurs, abort the transaction
        // This will automatically roll back all state changes made during the transaction
        abortTransaction();
        console.error("Transaction aborted due to error:", error);
        throw error;
      }
    },
    [beginTransaction, commitTransaction, abortTransaction]
  );

  return {
    /**
     * Begin a new transaction. State changes during a transaction will be grouped
     * into a single undoable operation when committed.
     *
     * @param description Optional description for the transaction
     */
    beginTransaction,

    /**
     * Commit all changes in the current transaction as a single undoable operation.
     * This adds the composite operation to the undo stack.
     */
    commitTransaction,

    /**
     * Abort the current transaction, discarding it from the undo history.
     * This automatically rolls back all state changes made during the transaction.
     */
    abortTransaction,

    /**
     * Helper method to execute code within a transaction.
     * If the function throws an error, the transaction will be aborted
     * and all state changes will be automatically rolled back.
     */
    withTransaction,

    /**
     * Boolean flag indicating if a transaction is currently in progress
     */
    isTransactionInProgress,
  };
}
