import { useCallback, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  Panel,
  NodeMouseHandler,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeft, Network, AlertCircle, Loader2 } from 'lucide-react';
import { getAllRelationshipsGraph } from '../api/admin';
import { transformToGraph } from '../utils/graphTransform';
import { PersonNode } from '../components/PersonNode';

// Define custom node types
const nodeTypes: NodeTypes = {
  custom: PersonNode,
};

export function RelationshipGraphPage() {
  const navigate = useNavigate();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Fetch graph data
  const { data: graphData, isLoading, error } = useQuery({
    queryKey: ['relationshipGraph'],
    queryFn: getAllRelationshipsGraph,
  });

  // React Flow state management
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update nodes/edges when data loads
  useEffect(() => {
    if (graphData) {
      const { nodes: newNodes, edges: newEdges } = transformToGraph(graphData);
      setNodes(newNodes);
      setEdges(newEdges as any);
    }
  }, [graphData, setNodes, setEdges]);

  // Handle node click - select node
  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Handle connection creation (optional - for future enhancement)
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading relationship graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/app/people')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to People
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Error Loading Graph</h3>
          </div>
          <p className="text-red-700">
            {error instanceof Error ? error.message : 'Failed to load relationship graph'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/app/people')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to People
        </button>

        <div className="flex items-center gap-3">
          <Network className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relationship Network</h1>
            <p className="text-gray-600">
              {graphData?.people.length || 0} people, {graphData?.relationships.length || 0}{' '}
              relationships
            </p>
          </div>
        </div>
      </div>

      {/* Graph Container */}
      <div
        className="bg-white rounded-lg border border-gray-200 shadow-sm"
        style={{ height: 'calc(100% - 8rem)' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          minZoom={0.1}
          maxZoom={2}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => (node.id === selectedNodeId ? '#3B82F6' : '#D1D5DB')}
            maskColor="rgba(0, 0, 0, 0.1)"
          />

          {/* Help Panel */}
          <Panel position="top-right" className="bg-white rounded-lg shadow-md p-4 max-w-xs">
            <h3 className="font-semibold text-gray-900 mb-2">How to Use</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Drag nodes to reposition</li>
              <li>• Scroll to zoom in/out</li>
              <li>• Click node to select</li>
              <li>• Use controls for navigation</li>
            </ul>
          </Panel>

          {/* Empty state */}
          {nodes.length === 0 && (
            <Panel position="top-center" className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-center">
                <Network className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">No Relationships Yet</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Create people and relationships to see the network graph
                </p>
                <button
                  onClick={() => navigate('/app/people')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Go to People Manager
                </button>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}
