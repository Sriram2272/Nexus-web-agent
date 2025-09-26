import { QueryType } from '@/types';

// Keywords for different query types
const CODING_KEYWORDS = [
  'algorithm', 'binary search', 'sorting', 'dp', 'dynamic programming', 
  'leetcode', 'hackerrank', 'dsa', 'data structure', 'tree', 'graph',
  'array', 'string', 'recursion', 'backtracking', 'greedy', 'bfs', 'dfs',
  'heap', 'stack', 'queue', 'linked list', 'hash table', 'sliding window',
  'two pointer', 'merge sort', 'quick sort', 'bubble sort', 'insertion sort',
  'selection sort', 'dijkstra', 'floyd', 'kruskal', 'prim', 'union find',
  'segment tree', 'fenwick tree', 'trie', 'suffix', 'kmp', 'rabin karp',
  'big o', 'time complexity', 'space complexity', 'optimize', 'efficient'
];

const RESEARCH_KEYWORDS = [
  'explain', 'research', 'detailed analysis', 'comprehensive', 'study',
  'what is', 'how does', 'why does', 'compare', 'difference between',
  'advantages', 'disadvantages', 'pros and cons', 'deep dive', 'tutorial',
  'guide', 'learn', 'understand', 'concept', 'theory', 'principle'
];

const PRODUCT_KEYWORDS = [
  'buy', 'price', 'cost', 'cheap', 'expensive', 'budget', 'under',
  'laptop', 'phone', 'tv', 'headphones', 'camera', 'watch', 'tablet',
  'speaker', 'keyboard', 'mouse', 'monitor', 'gaming', 'smartphone',
  'earbuds', 'charger', 'case', 'cover', 'accessories', 'electronics',
  'appliance', 'furniture', 'clothes', 'shoes', 'bag', 'book', 'toy'
];

/**
 * Detects the type of query based on keywords and patterns
 */
export function detectQueryType(query: string): QueryType {
  const lowerQuery = query.toLowerCase();
  
  // Check for coding-related queries
  const codingScore = CODING_KEYWORDS.reduce((score, keyword) => {
    return score + (lowerQuery.includes(keyword) ? 1 : 0);
  }, 0);
  
  // Check for research-related queries
  const researchScore = RESEARCH_KEYWORDS.reduce((score, keyword) => {
    return score + (lowerQuery.includes(keyword) ? 1 : 0);
  }, 0);
  
  // Check for product-related queries
  const productScore = PRODUCT_KEYWORDS.reduce((score, keyword) => {
    return score + (lowerQuery.includes(keyword) ? 1 : 0);
  }, 0);
  
  // Additional pattern matching
  const hasPricePattern = /(\$|₹|€|£|\d+k?|\bundar?\b)/i.test(lowerQuery);
  const hasCodePattern = /(function|class|algorithm|solution|code|implement)/i.test(lowerQuery);
  const hasQuestionPattern = /(what|how|why|explain|tell me about)/i.test(lowerQuery);
  
  // Decision logic
  if (codingScore > 0 || hasCodePattern) {
    return 'coding';
  }
  
  if (productScore > 0 || hasPricePattern) {
    return 'product';
  }
  
  if (researchScore > 1 || hasQuestionPattern) {
    return 'research';
  }
  
  return 'general';
}

/**
 * Gets suggested AI tool modes based on query type
 */
export function getSuggestedAIMode(queryType: QueryType): string[] {
  switch (queryType) {
    case 'coding':
      return ['coding', 'study'];
    case 'research':
      return ['research', 'study'];
    case 'product':
      return ['quick', 'research'];
    default:
      return ['quick'];
  }
}