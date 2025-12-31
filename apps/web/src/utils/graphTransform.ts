import { Node, Edge, MarkerType } from 'reactflow';
import { PersonRelationshipGraph } from '../api/admin';

export interface GraphNode extends Node {
  data: {
    label: string;
    displayName: string;
    email?: string;
    phone?: string;
    bio?: string;
    memoryCount: number;
    relationshipCount: number;
  };
}

export interface GraphEdge extends Omit<Edge, 'data'> {
  data?: {
    relationshipType: string;
    relationshipId: string;
  };
}

/**
 * Transform API response into React Flow nodes and edges
 */
export function transformToGraph(data: PersonRelationshipGraph): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  // Count relationships per person
  const relationshipCounts = new Map<string, number>();
  data.relationships.forEach((rel) => {
    relationshipCounts.set(rel.sourcePersonId, (relationshipCounts.get(rel.sourcePersonId) || 0) + 1);
    relationshipCounts.set(rel.targetPersonId, (relationshipCounts.get(rel.targetPersonId) || 0) + 1);
  });

  // Create nodes from people
  const nodes: GraphNode[] = data.people.map((person, index) => ({
    id: person.id,
    type: 'custom',
    position: calculatePosition(index, data.people.length),
    data: {
      label: person.displayName,
      displayName: person.displayName,
      email: person.email || undefined,
      phone: person.phone || undefined,
      bio: person.bio || undefined,
      memoryCount: person._count?.memories || 0,
      relationshipCount: relationshipCounts.get(person.id) || 0,
    },
  }));

  // Create edges from relationships
  const edges: GraphEdge[] = data.relationships.map((rel) => ({
    id: rel.id,
    source: rel.sourcePersonId,
    target: rel.targetPersonId,
    type: 'smoothstep',
    animated: false,
    label: rel.relationshipType,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
    },
    data: {
      relationshipType: rel.relationshipType,
      relationshipId: rel.id,
    },
    style: {
      stroke: '#6B7280',
      strokeWidth: 2,
    },
    labelStyle: {
      fill: '#374151',
      fontWeight: 500,
      fontSize: 12,
    },
    labelBgStyle: {
      fill: 'white',
      fillOpacity: 0.8,
    },
  }));

  return { nodes, edges };
}

/**
 * Calculate initial circular layout for nodes
 * This provides a better starting point than random positions
 */
function calculatePosition(index: number, total: number): { x: number; y: number } {
  const centerX = 400;
  const centerY = 300;
  const radius = Math.min(200 + total * 10, 500); // Scale radius with node count

  const angle = (2 * Math.PI * index) / total;

  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}
