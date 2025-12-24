import OpenAI from 'openai';

// Initialize OpenAI client
// IMPORTANT: Store your API key securely - never hardcode in production!
// Use environment variables or secure storage

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '', // Use environment variable
  dangerouslyAllowBrowser: true, // Required for React Native
});

export async function getChatCompletion(messages: any[]) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

// Mock response for testing when no API key is provided
export async function getMockChatCompletion(messages: any[]) {
  const lastMessage = messages[messages.length - 1]?.content || '';
  
  const responses = {
    greeting: "Hello! I'm AgriSense AI, your farming assistant. How can I help you with your agricultural needs today?",
    weather: "For weather information, I recommend checking your dashboard's weather forecast section. I can help interpret weather data for farming decisions.",
    irrigation: "Based on soil moisture data, your fields need irrigation. I recommend scheduling watering for tomorrow morning when temperatures are cooler.",
    crops: "For crop recommendations, consider factors like soil type, climate, and market demand. I can help analyze your specific conditions.",
    pest: "For pest management, I recommend integrated pest management strategies. Check your field summary for any pest alerts.",
    default: "I understand you're asking about farming. As your AgriSense AI assistant, I can help with: weather analysis, irrigation scheduling, crop recommendations, pest management, and farm analytics. What specific area would you like help with?"
  };

  const lowerMessage = lastMessage.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return responses.greeting;
  } else if (lowerMessage.includes('weather')) {
    return responses.weather;
  } else if (lowerMessage.includes('water') || lowerMessage.includes('irrigation')) {
    return responses.irrigation;
  } else if (lowerMessage.includes('crop')) {
    return responses.crops;
  } else if (lowerMessage.includes('pest')) {
    return responses.pest;
  } else {
    return responses.default;
  }
}

export { openai };
