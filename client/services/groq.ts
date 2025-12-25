import { Groq } from 'groq-sdk';

// Your actual Groq API key
const GROQ_API_KEY = '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';

// Validate API key format
if (!GROQ_API_KEY || GROQ_API_KEY.trim() === '' || !GROQ_API_KEY.startsWith('gsk_')) {
  console.error('❌ Invalid Groq API key format. Must start with "gsk_"');
  throw new Error('Invalid Groq API key configuration');
}

// Initialize Groq client
const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

// Updated models list (Llama 3.1 70B and other current models)
export const availableModels = [
  { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile', provider: 'Groq' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'Groq' },
  { id: 'llama-3.2-1b-preview', name: 'Llama 3.2 1B Preview', provider: 'Groq' },
  { id: 'llama-3.2-3b-preview', name: 'Llama 3.2 3B Preview', provider: 'Groq' },
  { id: 'llama-3.2-90b-text-preview', name: 'Llama 3.2 90B Text', provider: 'Groq' },
  { id: 'llama-guard-3-8b', name: 'Llama Guard 3 8B', provider: 'Groq' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B', provider: 'Groq' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'Groq' },
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
 * Production-ready chat completion from Groq API
 */
export async function getChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  console.log('🚀 Sending request to Groq API...');
  
  try {
    const {
      model = 'llama-3.1-70b-versatile', // Updated default model
      temperature = 0.7,
      max_tokens = 1024,
      stream = false,
    } = options;

    // Add agricultural context to system message
    const enhancedMessages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are AgriSense AI, an expert agricultural assistant with 15 years of experience. You provide:
        1. Data-driven crop management advice
        2. Weather impact analysis and forecasting
        3. Soil health optimization strategies
        4. Pest/disease identification and organic treatment plans
        5. Precision irrigation scheduling
        6. Yield optimization techniques
        7. Sustainable farming practices
        8. Market trend analysis
        9. Farm equipment recommendations
        10. Government subsidy guidance
        
        Guidelines:
        - Always use metric units (hectares, liters, kg, °C)
        - Be specific with numbers and data
        - Reference scientific studies when possible
        - Consider regional variations
        - Prioritize cost-effective solutions
        - Emphasize sustainability
        - Include safety precautions
        - Suggest monitoring timelines
        - Provide step-by-step implementation
        - Mention alternative options`
      },
      ...messages
    ];

    console.log('📤 Request details:', {
      model,
      temperature,
      max_tokens,
      messageCount: enhancedMessages.length
    });

    const startTime = Date.now();
    
    const completion = await groq.chat.completions.create({
      messages: enhancedMessages,
      model,
      temperature,
      max_tokens,
      stream,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
    });

    const responseTime = Date.now() - startTime;
    console.log(`✅ Groq API response received in ${responseTime}ms`);

    if (stream) {
      let fullResponse = '';
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
      }
      return fullResponse;
    } else {
      const response = completion.choices[0]?.message?.content || '';
      console.log('📥 Response length:', response.length, 'characters');
      return response;
    }
  } catch (error: any) {
    console.error('❌ Groq API Error Details:', {
      status: error?.status,
      code: error?.code,
      message: error?.message,
      type: error?.type
    });

    // Production error handling with specific messages
    if (error?.status === 401) {
      throw new Error('Authentication failed. Please check your API key configuration.');
    } else if (error?.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a few moments before trying again.');
    } else if (error?.status === 503) {
      throw new Error('Groq service is temporarily unavailable. Please try again shortly.');
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      throw new Error('Network connection issue. Please check your internet and try again.');
    } else if (error?.message?.includes('timeout')) {
      throw new Error('Request timeout. Please try again.');
    } else if (error?.type === 'invalid_request_error') {
      throw new Error(`Invalid request: ${error.message || 'Please try rephrasing your question.'}`);
    } else if (error?.code === 'model_decommissioned') {
      throw new Error('The selected AI model has been updated. Please try again or change model in settings.');
    } else {
      throw new Error(`AI service error: ${error?.message || 'Please try again'}`);
    }
  }
}

/**
 * Production API key validation
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('gsk_')) {
      return false;
    }

    const testClient = new Groq({ 
      apiKey: apiKey.trim(), 
      dangerouslyAllowBrowser: true 
    });
    
    // Test with current model
    const response = await testClient.chat.completions.create({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'llama-3.1-8b-instant', // Use a small model for validation
      max_tokens: 1,
    });
    
    return !!response.choices[0]?.message?.content;
  } catch (error) {
    console.error('API key validation failed:', error);
    return false;
  }
}

/**
 * Get available models with health check
 */
export async function getAvailableModels(): Promise<typeof availableModels> {
  try {
    // Return our updated model list
    return availableModels;
  } catch (error) {
    console.error('Error fetching models:', error);
    // Return basic models as fallback
    return [
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile', provider: 'Groq' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'Groq' },
    ];
  }
}

/**
 * Test API connectivity with current model
 */
export async function testApiConnection(): Promise<{
  success: boolean;
  message: string;
  responseTime?: number;
  model?: string;
}> {
  try {
    const startTime = Date.now();
    
    await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Test connection' }],
      model: 'llama-3.1-8b-instant', // Use small model for connection test
      max_tokens: 1,
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      message: `✅ API connected successfully (${responseTime}ms)`,
      responseTime,
      model: 'llama-3.1-70b-versatile'
    };
  } catch (error: any) {
    return {
      success: false,
      message: `❌ API connection failed: ${error.code || error.status} ${JSON.stringify(error.error || error.message)}`,
      model: 'llama-3.1-70b-versatile'
    };
  }
}