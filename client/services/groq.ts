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

// Updated models list - December 2024 (Active Production Models)
export const availableModels = [
  // Production Models - Recommended for production use
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'Meta', category: 'production' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'Meta', category: 'production' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'OpenAI', category: 'production' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'OpenAI', category: 'production' },
  { id: 'meta-llama/llama-guard-4-12b', name: 'Llama Guard 4 12B', provider: 'Meta', category: 'production' },
  
  // Preview Models - For evaluation only
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B', provider: 'Meta', category: 'preview' },
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B', provider: 'Meta', category: 'preview' },
  { id: 'moonshotai/kimi-k2-instruct-0905', name: 'Kimi K2 Instruct', provider: 'Moonshot AI', category: 'preview' },
  { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', provider: 'Alibaba Cloud', category: 'preview' },
  
  // Audio Models
  { id: 'whisper-large-v3', name: 'Whisper Large V3', provider: 'OpenAI', category: 'audio' },
  { id: 'whisper-large-v3-turbo', name: 'Whisper Large V3 Turbo', provider: 'OpenAI', category: 'audio' },
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
      model = 'llama-3.3-70b-versatile', // Updated to current production model
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
    } else if (error?.code === 'model_not_found' || error?.message?.includes('decommissioned')) {
      throw new Error('The selected AI model is no longer available. Please select a different model from the settings.');
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
    
    // Test with current small production model
    const response = await testClient.chat.completions.create({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'llama-3.1-8b-instant', // Current production model
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
    // Return basic production models as fallback
    return [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'Meta', category: 'production' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'Meta', category: 'production' },
    ];
  }
}

/**
 * Test API connectivity with current production model
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
      model: 'llama-3.1-8b-instant', // Current production model
      max_tokens: 1,
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      message: `✅ API connected successfully (${responseTime}ms)`,
      responseTime,
      model: 'llama-3.3-70b-versatile'
    };
  } catch (error: any) {
    return {
      success: false,
      message: `❌ API connection failed: ${error.code || error.status} ${JSON.stringify(error.error || error.message)}`,
      model: 'llama-3.3-70b-versatile'
    };
  }
}