export function UsageLimitsPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Usage & Limits</h1>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-gray-700">
          Usage limits tracking is coming soon. Check back later to view your memory limits and usage statistics.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          In the meantime, you can view your usage via the API: <code className="bg-gray-100 px-2 py-1 rounded">GET /api/v1/usage</code>
        </p>
      </div>
    </div>
  );
}
