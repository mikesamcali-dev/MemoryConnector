import { useQuery } from '@tanstack/react-query';
import { getExtractionData, ExtractionData } from '../api/admin';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, User, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ExtractionDataPage() {
  const { data: extractionData, isLoading, error } = useQuery({
    queryKey: ['extraction-data'],
    queryFn: getExtractionData,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading extraction data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading extraction data: {error.message}</p>
        </div>
      </div>
    );
  }

  const memoriesWithExtraction = extractionData?.filter(m => m.hasExtraction) || [];
  const memoriesWithoutExtraction = extractionData?.filter(m => !m.hasExtraction) || [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/app/admin"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">LLM Extraction Data</h1>
        <p className="text-gray-600 mt-2">
          Monitor AI entity extraction across all memories (last 100 enriched)
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Enriched</div>
          <div className="text-2xl font-bold text-gray-900">{extractionData?.length || 0}</div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-700 mb-1 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            With Extraction
          </div>
          <div className="text-2xl font-bold text-green-900">{memoriesWithExtraction.length}</div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-700 mb-1 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Without Extraction
          </div>
          <div className="text-2xl font-bold text-yellow-900">{memoriesWithoutExtraction.length}</div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-700 mb-1">Avg Entities/Memory</div>
          <div className="text-2xl font-bold text-blue-900">
            {memoriesWithExtraction.length > 0
              ? (
                  memoriesWithExtraction.reduce(
                    (sum, m) =>
                      sum +
                      (m.extractionSummary?.personCount || 0) +
                      (m.extractionSummary?.eventCount || 0) +
                      (m.extractionSummary?.locationCount || 0),
                    0
                  ) / memoriesWithExtraction.length
                ).toFixed(1)
              : '0'}
          </div>
        </div>
      </div>

      {/* Memories List */}
      <div className="space-y-4">
        {extractionData && extractionData.length > 0 ? (
          extractionData.map((memory) => (
            <MemoryExtractionCard key={memory.id} memory={memory} />
          ))
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">No Extraction Data Yet</h3>
            <p className="text-blue-700 mb-4">
              Create a new memory to see automatic entity extraction in action!
            </p>
            <div className="text-sm text-blue-600 text-left max-w-md mx-auto">
              <p className="font-medium mb-2">The system will automatically extract:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Person names (with fuzzy matching: Mike = Michael)</li>
                <li>Location names (with auto-enrichment)</li>
                <li>Meaningful words (with definitions and examples)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MemoryExtractionCard({ memory }: { memory: ExtractionData }) {
  const hasExtraction = memory.hasExtraction;
  const extraction = memory.extractionData;

  return (
    <div
      className={`border-2 rounded-lg p-6 ${
        hasExtraction
          ? 'bg-white border-green-200'
          : 'bg-gray-50 border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">
              {memory.title || 'Untitled'}
            </h3>
            {hasExtraction ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <p className="text-sm text-gray-600">{memory.body}</p>
          <p className="text-xs text-gray-500 mt-1">
            {memory.userEmail} • {new Date(memory.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Extraction Summary */}
      {hasExtraction && memory.extractionSummary && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-purple-50 border border-purple-200 rounded px-3 py-2">
            <div className="flex items-center gap-1 text-purple-700 mb-1">
              <User className="h-4 w-4" />
              <span className="text-xs font-medium">Persons</span>
            </div>
            <div className="text-lg font-bold text-purple-900">
              {memory.extractionSummary.personCount}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
            <div className="flex items-center gap-1 text-blue-700 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Events</span>
            </div>
            <div className="text-lg font-bold text-blue-900">
              {memory.extractionSummary.eventCount}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded px-3 py-2">
            <div className="flex items-center gap-1 text-green-700 mb-1">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium">Locations</span>
            </div>
            <div className="text-lg font-bold text-green-900">
              {memory.extractionSummary.locationCount}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
            <div className="flex items-center gap-1 text-yellow-700 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Follow-ups</span>
            </div>
            <div className="text-lg font-bold text-yellow-900">
              {memory.extractionSummary.followUpCount}
            </div>
          </div>
        </div>
      )}

      {/* Linked Entities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Person */}
        {memory.linkedPerson && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-xs text-purple-700 font-medium mb-1">Linked Person</div>
            <div className="font-semibold text-purple-900">{memory.linkedPerson.displayName}</div>
            {memory.linkedPerson.email && (
              <div className="text-xs text-purple-700">{memory.linkedPerson.email}</div>
            )}
          </div>
        )}

        {/* Location */}
        {memory.linkedLocation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-green-700 font-medium mb-1">Linked Location</div>
            <div className="font-semibold text-green-900">{memory.linkedLocation.name}</div>
            {memory.linkedLocation.city && (
              <div className="text-xs text-green-700">
                {[memory.linkedLocation.city, memory.linkedLocation.address]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Event */}
        {memory.linkedEvent && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-700 font-medium mb-1">Event Details</div>
            {memory.linkedEvent.startAt && (
              <div className="text-sm text-blue-900">
                {new Date(memory.linkedEvent.startAt).toLocaleString()}
              </div>
            )}
            {memory.linkedEvent.description && (
              <div className="text-xs text-blue-700 mt-1 line-clamp-2">
                {memory.linkedEvent.description}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Raw Extraction Data (Collapsible) */}
      {hasExtraction && extraction && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
            View Raw Extraction Data
          </summary>
          <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
            {JSON.stringify(extraction, null, 2)}
          </pre>
        </details>
      )}

      {/* No Extraction Warning */}
      {!hasExtraction && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ No extraction data found. This memory may have been enriched before LLM extraction was
            enabled, or the extraction failed.
          </p>
        </div>
      )}
    </div>
  );
}
