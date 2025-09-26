import { SearchResult, SearchTrace, SearchHistory, DemoStep, CodingResult, AIResponse, AIToolMode } from "@/types";

export const mockSearchResults: SearchResult[] = [
  {
    id: "1",
    title: "Samsung 32\" Smart LED TV - Crystal UHD 4K",
    price: 24999,
    originalPrice: 32999,
    currency: "₹",
    rating: 4.3,
    reviewCount: 2847,
    seller: "Samsung Official Store",
    sellerRating: 4.8,
    shipping: "Free delivery by tomorrow",
    availability: "In Stock",
    warranty: "2 years comprehensive warranty",
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&h=300&fit=crop",
    productUrl: "#",
    source: "Flipkart",
    aiScore: 9.2,
    aiReason: "Excellent price-to-feature ratio with official warranty, fast shipping, and high seller credibility.",
    trace: [
      {
        id: "t1",
        step: 1,
        action: "Navigate to Flipkart",
        description: "Visited Flipkart homepage and initiated search",
        screenshot: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop",
        domSnippet: '<input type="text" class="search-input" placeholder="Search for products">',
        timestamp: "2024-01-15T10:30:15Z",
        success: true,
        details: "Successfully loaded Flipkart homepage in 1.2s"
      },
      {
        id: "t2",
        step: 2,
        action: "Search Query",
        description: "Entered search term '32 inch TV' and clicked search",
        screenshot: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop",
        domSnippet: '<button class="search-btn">Search</button>',
        timestamp: "2024-01-15T10:30:18Z",
        success: true,
        details: "Search returned 1,247 results"
      },
      {
        id: "t3",
        step: 3,
        action: "Filter Results",
        description: "Applied filters for Samsung brand and 4K resolution",
        screenshot: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
        domSnippet: '<div class="filter-section">Brand: Samsung</div>',
        timestamp: "2024-01-15T10:30:22Z",
        success: true,
        details: "Filtered down to 87 matching products"
      },
      {
        id: "t4",
        step: 4,
        action: "Extract Product",
        description: "Located and extracted product information using AI-powered selectors",
        screenshot: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&h=300&fit=crop",
        domSnippet: '<div class="product-card" data-product-id="samsung-32-uhd">',
        timestamp: "2024-01-15T10:30:25Z",
        success: true,
        details: "Successfully extracted price, rating, and availability data"
      }
    ]
  },
  {
    id: "2",
    title: "LG 32\" HD Ready LED TV - 32LM563BPTC",
    price: 13999,
    originalPrice: 18999,
    currency: "₹",
    rating: 4.1,
    reviewCount: 1523,
    seller: "LG Electronics",
    sellerRating: 4.7,
    shipping: "Free delivery in 3-5 days",
    availability: "In Stock",
    warranty: "1 year manufacturer warranty",
    imageUrl: "https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=300&h=300&fit=crop",
    productUrl: "#",
    source: "Amazon",
    aiScore: 8.7,
    aiReason: "Great budget option with reliable brand, good reviews, and significant discount.",
    trace: [
      {
        id: "t5",
        step: 1,
        action: "Navigate to Amazon",
        description: "Accessed Amazon India and performed search",
        screenshot: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
        domSnippet: '<div id="nav-search">',
        timestamp: "2024-01-15T10:30:30Z",
        success: true,
        details: "Amazon loaded successfully"
      }
    ]
  },
  {
    id: "3",
    title: "Sony Bravia 32\" Full HD Smart LED TV",
    price: 28999,
    originalPrice: 35999,
    currency: "₹",
    rating: 4.5,
    reviewCount: 892,
    seller: "Sony Centre",
    sellerRating: 4.9,
    shipping: "Free installation included",
    availability: "Limited Stock",
    warranty: "2 years + 1 year extended",
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&h=300&fit=crop&crop=center",
    productUrl: "#",
    source: "Croma",
    aiScore: 8.9,
    aiReason: "Premium build quality with excellent display technology and comprehensive warranty coverage.",
    trace: [
      {
        id: "t6",
        step: 1,
        action: "Navigate to Croma",
        description: "Visited Croma website and searched for TVs",
        screenshot: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
        domSnippet: '<header class="site-header">',
        timestamp: "2024-01-15T10:30:35Z",
        success: true,
        details: "Successfully navigated to electronics section"
      }
    ]
  }
];

export const mockSearchHistory: SearchHistory[] = [
  {
    id: "h1",
    query: "32 inch smart TV under 30000",
    timestamp: "2024-01-15T10:30:00Z",
    resultCount: 3,
    executionTime: 45.2,
    sources: ["Flipkart", "Amazon", "Croma"],
    replayScript: "// Generated Playwright script\nconst { chromium } = require('playwright');\n..."
  },
  {
    id: "h2",
    query: "gaming laptop RTX 4060",
    timestamp: "2024-01-14T15:20:00Z",
    resultCount: 5,
    executionTime: 52.8,
    sources: ["Amazon", "Flipkart", "Vijay Sales"],
  },
  {
    id: "h3",
    query: "wireless earbuds noise cancelling",
    timestamp: "2024-01-13T09:15:00Z",
    resultCount: 8,
    executionTime: 38.9,
    sources: ["Amazon", "Flipkart", "Croma", "Reliance Digital"],
  }
];

export const mockDemoSteps: DemoStep[] = [
  {
    id: "d1",
    title: "Multi-Site Search Initialization",
    description: "AI simultaneously launches browsers for Flipkart, Amazon, and Croma to search for '32 inch TV'",
    screenshot: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=450&fit=crop",
    highlight: { x: 100, y: 150, width: 600, height: 200 },
    duration: 3000
  },
  {
    id: "d2", 
    title: "Intelligent Product Detection",
    description: "Advanced selectors identify product cards across different site layouts using text patterns and visual cues",
    screenshot: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
    highlight: { x: 200, y: 200, width: 400, height: 300 },
    duration: 4000
  },
  {
    id: "d3",
    title: "Smart Price Extraction",
    description: "AI extracts pricing information, handles different currencies, and identifies discounts automatically",
    screenshot: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&h=450&fit=crop",
    highlight: { x: 300, y: 100, width: 200, height: 100 },
    duration: 3500
  },
  {
    id: "d4",
    title: "AI-Powered Ranking",
    description: "Results are scored using price, ratings, seller credibility, shipping speed, and warranty terms",
    screenshot: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
    highlight: { x: 50, y: 300, width: 700, height: 200 },
    duration: 4500
  },
  {
    id: "d5",
    title: "Explainable Trace Generation",
    description: "Each result includes a complete step-by-step trace showing exactly how the data was extracted",
    screenshot: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop",
    highlight: { x: 400, y: 50, width: 350, height: 400 },
    duration: 5000
  }
];

// Mock coding results for DSA queries
export const mockCodingResults: CodingResult[] = [
  {
    id: "c1",
    problem: "Binary Search Implementation",
    difficulty: "Medium",
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    tags: ["Binary Search", "Arrays", "Divide and Conquer"],
    approaches: [
      {
        name: "Iterative Approach",
        language: "C",
        code: `#include <stdio.h>

int binarySearch(int arr[], int n, int target) {
    int left = 0, right = n - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (arr[mid] == target)
            return mid;
        
        if (arr[mid] < target)
            left = mid + 1;
        else
            right = mid - 1;
    }
    
    return -1; // Element not found
}

int main() {
    int arr[] = {2, 3, 4, 10, 40};
    int n = sizeof(arr) / sizeof(arr[0]);
    int target = 10;
    
    int result = binarySearch(arr, n, target);
    
    if (result != -1)
        printf("Element found at index %d\\n", result);
    else
        printf("Element not found\\n");
        
    return 0;
}`,
        explanation: "Uses two pointers to narrow down search space. Most efficient for sorted arrays.",
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)"
      },
      {
        name: "Iterative Approach",
        language: "Python",
        code: `def binary_search(arr, target):
    """
    Binary search implementation in Python
    
    Args:
        arr: Sorted array of integers
        target: Element to search for
    
    Returns:
        Index of target if found, -1 otherwise
    """
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = left + (right - left) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

# Example usage
if __name__ == "__main__":
    arr = [2, 3, 4, 10, 40]
    target = 10
    
    result = binary_search(arr, target)
    
    if result != -1:
        print(f"Element found at index {result}")
    else:
        print("Element not found")`,
        explanation: "Clean Python implementation with proper documentation and error handling.",
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)"
      },
      {
        name: "Recursive Approach", 
        language: "Java",
        code: `public class BinarySearch {
    
    /**
     * Recursive binary search implementation
     * @param arr Sorted array
     * @param left Starting index
     * @param right Ending index  
     * @param target Element to search
     * @return Index if found, -1 otherwise
     */
    public static int binarySearchRecursive(int[] arr, int left, int right, int target) {
        if (right >= left) {
            int mid = left + (right - left) / 2;
            
            // If element found at mid
            if (arr[mid] == target)
                return mid;
                
            // If target is smaller, search left half
            if (arr[mid] > target)
                return binarySearchRecursive(arr, left, mid - 1, target);
                
            // Search right half
            return binarySearchRecursive(arr, mid + 1, right, target);
        }
        
        return -1; // Element not found
    }
    
    public static void main(String[] args) {
        int[] arr = {2, 3, 4, 10, 40};
        int target = 10;
        int n = arr.length;
        
        int result = binarySearchRecursive(arr, 0, n - 1, target);
        
        if (result == -1)
            System.out.println("Element not found");
        else
            System.out.println("Element found at index " + result);
    }
}`,
        explanation: "Recursive approach that's more intuitive but uses additional stack space.",
        timeComplexity: "O(log n)",
        spaceComplexity: "O(log n)"
      }
    ],
    relatedLinks: [
      {
        platform: "LeetCode",
        title: "Binary Search",
        url: "https://leetcode.com/problems/binary-search/",
        difficulty: "Easy"
      },
      {
        platform: "LeetCode", 
        title: "Search Insert Position",
        url: "https://leetcode.com/problems/search-insert-position/",
        difficulty: "Easy"
      },
      {
        platform: "HackerRank",
        title: "Binary Search Tree",
        url: "https://www.hackerrank.com/challenges/binary-search-tree/",
        difficulty: "Medium"
      },
      {
        platform: "CodeChef",
        title: "Binary Search Problems",
        url: "https://www.codechef.com/tags/problems/binary-search",
        difficulty: "Mixed"
      }
    ]
  }
];

// Mock AI responses for different modes
export const generateMockAIResponse = (query: string, mode: AIToolMode): AIResponse => {
  const responses: Record<AIToolMode, string> = {
    quick: `**Quick Answer for "${query}":**

Binary search is an efficient O(log n) algorithm for finding elements in sorted arrays. It works by repeatedly dividing the search space in half.

**Key Points:**
- Requires sorted data
- Much faster than linear search for large datasets
- Can be implemented iteratively or recursively`,

    research: `# Comprehensive Analysis: Binary Search Algorithm

## Overview
Binary search is a fundamental computer science algorithm that efficiently locates elements in sorted collections. This divide-and-conquer approach achieves logarithmic time complexity by systematically eliminating half of the remaining search space with each comparison.

## Algorithm Details

### How It Works
1. **Initialize**: Set left and right pointers to array boundaries
2. **Calculate**: Find middle index: mid = left + (right - left) / 2
3. **Compare**: Check if arr[mid] equals target
4. **Adjust**: If not equal, move left or right pointer based on comparison
5. **Repeat**: Continue until element found or search space exhausted

### Complexity Analysis
- **Time Complexity**: O(log n) - Each iteration halves the search space
- **Space Complexity**: 
  - Iterative: O(1) - Uses only constant extra space
  - Recursive: O(log n) - Due to function call stack

### Prerequisites
- Array must be sorted in ascending order
- Elements must be comparable

## Applications
- Database indexing systems
- File system searches  
- Finding insertion points
- Range queries in data structures

## Variants
- **Lower Bound**: Find first occurrence of target
- **Upper Bound**: Find insertion point for target
- **Rotated Arrays**: Modified binary search for rotated sorted arrays

## Implementation Considerations
- **Integer Overflow**: Use (left + right) / 2 carefully
- **Boundary Handling**: Ensure left <= right condition
- **Edge Cases**: Empty arrays, single elements, target not present`,

    learning: `# Binary Search in Machine Learning Context

## Relevance to ML/AI

### Hyperparameter Optimization
Binary search principles are used in:
- **Learning Rate Scheduling**: Finding optimal learning rates
- **Model Selection**: Efficient parameter space exploration
- **Feature Selection**: Identifying important features

### Neural Network Applications
- **Architecture Search**: Finding optimal network depths/widths
- **Activation Function Selection**: Systematic evaluation
- **Regularization Parameters**: Finding optimal λ values

### Data Science Workflows
- **Threshold Selection**: ROC curve optimization
- **Quantile Estimation**: Efficient percentile calculations
- **Sampling Strategies**: Stratified sampling with binary partitioning

## Algorithm Variants in ML

### Gradient-Based Binary Search
Used in optimization problems where derivatives are available:
\`\`\`python
def gradient_binary_search(f, df, x_low, x_high, tolerance=1e-6):
    while x_high - x_low > tolerance:
        x_mid = (x_low + x_high) / 2
        if df(x_mid) > 0:
            x_high = x_mid
        else:
            x_low = x_mid
    return (x_low + x_high) / 2
\`\`\`

### Probabilistic Binary Search
Incorporates uncertainty in comparisons:
- Useful when dealing with noisy data
- Applications in A/B testing
- Bayesian optimization frameworks`,

    study: `# Binary Search - Step-by-Step Learning Guide

## Learning Objectives
By the end of this lesson, you will:
✅ Understand the binary search algorithm concept
✅ Implement both iterative and recursive versions
✅ Analyze time and space complexity
✅ Solve related coding problems

## Step 1: Prerequisites Check
**Do you understand these concepts?**
- Arrays and indexing
- Sorted vs unsorted data
- Basic loop structures (while/for)
- Recursion (for recursive implementation)

## Step 2: Visual Understanding
**Mental Model:** Think of searching a dictionary
1. Open to middle page
2. Is your word before or after current page?
3. Eliminate half the dictionary
4. Repeat until found

## Step 3: Algorithm Walkthrough
Let's trace through searching for 10 in [2, 3, 4, 10, 40]:

**Iteration 1:**
- left=0, right=4, mid=2
- arr[2] = 4 < 10, so search right half
- Update: left=3

**Iteration 2:**  
- left=3, right=4, mid=3
- arr[3] = 10 = 10, FOUND!
- Return index 3

## Step 4: Common Mistakes to Avoid
❌ **Integer Overflow**: Don't use (left + right) / 2
✅ **Safe Formula**: left + (right - left) / 2

❌ **Wrong Condition**: while (left < right)
✅ **Correct**: while (left <= right)

❌ **Infinite Loop**: Not updating pointers correctly

## Step 5: Practice Problems
Start with these in order:
1. Basic binary search (find element)
2. Find first occurrence
3. Find last occurrence  
4. Search in rotated sorted array

## Step 6: Self-Check Quiz
1. What's the maximum number of comparisons for 1000 elements?
2. Why must the array be sorted?
3. How does recursive space complexity differ from iterative?`,

    coding: `# Binary Search - Complete Implementation Guide

## Problem Statement
Given a sorted array of integers and a target value, return the index of the target if found, otherwise return -1.

## Solution Approaches

### Approach 1: Iterative Implementation ⭐ Recommended
\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = left + (right - left) // 2  # Avoid overflow
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1
\`\`\`

### Test Cases
\`\`\`python
def test_binary_search():
    # Test case 1: Element found
    assert binary_search([1, 2, 3, 4, 5], 3) == 2
    
    # Test case 2: Element not found
    assert binary_search([1, 2, 3, 4, 5], 6) == -1
    
    # Test case 3: Empty array
    assert binary_search([], 1) == -1
    
    # Test case 4: Single element - found
    assert binary_search([5], 5) == 0
    
    # Test case 5: Single element - not found
    assert binary_search([5], 3) == -1
    
    # Test case 6: First element
    assert binary_search([1, 2, 3, 4, 5], 1) == 0
    
    # Test case 7: Last element
    assert binary_search([1, 2, 3, 4, 5], 5) == 4
    
    print("All tests passed!")

test_binary_search()
\`\`\`

## Edge Cases Handling
1. **Empty Array**: Check length before processing
2. **Single Element**: Works with standard implementation  
3. **Duplicate Elements**: Returns any valid index
4. **Target Smaller/Larger**: Returns -1 correctly

## Complexity Analysis
- **Time**: O(log n) - Halves search space each iteration
- **Space**: O(1) - Only uses constant extra variables

## Common Variations
- Find first occurrence: Continue searching left after finding target
- Find last occurrence: Continue searching right after finding target
- Find insertion point: Return left pointer when not found`
  };

  return {
    id: `ai_${Date.now()}`,
    query,
    mode,
    content: responses[mode],
    references: mode === 'research' ? [
      'https://en.wikipedia.org/wiki/Binary_search_algorithm',
      'https://www.geeksforgeeks.org/binary-search/',
      'https://leetcode.com/explore/learn/card/binary-search/'
    ] : undefined,
    confidence: 0.92,
    processingTime: Math.random() * 2 + 1
  };
};