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
 */
import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
  Controls,
  Node,
  Edge,
  Connection,
  OnNodesDelete
} from '@xyflow/react';
import {
  StateHistoryProvider,
  HistoryControls,
  useTrackableState
} from "../../StateHistory";
 
import '@xyflow/react/dist/style.css';
 
const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start here...' },
    position: { x: -150, y: 0 },
  },
  {
    id: '2',
    type: 'input',
    data: { label: '...or here!' },
    position: { x: 150, y: 0 },
  },
  { id: '3', data: { label: 'Delete me.' }, position: { x: 0, y: 100 } },
  { id: '4', data: { label: 'Then me!' }, position: { x: 0, y: 200 } },
  {
    id: '5',
    type: 'output',
    data: { label: 'End here!' },
    position: { x: 0, y: 300 },
  },
];
 
const initialEdges = [
  { id: '1->3', source: '1', target: '3' },
  { id: '2->3', source: '2', target: '3' },
  { id: '3->4', source: '3', target: '4' },
  { id: '4->5', source: '4', target: '5' },
];

// Internal flow component that handles the actual React Flow functionality
function FlowWithHistory() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  //Lets create a state for nodesBeforeDrag
  const [nodesBeforeDrag, setNodesBeforeDrag] = useState(nodes);


  // Use our StateHistory hooks to make node and edge changes trackable
  const trackNodesChange = useTrackableState(
    "flowNodes/update",
    setNodes
  );

  

  const trackEdgesChange = useTrackableState(
    "flowEdges/update",
    setEdges
  );

  const onNodeDragStart = useCallback(
    () => {
      // Store current nodes before the change
      setNodesBeforeDrag(nodes);
    
    },
    [setNodesBeforeDrag, nodes]
  );


  const onNodeDragStop = useCallback(
    () => { 
        // Store current nodes before the change
        trackNodesChange(
            nodes,
            nodesBeforeDrag,
            "Move nodes"
        );
    },
    [nodes, nodesBeforeDrag, trackNodesChange]
    );
 
  const onConnect = useCallback(
    (params: Connection) => {
      // Get current edges before the change
      const oldEdges = [...edges];
      // Create new edges by adding the connection
      const newEdges = addEdge(params, edges);
      // Track the change with our StateHistory hook
      trackEdgesChange(newEdges, oldEdges, "Connect nodes");
    },
    [edges, trackEdgesChange],
  );

  const onNodesDelete = useCallback<OnNodesDelete>(
    (deleted) => {
      // Store current state before changes
      const oldEdges = [...edges];

      // Calculate new edges with direct connections between incomers and outgoers
      const newEdges = deleted.reduce((acc: Edge[], node: Node) => {
        const incomers = getIncomers(node, nodes, edges);
        const outgoers = getOutgoers(node, nodes, edges);
        const connectedEdges = getConnectedEdges([node], edges);
 
        const remainingEdges = acc.filter(
          (edge) => !connectedEdges.includes(edge),
        );
 
        const createdEdges = incomers.flatMap(({ id: source }) =>
          outgoers.map(({ id: target }) => ({
            id: `${source}->${target}`,
            source,
            target,
          })),
        );
 
        return [...remainingEdges, ...createdEdges];
      }, edges);

      // Track changes to edges with our StateHistory hooks
      trackEdgesChange(newEdges, oldEdges, "Delete node connections");
    },
    [nodes, edges, trackEdgesChange],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onNodeDragStart={onNodeDragStart}
      onNodeDragStop={onNodeDragStop}
      onNodesDelete={onNodesDelete}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      attributionPosition="top-right"
      style={{ backgroundColor: "#F7F9FB" }}
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
}

// Wrapper component that provides StateHistory context
export default function Flow() {
  return (
    <div className="example-container">
      <h2>React Flow Integration Example</h2>
      <div className="description">
        <p>
          This example demonstrates integrating StateHistory with a third-party library
          (React Flow) to add undo/redo capabilities to node operations.
        </p>
        <p>
          Try moving nodes, connecting them, or deleting them, then use the undo/redo
          controls to revert or replay those changes.
        </p>
        <p className="note" style={{ fontSize: "0.9em", color: "#666" }}>
          Key point: The StateHistory library tracks node positions, connections, 
          and deletions independently of React Flow's internal state management.
        </p>
      </div>

      <StateHistoryProvider storageKey="react-flow-example">
        <div style={{ 
          width: '100%', 
          height: '500px', 
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '16px'
        }}>
          <FlowWithHistory />
        </div>
        <div style={{ marginTop: '12px' }}>
          <HistoryControls 
            showPersistenceToggle={true} 
            persistenceLabel="Persist Flow Layout"
          />
        </div>
      </StateHistoryProvider>
    </div>
  );
}