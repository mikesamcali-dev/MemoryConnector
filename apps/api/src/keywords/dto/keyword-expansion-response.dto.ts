export class KeywordExpansionResponseDto {
  originalKeyword: string;
  expandedKeywords: string[];
  source: 'cached' | 'openai';
}
