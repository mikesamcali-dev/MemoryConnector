/**
 * Get theme colors based on sentiment analysis
 */
export interface SentimentTheme {
  surface: string;
  surfaceGradient: string;
  border: string;
  text: string;
  accent: string;
}

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'urgent';

export function getSentimentTheme(sentiment?: Sentiment, isDark = false): SentimentTheme {
  const themes: Record<Sentiment, { light: SentimentTheme; dark: SentimentTheme }> = {
    positive: {
      light: {
        surface: 'bg-emerald-50',
        surfaceGradient: 'from-emerald-50 to-green-50',
        border: 'border-emerald-200',
        text: 'text-emerald-900',
        accent: 'text-emerald-600',
      },
      dark: {
        surface: 'bg-emerald-950',
        surfaceGradient: 'from-emerald-950 to-green-950',
        border: 'border-emerald-800',
        text: 'text-emerald-100',
        accent: 'text-emerald-400',
      },
    },
    neutral: {
      light: {
        surface: 'bg-blue-50',
        surfaceGradient: 'from-blue-50 to-purple-50',
        border: 'border-blue-200',
        text: 'text-gray-900',
        accent: 'text-blue-600',
      },
      dark: {
        surface: 'bg-gray-900',
        surfaceGradient: 'from-gray-900 to-gray-800',
        border: 'border-gray-700',
        text: 'text-gray-100',
        accent: 'text-blue-400',
      },
    },
    negative: {
      light: {
        surface: 'bg-amber-50',
        surfaceGradient: 'from-amber-50 to-orange-50',
        border: 'border-amber-200',
        text: 'text-amber-900',
        accent: 'text-amber-600',
      },
      dark: {
        surface: 'bg-amber-950',
        surfaceGradient: 'from-amber-950 to-orange-950',
        border: 'border-amber-800',
        text: 'text-amber-100',
        accent: 'text-amber-400',
      },
    },
    urgent: {
      light: {
        surface: 'bg-red-50',
        surfaceGradient: 'from-red-50 to-rose-50',
        border: 'border-red-200',
        text: 'text-red-900',
        accent: 'text-red-600',
      },
      dark: {
        surface: 'bg-red-950',
        surfaceGradient: 'from-red-950 to-rose-950',
        border: 'border-red-800',
        text: 'text-red-100',
        accent: 'text-red-400',
      },
    },
  };

  const defaultSentiment = sentiment || 'neutral';
  return isDark ? themes[defaultSentiment].dark : themes[defaultSentiment].light;
}

/**
 * Map enrichment sentiment to our sentiment type
 */
export function mapEnrichmentSentiment(sentiment?: string): Sentiment {
  if (!sentiment) return 'neutral';

  const lower = sentiment.toLowerCase();
  if (lower.includes('positive') || lower.includes('happy') || lower.includes('excited')) {
    return 'positive';
  }
  if (lower.includes('negative') || lower.includes('sad') || lower.includes('angry')) {
    return 'negative';
  }
  if (lower.includes('urgent') || lower.includes('important') || lower.includes('critical')) {
    return 'urgent';
  }
  return 'neutral';
}
