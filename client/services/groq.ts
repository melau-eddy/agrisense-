import { Groq } from 'groq-sdk';

// Initialize Groq client with your API key
// Get your API key from: https://console.groq.com/keys
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE', // Replace with your actual key
  dangerouslyAllowBrowser: true // Required for React Native
});

// Available models from Groq
export const availableModels = [
  { id: 'llama3-8b-8192', name: 'Llama 3 8B', provider: 'Groq' },
  { id: 'llama3-70b-8192', name: 'Llama 3 70B', provider: 'Groq' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'Groq' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B', provider: 'Groq' },
];

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Get chat completion from Groq API
 */
export async function getChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  try {
    const {
      model = 'llama3-8b-8192',
      temperature = 0.7,
      max_tokens = 1024,
      stream = false,
    } = options;

    // Validate API key
    if (!groq.apiKey || groq.apiKey === 'YOUR_GROQ_API_KEY_HERE') {
      throw new Error('Groq API key not configured. Please add your API key in services/groq.ts');
    }

    const completion = await groq.chat.completions.create({
      messages,
      model,
      temperature,
      max_tokens,
      stream,
    });

    if (stream) {
      // Handle streaming response
      let fullResponse = '';
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
      }
      return fullResponse;
    } else {
      return completion.choices[0]?.message?.content || '';
    }
  } catch (error: any) {
    console.error('Groq API Error:', error);
    
    // Provide user-friendly error messages
    if (error?.status === 401) {
      throw new Error('Invalid API key. Please check your Groq API configuration.');
    } else if (error?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error?.status === 503) {
      throw new Error('Service temporarily unavailable. Please try again.');
    } else if (error?.message?.includes('network')) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(`Chat service error: ${error.message || 'Unknown error'}`);
    }
  }
}

/**
 * Validate Groq API key
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') {
      return false;
    }

    const testClient = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    
    // Make a minimal test request
    await testClient.chat.completions.create({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'llama3-8b-8192',
      max_tokens: 1,
    });

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get available models from Groq (with validation)
 */
export async function getAvailableModels(apiKey?: string): Promise<typeof availableModels> {
  try {
    const client = apiKey 
      ? new Groq({ apiKey, dangerouslyAllowBrowser: true })
      : groq;
    
    // Note: Groq doesn't have a models endpoint yet, so we return our predefined list
    // You can extend this with actual API calls when available
    return availableModels;
  } catch (error) {
    console.error('Error fetching models:', error);
    return availableModels; // Fallback to predefined list
  }
}
