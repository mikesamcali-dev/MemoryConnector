import { useQuery } from '@tanstack/react-query';
import { getAICostTracking, getCircuitBreakerStatus } from '../api/admin';
import { DollarSign, TrendingUp, Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export function AICostsPage() {
  const { data: costs, isLoading: costsLoading, error: costsError } = useQuery({
    queryKey: ['admin', 'ai-costs'],
    queryFn: getAICostTracking,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: circuitBreaker, isLoading: cbLoading } = useQuery({
    queryKey: ['admin', 'circuit-breaker'],
    queryFn: getCircuitBreakerStatus,
    refetchInterval: 10000,
  });

  if (costsLoading || cbLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading AI cost data...</div>
      </div>
    );
  }

  if (costsError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Error loading AI costs: {costsError.message}</div>
      </div>
    );
  }

  if (!costs || !circuitBreaker) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No cost data available</div>
      </div>
    );
  }

  const getCircuitStateColor = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return 'green';
      case 'QUEUE_ONLY':
        return 'yellow';
      case 'OPEN':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getCircuitStateIcon = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'QUEUE_ONLY':
        return <AlertCircle className="h-6 w-6 text-yellow-600" />;
      case 'OPEN':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Activity className="h-6 w-6 text-gray-600" />;
    }
  };

  const stateColor = getCircuitStateColor(circuitBreaker.state);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <DollarSign className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Cost Tracking</h1>
            <p className="text-sm text-gray-500">Monitor AI API usage and spending</p>
          </div>
        </div>
      </div>

      {/* Circuit Breaker Status */}
      <div className={`bg-${stateColor}-50 border-2 border-${stateColor}-200 rounded-lg p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getCircuitStateIcon(circuitBreaker.state)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Circuit Breaker Status</h3>
              <p className="text-sm text-gray-600 mt-1">
                {circuitBreaker.state === 'CLOSED' && 'All systems operational - AI requests flowing normally'}
                {circuitBreaker.state === 'QUEUE_ONLY' && 'Budget threshold reached - requests queued for tomorrow'}
                {circuitBreaker.state === 'OPEN' && 'Circuit open - AI requests blocked due to budget limit'}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 bg-${stateColor}-100 rounded-lg`}>
            <span className={`text-lg font-bold text-${stateColor}-900`}>{circuitBreaker.state}</span>
          </div>
        </div>
      </div>

      {/* Daily Spend Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Daily Spend */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Daily Spend</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${(costs.dailySpend.totalCents / 100).toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Budget Usage */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Budget Used</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {costs.dailySpend.percentUsed.toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                costs.dailySpend.percentUsed > 90
                  ? 'bg-red-500'
                  : costs.dailySpend.percentUsed > 70
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(costs.dailySpend.percentUsed, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Operations Count */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Operations</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {costs.dailySpend.operationCount.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Costs by Operation */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Today's Costs by Operation Type</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Cost
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {costs.todayCostsByOperation.map((op, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{op.operation}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{op.count.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{op.totalTokens.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      ${(op.totalCents / 100).toFixed(4)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      ${op.count > 0 ? (op.totalCents / 100 / op.count).toFixed(4) : '0.0000'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {costs.todayCostsByOperation.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No AI operations today</p>
          </div>
        )}
      </div>

      {/* Recent Operations */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent AI Operations (Last 20)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {costs.recentOperations.map((op) => (
                <tr key={op.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {new Date(op.date).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{op.operation}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{op.model}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{op.tokensUsed.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      ${(op.costCents / 100).toFixed(4)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {costs.recentOperations.length === 0 && (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No recent operations</p>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About AI Cost Tracking</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Costs are tracked in real-time for all AI operations (embeddings, enrichment, etc.)</li>
          <li>• Circuit breaker automatically manages budget to prevent overspending</li>
          <li>• Daily budget resets at midnight server time</li>
          <li>• All costs are in USD and include OpenAI API charges</li>
        </ul>
      </div>
    </div>
  );
}
