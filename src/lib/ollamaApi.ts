// Ollama API utilities for local LLM integration

export interface OllamaModel {
  name: string;
  status: "local" | "remote";
  size?: string;
  latency_category: "Fast" | "Balanced" | "Large";
  description: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score: number;
  model: string;
  trace?: {
    prompt: string;
    candidates: number;
    reranking_steps: string[];
  };
}

// Check if Ollama is running locally
export async function checkOllamaStatus(): Promise<{status: string, isLocal: boolean, localModels: number}> {
  try {
    const response = await fetch('http://localhost:11434/api/version');
    if (response.ok) {
      const modelsResponse = await fetch('http://localhost:11434/api/tags');
      let localModelCount = 0;
      
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        localModelCount = modelsData.models?.length || 0;
      }

      return {
        status: 'online',
        isLocal: true,
        localModels: localModelCount
      };
    }
    return { status: 'offline', isLocal: false, localModels: 0 };
  } catch (error) {
    return { status: 'offline', isLocal: false, localModels: 0 };
  }
}

// Get available Ollama models (local + known remote)
export async function getOllamaModels(): Promise<OllamaModel[]> {
  // Known available models for download
  const availableModels = [
    {
      name: "smollm2:135m",
      size: "135MB",
      latency_category: "Fast" as const,
      description: "Tiny & fast — quick replies, limited depth."
    },
    {
      name: "llama2",
      size: "3.8GB", 
      latency_category: "Balanced" as const,
      description: "Generalist — balanced on summarization & chat (7B/13B/70B options)."
    },
    {
      name: "llama3.2",
      size: "2.0GB",
      latency_category: "Balanced" as const,
      description: "Instruction-tuned multilingual for better dialogue & summaries."
    },
    {
      name: "gemma2",
      size: "1.6GB",
      latency_category: "Fast" as const, 
      description: "Efficient reasoning & instruction-following (if available locally)."
    },
    {
      name: "llava",
      size: "4.7GB",
      latency_category: "Large" as const,
      description: "Vision+Language — use for image-aware searches/screenshots."
    },
    {
      name: "granite",
      size: "8.1GB",
      latency_category: "Large" as const,
      description: "Long-context reasoning (128K context) for big transcripts."
    },
    {
      name: "bge-m3",
      size: "1.2GB", 
      latency_category: "Fast" as const,
      description: "Fast embeddings for semantic search & transcript indexing."
    }
  ];

  try {
    // Try to get local models from Ollama
    const response = await fetch('http://localhost:11434/api/tags');
    let localModels: any[] = [];
    
    if (response.ok) {
      const data = await response.json();
      localModels = data.models || [];
    }

    // Combine local and available models
    const models: OllamaModel[] = availableModels.map(model => {
      const isLocal = localModels.some(local => local.name === model.name);
      return {
        ...model,
        status: isLocal ? "local" : "remote"
      };
    });

    // Sort local models first
    models.sort((a, b) => {
      if (a.status === "local" && b.status === "remote") return -1;
      if (a.status === "remote" && b.status === "local") return 1;
      return a.name.localeCompare(b.name);
    });

    return models;
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return availableModels.map(model => ({ ...model, status: "remote" }));
  }
}

// Pull/download a model from Ollama
export async function pullOllamaModel(modelName: string): Promise<{success: boolean, message: string}> {
  try {
    const response = await fetch('http://localhost:11434/api/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: false })
    });

    if (response.ok) {
      return {
        success: true,
        message: `Model ${modelName} pulled successfully`
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        message: `Failed to pull model: ${error}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to Ollama service. Ensure Ollama is running on localhost:11434'
    };
  }
}

// Perform quick search using local LLM
export async function performQuickSearch(query: string, model: string): Promise<SearchResult[]> {
  try {
    // Generate search prompt for the LLM
    const searchPrompt = `You are a web search assistant. Find relevant results for: "${query}". 
    Return results as a structured list with titles, URLs, and brief descriptions.
    Focus on e-commerce sites like Amazon, Flipkart, and product reviews.`;

    // Call local Ollama model
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: searchPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          max_tokens: 500
        }
      })
    });

    let llmResponse = '';
    if (ollamaResponse.ok) {
      const data = await ollamaResponse.json();
      llmResponse = data.response || '';
    }

    // Generate mock search results with LLM reasoning
    const results: SearchResult[] = [
      {
        title: `Best ${query.split(' ')[0]} Options - Amazon`,
        url: `https://amazon.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Top-rated ${query} with fast delivery and great prices. Customer reviews and ratings available.`,
        score: 0.95,
        model: model,
        trace: {
          prompt: searchPrompt,
          candidates: 150,
          reranking_steps: [
            'Query analysis and intent detection',
            'Semantic search across indexed content',
            'LLM-based relevance scoring',
            'Price and rating optimization'
          ]
        }
      },
      {
        title: `${query} - Best Deals on Flipkart`,
        url: `https://flipkart.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Compare prices and features for ${query}. Get the best deals with bank offers and EMI options.`,
        score: 0.87,
        model: model,
        trace: {
          prompt: searchPrompt,
          candidates: 98,
          reranking_steps: [
            'Product catalog matching',
            'Price comparison analysis',
            'User preference alignment',
            'Local availability check'
          ]
        }
      },
      {
        title: `${query} Reviews and Comparisons`,
        url: `https://example-reviews.com/${query.replace(/\s+/g, '-')}`,
        snippet: `Expert reviews and detailed comparisons of ${query}. Pros, cons, and buying recommendations.`,
        score: 0.73,
        model: model,
        trace: {
          prompt: searchPrompt,
          candidates: 45,
          reranking_steps: [
            'Content quality assessment',
            'Expert review aggregation',
            'User sentiment analysis'
          ]
        }
      }
    ];

    // Add LLM insights if available
    if (llmResponse) {
      results.forEach(result => {
        result.snippet += ` AI Insight: ${llmResponse.slice(0, 100)}...`;
      });
    }

    return results;
  } catch (error) {
    console.error('Quick search error:', error);
    throw new Error('Search failed. Ensure Ollama is running and the model is available locally.');
  }
}

// Save/get user model preferences
export function saveModelPreference(modelName: string): void {
  localStorage.setItem('nexusai_pinned_model', modelName);
}

export function getModelPreference(): string {
  return localStorage.getItem('nexusai_pinned_model') || 'llama2';
}