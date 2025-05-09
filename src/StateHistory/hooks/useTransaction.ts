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
 * Hook for grouping multiple operations into a single undoable action
 *
 * @returns Object containing transaction methods
 * 
 * @example
 * // Simple usage with explicit begin/commit
 * const { beginTransaction, commitTransaction } = useTransaction();
 * beginTransaction("Edit multiple items");
 * // ... perform multiple state changes ...
 * commitTransaction();
 * 
 * @example
 * // Using the withTransaction helper for automatic commit/rollback
 * const { withTransaction } = useTransaction();
 * withTransaction(() => {
 *   // Any error here will automatically rollback all changes
 *   updateItem(item1);
 *   updateItem(item2);
 * }, "Update multiple items");
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
  
  // Track if we've registered the transaction command
  const isRegistered = useRef(false);

  // Register the transaction command type once
  useEffect(() => {
    if (!isRegistered.current && !hasCommand(TRANSACTION_COMMAND_TYPE)) {
      // Register the transaction command type
      registerCommand<TransactionCommandParams>(
        TRANSACTION_COMMAND_TYPE,
        // Execute function runs all commands in the transaction
        (params) => {
          if (params?.commands) {
            params.commands.forEach(cmd => {
              if (typeof cmd.execute === 'function') {
                cmd.execute();
              }
            });
          }
        },
        // Undo function reverses all commands in reverse order
        (params) => {
          if (params?.commands) {
            [...params.commands].reverse().forEach(cmd => {
              if (typeof cmd.undo === 'function') {
                cmd.undo();
              }
            });
          }
        }
      );
      isRegistered.current = true;
    }
  }, [registerCommand, hasCommand]);

  /**
   * Executes a function within a transaction, automatically handling commit/abort
   */
  const withTransaction = useCallback(
    (fn: () => void, description?: string) => {
      try {
        beginTransaction(description);
        fn();
        commitTransaction();
      } catch (error) {
        // Roll back all changes if an error occurs
        abortTransaction();
        console.error("Transaction aborted due to error:", error);
        throw error;
      }
    },
    [beginTransaction, commitTransaction, abortTransaction]
  );

  return {
    /**
     * Begin a new transaction to group multiple operations
     * @param description Optional description of the transaction
     */
    beginTransaction,

    /**
     * Commit the transaction as a single undoable operation
     */
    commitTransaction,

    /**
     * Abort and roll back all changes in the current transaction
     */
    abortTransaction,

    /**
     * Execute code within a transaction with automatic commit/rollback
     * @param fn Function to execute within the transaction
     * @param description Optional description of the transaction
     */
    withTransaction,

    /**
     * Whether a transaction is currently in progress
     */
    isTransactionInProgress,
  };
}
