/** @format */
import { useCallback } from "react";
import { useHistoryStateContext } from "../context/StateHistoryContext";

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
  } = useHistoryStateContext();

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
