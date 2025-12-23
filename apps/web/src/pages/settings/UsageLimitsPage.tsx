import { useEffect, useState } from 'react';
import { Card, Progress, Button, Alert } from '@/components/ui';
import { api } from '@/lib/api';

interface UsageData {
  tier: string;
  memories_today: number;
  memories_this_month: number;
  images_this_month: number;
  voice_this_month: number;
  searches_today: number;
  storage_bytes: number;
  memories_per_day: number;
  memories_per_month: number;
  images_per_month: number;
  voice_per_month: number;
  searches_per_day: number;
  storage_limit: number;
}

export function UsageLimitsPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await api.get('/usage');
      setUsage(response.data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!usage) {
    return <div className="p-6">Failed to load usage data</div>;
  }

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `{mb.toFixed(1)} MB`;
    return `{(mb / 1024).toFixed(2)} GB`;
  };

  const getPercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const isUnlimited = (limit: number) => limit === -1;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Usage & Limits</h1>
        {usage.tier === 'free' && (
          <Button variant="primary" onClick={() => window.location.href = '/settings/upgrade'}>
            Upgrade to Premium
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Tier Badge */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Current Plan</h3>
              <p className="text-sm text-gray-600">
                {usage.tier === 'premium' ? 'Premium' : 'Free Tier'}
              </p>
            </div>
            <span className={`badge `+(usage.tier === 'premium' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800')}>
              {usage.tier.toUpperCase()}
            </span>
          </div>
        </Card>

        {/* Memories - Daily */}
        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Memories Today</h3>
          <Progress 
            value={getPercentage(usage.memories_today, usage.memories_per_day)} 
            className="mb-2"
          />
          <p className="text-sm text-gray-600">
            {usage.memories_today} / {isUnlimited(usage.memories_per_day) ? 'Unlimited' : usage.memories_per_day}
            <span className="ml-2 text-xs">Resets at midnight</span>
          </p>
        </Card>

        {/* Memories - Monthly */}
        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Memories This Month</h3>
          <Progress 
            value={getPercentage(usage.memories_this_month, usage.memories_per_month)} 
            className="mb-2"
          />
          <p className="text-sm text-gray-600">
            {usage.memories_this_month} / {isUnlimited(usage.memories_per_month) ? 'Unlimited' : usage.memories_per_month}
            <span className="ml-2 text-xs">Resets monthly</span>
          </p>
        </Card>

        {/* Images */}
        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Images This Month</h3>
          <Progress 
            value={getPercentage(usage.images_this_month, usage.images_per_month)} 
            className="mb-2"
          />
          <p className="text-sm text-gray-600">
            {usage.images_this_month} / {isUnlimited(usage.images_per_month) ? 'Unlimited' : usage.images_per_month}
          </p>
        </Card>

        {/* Voice */}
        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Voice Recordings This Month</h3>
          <Progress 
            value={getPercentage(usage.voice_this_month, usage.voice_per_month)} 
            className="mb-2"
          />
          <p className="text-sm text-gray-600">
            {usage.voice_this_month} / {isUnlimited(usage.voice_per_month) ? 'Unlimited' : usage.voice_per_month}
          </p>
        </Card>

        {/* Searches */}
        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Searches Today</h3>
          <Progress 
            value={getPercentage(usage.searches_today, usage.searches_per_day)} 
            className="mb-2"
          />
          <p className="text-sm text-gray-600">
            {usage.searches_today} / {isUnlimited(usage.searches_per_day) ? 'Unlimited' : usage.searches_per_day}
            <span className="ml-2 text-xs">Resets at midnight</span>
          </p>
        </Card>

        {/* Storage */}
        <Card className="p-4">
          <h3 className="text-md font-semibold mb-2">Storage Used</h3>
          <Progress 
            value={getPercentage(usage.storage_bytes, usage.storage_limit)} 
            className="mb-2"
          />
          <p className="text-sm text-gray-600">
            {formatBytes(usage.storage_bytes)} / {formatBytes(usage.storage_limit)}
          </p>
        </Card>

        {usage.tier === 'free' && (
          <Alert variant="info">
            <p className="font-semibold">Need more?</p>
            <p className="text-sm">Upgrade to Premium for unlimited memories, more images, and 10GB storage.</p>
            <Button variant="link" className="mt-2" onClick={() => window.location.href = '/settings/upgrade'}>
              View Premium Benefits →
            </Button>
          </Alert>
        )}
      </div>
    </div>
  );
}
