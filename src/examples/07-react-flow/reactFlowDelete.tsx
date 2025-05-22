/**
 * React Flow Integration Example
 *
 * This example demonstrates how to use the StateHistory library
 * with React Flow to add undo/redo capabilities to node operations.
 *
 * Key concepts demonstrated:
 * - Using StateHistory with a third-party library (React Flow)
 * - Creating custom commands for complex operations
 * - Managing external state with useTrackableState
 * - Using transactions to group related operations into single undo steps
 */
import { useCallback, useState, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Node,
  Edge,
  Connection,
  useKeyPress,
  useOnSelectionChange,
  ReactFlowProvider,
} from "@xyflow/react";
import {
  StateHistoryProvider,
  HistoryControls,
  useTrackableState,
  useLatestState,
  useHistoryStateContext,
  useTransaction,
} from "../../StateHistory";

import "@xyflow/react/dist/style.css";

// Define the initial nodes array
const initialNodes = [
  {
    id: "1",
    type: "input",
    data: { label: "Start here..." },
    position: { x: -150, y: 0 },
  },
  {
    id: "2",
    type: "input",
    data: { label: "...or here!" },
    position: { x: 150, y: 0 },
  },
  { id: "3", data: { label: "Delete me." }, position: { x: 0, y: 100 } },
  { id: "4", data: { label: "Then me!" }, position: { x: 0, y: 200 } },
  {
    id: "5",
    type: "output",
    data: { label: "End here!" },
    position: { x: 0, y: 300 },
  },
];

// Infer the node type from initialNodes
type FlowNode = (typeof initialNodes)[number];

const initialEdges = [
  { id: "1->3", source: "1", target: "3" },
  { id: "2->3", source: "2", target: "3" },
  { id: "3->4", source: "3", target: "4" },
  { id: "4->5", source: "4", target: "5" },
];

// Internal flow component that handles the actual React Flow functionality
function FlowWithHistory() {
  // Get the latest persisted states if available, otherwise use initialNodes/initialEdges
  const latestNodeState = useLatestState<FlowNode[]>("flowNodes/update");
  const latestEdgeState = useLatestState<Edge[]>("flowEdges/update");
  const { initialStateLoaded } = useHistoryStateContext();

  // Get transaction API from our new hook
  const { withTransaction } = useTransaction();

  // Use the type from initialNodes for useNodesState
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Store nodes before drag with the type from nodes
  const [nodesBeforeDrag, setNodesBeforeDrag] = useState(nodes);

  // References to track initial load
  const isInitialLoad = useRef(true);

  // Track if delete key is pressed using React Flow's hook
  const deleteKeyPressed = useKeyPress("Delete");
  // Track if backspace key is pressed
  const backspaceKeyPressed = useKeyPress("Backspace");

  // Reference to ReactFlow container for focus handling
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Use a ref instead of state to prevent infinite update loops
  const selectedNodesRef = useRef<Node[]>([]);
  // Track selected edges with a ref to prevent infinite update loops
  const selectedEdgesRef = useRef<Edge[]>([]);

  // Use our StateHistory hooks to make node and edge changes trackable
  const trackNodesChange = useTrackableState("flowNodes/updateNodes", setNodes, setNodes);

  const trackEdgesChange = useTrackableState("flowEdges/updateEdges", setEdges, setEdges);

  const handleNodesChange = (changes: any) => {
    // Handle node changes and track them
    //trackNothingChange(!nothing, nothing, "Node changes");
    onNodesChange(changes);
  }
  // Track node and edge selection changes using ref to avoid infinite loops
  useOnSelectionChange({
    onChange: ({ nodes: selectedNodes, edges: selectedEdges }) => {
      // Update the refs instead of state to avoid re-renders
      selectedNodesRef.current = selectedNodes;
      selectedEdgesRef.current = selectedEdges;
    },
  });



  const handleDelete = useCallback(() => {
    const hasSelectedNodes = selectedNodesRef.current.length > 0;
    const hasSelectedEdges = selectedEdgesRef.current.length > 0;
    // Only start a transaction if there's something to delete
    
    if (hasSelectedNodes || hasSelectedEdges) {
      // Use the withTransaction helper to group the operations
      withTransaction(() => {
        // Handle node deletion if needed
        const deletedNodeIds = selectedNodesRef.current.map(node => node.id);
        if (hasSelectedNodes) {
          const oldNodes = [...nodes];

          // Filter out the selected nodes to create new nodes array
          const newNodes = nodes.filter(
            (node) =>
              !selectedNodesRef.current.some(
                (selectedNode) => selectedNode.id === node.id
              )
          );

          // Track the node deletion with our StateHistory hook
          trackNodesChange(newNodes, oldNodes, "Delete nodes");
          selectedNodesRef.current = [];
        }
        const oldEdges = [...edges];

        // Filter out edges connected to deleted nodes (and those that are not selected)
        const newEdges = edges.filter(
          (edge) =>
            !deletedNodeIds.includes(edge.source) &&
            !deletedNodeIds.includes(edge.target) &&
            !selectedEdgesRef.current.some(
              (selectedEdge) => selectedEdge.id === edge.id
            )
        );

        // Only track edge changes if edges were actually affected
        if (newEdges.length !== oldEdges.length) {
          trackEdgesChange(newEdges, oldEdges, "Delete edges");
        }

        // Clear selection after deletion to prevent attempting to delete again
        selectedEdgesRef.current = [];

      }, "Delete selection"); // Provide a meaningful description for the transaction
    }
  }, [
    nodes,
    edges,
    trackNodesChange,
    trackEdgesChange,
    withTransaction,
  ]);


  useEffect(() => {
    // Only set the nodes and edges if we are not in the middle of an initial load
    if (initialStateLoaded && isInitialLoad.current) {
      isInitialLoad.current = false; // Set to false after the first load
      if (latestNodeState) {
        setNodes(latestNodeState);
      }
      if (latestEdgeState) {
        setEdges(latestEdgeState as Edge[]);
      }
    }
  }, [
    latestNodeState,
    latestEdgeState,
    setNodes,
    setEdges,
    initialStateLoaded,
  ]);

  // Handle delete key press to remove selected nodes and edges
  useEffect(() => {
    if (deleteKeyPressed || backspaceKeyPressed) {

      handleDelete();

    }
  }, [
    deleteKeyPressed,
    backspaceKeyPressed,
    handleDelete,

  ]);

  const onNodeDragStart = useCallback(() => {
    // Store current nodes before the change
    setNodesBeforeDrag(nodes);
  }, [setNodesBeforeDrag, nodes]);

  const onNodeDragStop = useCallback(() => {
    // Store current nodes before the change
    trackNodesChange(nodes, nodesBeforeDrag, "Move nodes");
  }, [nodes, nodesBeforeDrag, trackNodesChange]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Get current edges before the change
      const oldEdges = [...edges];
      // Create new edges by adding the connection
      const newEdges = addEdge(params, edges);
      // Track the change with our StateHistory hook
      trackEdgesChange(newEdges, oldEdges, "Connect nodes");
    },
    [edges, trackEdgesChange]
  );

  return (
    <div ref={reactFlowWrapper} style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onNodesDelete={handleDelete}
        onEdgesDelete={handleDelete}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="top-right"
        style={{ backgroundColor: "#F7F9FB" }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

// Wrapper component that provides StateHistory context
export default function Flow() {
  return (
    <div className="example-container">
      <h2>React Flow Integration Example</h2>
      <div className="description">
        <p>
          This example demonstrates integrating StateHistory with a complex
          third-party library (React Flow) to add undo/redo capabilities to a
          visual node editor.
        </p>
        <p>
          <strong>Advanced Features Demonstrated:</strong>
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
          <li>
            <strong>Complex State Structure:</strong> Managing both nodes and
            edges simultaneously, unlike simpler examples that track only
            primitive values
          </li>
          <li>
            <strong>User Events Integration:</strong> Capturing interactions
            like node deletion, connection, and drag operations as undoable
            commands
          </li>
          <li>
            <strong>Multiple State Tracking:</strong> Using separate command
            types for nodes and edges while maintaining a single coherent
            history
          </li>
          <li>
            <strong>Transaction API:</strong> Grouping related operations (like
            deleting both nodes and edges) into a single undoable action
          </li>
          <li>
            <strong>useLatestState:</strong> Retrieving persistent state
            specifically for third-party library integration
          </li>
          <li>
            <strong>Ref-based Selection:</strong> Using refs to track selections
            without creating unnecessary rerenders or history entries
          </li>
        </ul>
        <p>
          Try selecting both nodes and edges, then press Delete. Notice how a
          single undo operation restores everything, thanks to the Transaction
          API.
        </p>
        <p className="note" style={{ fontSize: "0.9em", color: "#666" }}>
          <strong>Key insight:</strong> This example shows how StateHistory can
          integrate with any complex UI library by tracking state changes at the
          right moments, even when those libraries have their own internal state
          management.
        </p>
      </div>

      <StateHistoryProvider
        storageKey="react-flow-example"
        defaultPersistent={true}
      >
        <div
          style={{
            width: "100%",
            height: "500px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            overflow: "hidden",
            marginBottom: "16px",
          }}
        >
          <ReactFlowProvider>
            <FlowWithHistory />
          </ReactFlowProvider>
        </div>
        <div style={{ marginTop: "12px" }}>
          <HistoryControls
            showPersistenceToggle={true}
            persistenceLabel="Persist Flow Layout"
          />
        </div>
      </StateHistoryProvider>
    </div>
  );
}
