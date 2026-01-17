// Curated concept mappings for keyword expansion
export const conceptMappingsSeed = [
  // Political & Governance
  {
    term: 'fascist',
    normalizedTerm: 'fascist',
    domains: ['political ideology', 'governance', 'authoritarianism'],
    relatedKeywords: ['totalitarianism', 'nationalism'],
    source: 'static' as const,
    confidence: 1.0,
  },
  {
    term: 'democracy',
    normalizedTerm: 'democracy',
    domains: ['political system', 'governance'],
    relatedKeywords: ['representation', 'suffrage'],
    source: 'static' as const,
    confidence: 1.0,
  },
  {
    term: 'capitalism',
    normalizedTerm: 'capitalism',
    domains: ['economic system', 'markets'],
    relatedKeywords: ['free market', 'private property'],
    source: 'static' as const,
    confidence: 1.0,
  },
  {
    term: 'socialism',
    normalizedTerm: 'socialism',
    domains: ['economic system', 'equality'],
    relatedKeywords: ['collective ownership', 'redistribution'],
    source: 'static' as const,
    confidence: 1.0,
  },

  // Philosophy & Thought
  {
    term: 'empiricism',
    normalizedTerm: 'empiricism',
    domains: ['philosophy', 'epistemology'],
    relatedKeywords: ['observation', 'experience'],
    source: 'static' as const,
    confidence: 1.0,
  },
  {
    term: 'rationalism',
    normalizedTerm: 'rationalism',
    domains: ['philosophy', 'epistemology'],
    relatedKeywords: ['reason', 'innate ideas'],
    source: 'static' as const,
    confidence: 1.0,
  },
  {
    term: 'existentialism',
    normalizedTerm: 'existentialism',
    domains: ['philosophy', 'human existence'],
    relatedKeywords: ['freedom', 'authenticity'],
    source: 'static' as const,
    confidence: 1.0,
  },
  {
    term: 'pragmatism',
    normalizedTerm: 'pragmatism',
    domains: ['philosophy', 'practical application'],
    relatedKeywords: ['utility', 'consequences'],
    source: 'static' as const,
    confidence: 1.0,
  },

  // Science & Method
  {
    term: 'hypothesis',
    normalizedTerm: 'hypothesis',
    domains: ['scientific method', 'investigation'],
    relatedKeywords: ['prediction', 'testable'],
    source: 'static' as const,
    confidence: 1.0,
  },
  {
    term: 'theory',
    normalizedTerm: 'theory',
    domains: ['scientific framework', 'explanation'],
    relatedKeywords: ['model', 'framework'],
    source: 'static' as const,
    confidence: 1.0,
  },
  {
    term: 'paradigm',
    normalizedTerm: 'paradigm',
    domains: ['conceptual framework', 'worldview'],
    relatedKeywords: ['model', 'perspective'],
    source: 'static' as const,
    confidence: 1.0,
  },

  // Psychology
  {
    term: 'cognition',
    normalizedTerm: 'cognition',
    domains: ['psychology', 'mental processes'],
    relatedKeywords: ['perception', 'reasoning'],
    source: 'static' as const,
    confidence: 1.0,
  },
  {
    term: 'narcissism',
    normalizedTerm: 'narcissism',
    domains: ['psychology', 'personality'],
    relatedKeywords: ['self-absorption', 'grandiosity'],
    source: 'static' as const,
    confidence: 1.0,
  },

  // Technology
  {
    term: 'algorithm',
    normalizedTerm: 'algorithm',
    domains: ['computer science', 'procedures'],
    relatedKeywords: ['computation', 'procedure'],
    source: 'static' as const,
    confidence: 1.0,
  },
  {
    term: 'blockchain',
    normalizedTerm: 'blockchain',
    domains: ['technology', 'distributed systems'],
    relatedKeywords: ['decentralization', 'ledger'],
    source: 'static' as const,
    confidence: 1.0,
  },
];
