import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { User, Mail, Phone, FileText } from 'lucide-react';

interface PersonNodeProps {
  data: {
    label: string;
    displayName: string;
    email?: string;
    phone?: string;
    bio?: string;
    memoryCount: number;
    relationshipCount: number;
  };
  selected?: boolean;
}

export const PersonNode = memo(({ data, selected }: PersonNodeProps) => {
  return (
    <>
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />

      {/* Node content */}
      <div
        className={`
          px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[200px]
          transition-all duration-200
          ${
            selected
              ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
              : 'border-gray-300 hover:border-blue-400 hover:shadow-lg'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="font-semibold text-gray-900 truncate">{data.displayName}</div>
        </div>

        {/* Contact info */}
        {data.email && (
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
            <Mail className="h-3 w-3" />
            <span className="truncate">{data.email}</span>
          </div>
        )}
        {data.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
            <Phone className="h-3 w-3" />
            <span className="truncate">{data.phone}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-3 mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FileText className="h-3 w-3" />
            <span>
              {data.memoryCount} {data.memoryCount === 1 ? 'memory' : 'memories'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <span>
              {data.relationshipCount} {data.relationshipCount === 1 ? 'link' : 'links'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
});

PersonNode.displayName = 'PersonNode';
