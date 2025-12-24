import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getChatCompletion, 
  availableModels, 
  validateApiKey,
  ChatMessage as GroqChatMessage,
  ChatCompletionOptions
} from '@/services/groq';
import ENV from '@/config/env';

export interface Message {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  system?: boolean;
  pending?: boolean;
  error?: boolean;
}

export interface ChatConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
}

interface ChatContextType {
  messages: Message[];
  config: ChatConfig;
  isTyping: boolean;
  showChat: boolean; // Add this property
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  updateConfig: (config: Partial<ChatConfig>) => void;
  validateApiKey: (key: string) => Promise<boolean>;
  availableModels: typeof availableModels;
  toggleChat: () => void; // Add this method
  openChat: () => void; // Add this method
  closeChat: () => void; // Add this method
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  CHAT_HISTORY: '@agrisense_chat_history',
  CHAT_CONFIG: '@agrisense_chat_config',
  CHAT_VISIBILITY: '@agrisense_chat_visibility',
};

const defaultConfig: ChatConfig = {
  model: 'llama3-8b-8192',
  temperature: 0.7,
  maxTokens: 1024,
  apiKey: ENV.GROQ_API_KEY,
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<ChatConfig>(defaultConfig);
  const [isTyping, setIsTyping] = useState(false);
  const [showChat, setShowChat] = useState(true); // Default to true for full screen chat
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize chat from storage
  React.useEffect(() => {
    if (isInitialized) return;

    const initializeChat = async () => {
      try {
        // Load chat history
        const storedHistory = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          const messagesWithDates = parsed.map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt),
          }));
          setMessages(messagesWithDates);
        }

        // Load chat config
        const storedConfig = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_CONFIG);
        if (storedConfig) {
          const parsedConfig = JSON.parse(storedConfig);
          setConfig(prev => ({ ...prev, ...parsedConfig }));
        }

        // Load chat visibility preference
        const storedVisibility = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_VISIBILITY);
        if (storedVisibility !== null) {
          setShowChat(JSON.parse(storedVisibility));
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setIsInitialized(true);
      }
    };

    initializeChat();
  }, [isInitialized]);

  // Save messages to storage
  const saveMessages = useCallback(async (msgs: Message[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(msgs));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, []);

  // Save config to storage
  const saveConfig = useCallback(async (cfg: ChatConfig) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_CONFIG, JSON.stringify(cfg));
    } catch (error) {
      console.error('Failed to save chat config:', error);
    }
  }, []);

  // Save visibility preference
  const saveVisibility = useCallback(async (visible: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_VISIBILITY, JSON.stringify(visible));
    } catch (error) {
      console.error('Failed to save chat visibility:', error);
    }
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    // Create user message
    const userMessage: Message = {
      _id: Date.now().toString(),
      text: text.trim(),
      createdAt: new Date(),
      user: {
        _id: 'user',
        name: 'You',
      },
    };

    // Create pending bot message
    const botMessage: Message = {
      _id: (Date.now() + 1).toString(),
      text: '',
      createdAt: new Date(),
      user: {
        _id: 'bot',
        name: 'AgriSense AI',
      },
      pending: true,
    };

    const newMessages = [...messages, userMessage, botMessage];
    setMessages(newMessages);
    saveMessages(newMessages);
    
    setIsTyping(true);

    try {
      // Prepare messages for Groq API
      const groqMessages: GroqChatMessage[] = [
        {
          role: 'system',
          content: `You are AgriSense AI, an agricultural expert assistant. You help farmers with:
          1. Crop management advice
          2. Weather impact analysis
          3. Soil health recommendations
          4. Pest and disease identification
          5. Irrigation scheduling
          6. Yield optimization
          7. Sustainable farming practices
          8. Market trends and pricing
          
          Be concise, practical, and data-driven. Use metric units.`
        },
        ...messages.slice(-10).map(msg => ({
          role: msg.user._id === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.text
        })),
        {
          role: 'user',
          content: text.trim()
        }
      ];

      // API options
      const options: ChatCompletionOptions = {
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: false,
      };

      // Use provided API key or environment key
      const apiKey = config.apiKey || ENV.GROQ_API_KEY;
      
      if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') {
        throw new Error('API key not configured. Please set up your Groq API key in Settings.');
      }

      // Get response from Groq
      const response = await getChatCompletion(groqMessages, options);

      // Update bot message with response
      const updatedMessages = newMessages.map(msg => 
        msg._id === botMessage._id 
          ? { ...msg, text: response, pending: false }
          : msg
      );

      setMessages(updatedMessages);
      saveMessages(updatedMessages);

    } catch (error: any) {
      console.error('Chat error:', error);

      // Update bot message with error
      const errorMessages = newMessages.map(msg => 
        msg._id === botMessage._id 
          ? { 
              ...msg, 
              text: `Error: ${error.message || 'Failed to get response'}. Please check your API key and try again.`,
              pending: false,
              error: true 
            }
          : msg
      );

      setMessages(errorMessages);
      saveMessages(errorMessages);

      // Show error alert
      Alert.alert(
        'Chat Error',
        error.message || 'Failed to send message. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear all chat messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setMessages([]);
            await AsyncStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
          },
        },
      ]
    );
  };

  const updateConfig = async (newConfig: Partial<ChatConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    await saveConfig(updatedConfig);
  };

  const validateApiKeyHandler = async (key: string): Promise<boolean> => {
    return await validateApiKey(key);
  };

  const toggleChat = () => {
    const newVisibility = !showChat;
    setShowChat(newVisibility);
    saveVisibility(newVisibility);
  };

  const openChat = () => {
    setShowChat(true);
    saveVisibility(true);
  };

  const closeChat = () => {
    setShowChat(false);
    saveVisibility(false);
  };

  const value: ChatContextType = {
    messages,
    config,
    isTyping,
    showChat,
    sendMessage,
    clearChat,
    updateConfig,
    validateApiKey: validateApiKeyHandler,
    availableModels,
    toggleChat,
    openChat,
    closeChat,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
