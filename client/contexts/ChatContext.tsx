import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getChatCompletion, 
  availableModels, 
  validateApiKey,
  testApiConnection,
  ChatMessage as GroqChatMessage,
  ChatCompletionOptions
} from '@/services/groq';

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
  retryCount?: number;
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
  showChat: boolean;
  apiStatus: 'connected' | 'disconnected' | 'checking';
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  updateConfig: (config: Partial<ChatConfig>) => Promise<void>;
  validateApiKey: (key: string) => Promise<boolean>;
  testConnection: () => Promise<void>;
  availableModels: typeof availableModels;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  retryMessage: (messageId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  CHAT_HISTORY: '@agrisense_chat_history_v3',
  CHAT_CONFIG: '@agrisense_chat_config_v3',
  CHAT_VISIBILITY: '@agrisense_chat_visibility',
};

// Default config with updated model
const defaultConfig: ChatConfig = {
  model: 'llama-3.1-70b-versatile', // Updated to Llama 3.1 70B
  temperature: 0.7,
  maxTokens: 1024,
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<ChatConfig>(defaultConfig);
  const [isTyping, setIsTyping] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [isInitialized, setIsInitialized] = useState(false);

  // Check API connection on app start and when app comes to foreground
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setApiStatus('checking');
        const result = await testApiConnection();
        setApiStatus(result.success ? 'connected' : 'disconnected');
        
        if (!result.success) {
          console.warn('API connection check failed:', result.message);
        }
      } catch (error) {
        setApiStatus('disconnected');
        console.error('Connection check error:', error);
      }
    };

    checkConnection();

    // Listen for app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkConnection();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Initialize chat from storage
  useEffect(() => {
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

  const sendMessage = async (text: string, retryMessageId?: string) => {
    if (!text.trim() || isTyping) return;

    // Check API status before sending
    if (apiStatus === 'disconnected') {
      Alert.alert(
        'Connection Issue',
        'Cannot connect to AI service. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    let newMessages: Message[];
    
    if (retryMessageId) {
      // Retry existing message
      newMessages = messages.map(msg => 
        msg._id === retryMessageId 
          ? { ...msg, pending: true, error: false }
          : msg
      );
    } else {
      // Create new message
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

      newMessages = [...messages, userMessage, botMessage];
    }

    setMessages(newMessages);
    saveMessages(newMessages);
    
    setIsTyping(true);

    try {
      // Prepare messages for Groq API
      const conversationMessages = messages
        .filter(msg => !msg.pending && !msg.error)
        .slice(-10)
        .map(msg => ({
          role: msg.user._id === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.text
        }));

      const groqMessages: GroqChatMessage[] = [
        ...conversationMessages,
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

      // Get response from Groq
      const response = await getChatCompletion(groqMessages, options);

      // Update bot message with response
      const updatedMessages = newMessages.map(msg => 
        msg.pending && msg.user._id === 'bot'
          ? { ...msg, text: response, pending: false }
          : msg
      );

      setMessages(updatedMessages);
      saveMessages(updatedMessages);

    } catch (error: any) {
      console.error('Chat error:', error);

      // Update bot message with error
      const errorMessages = newMessages.map(msg => 
        msg.pending && msg.user._id === 'bot'
          ? { 
              ...msg, 
              text: `❌ ${error.message || 'Service temporarily unavailable. Please try again.'}`,
              pending: false,
              error: true,
              retryCount: (msg.retryCount || 0) + 1
            }
          : msg
      );

      setMessages(errorMessages);
      saveMessages(errorMessages);

      // Show error alert for non-retry attempts
      if (!retryMessageId) {
        Alert.alert(
          'Chat Error',
          error.message || 'Failed to send message. Please try again.',
          [
            { text: 'OK' },
            {
              text: 'Retry',
              onPress: () => sendMessage(text)
            }
          ]
        );
      }
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear all chat messages? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
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
    
    // Validate API key if it's being updated
    if (newConfig.apiKey !== undefined) {
      if (newConfig.apiKey && newConfig.apiKey.trim() !== '') {
        const isValid = await validateApiKey(newConfig.apiKey.trim());
        
        if (isValid) {
          // Test connection with new API key
          setApiStatus('checking');
          const result = await testApiConnection();
          setApiStatus(result.success ? 'connected' : 'disconnected');
          
          if (result.success) {
            Alert.alert('✅ Success', 'API key validated and connected successfully!');
          } else {
            Alert.alert('⚠️ Warning', 'API key validated but connection test failed.');
          }
        } else {
          Alert.alert('❌ Invalid API Key', 'The provided API key appears to be invalid.');
          return; // Don't save invalid key
        }
      }
    }
    
    setConfig(updatedConfig);
    await saveConfig(updatedConfig);
  };

  const validateApiKeyHandler = async (key: string): Promise<boolean> => {
    return await validateApiKey(key);
  };

  const testConnection = async () => {
    try {
      setApiStatus('checking');
      const result = await testApiConnection();
      setApiStatus(result.success ? 'connected' : 'disconnected');
      
      Alert.alert(
        result.success ? '✅ Connection Successful' : '❌ Connection Failed',
        result.message
      );
    } catch (error: any) {
      setApiStatus('disconnected');
      Alert.alert('Connection Test Failed', error.message || 'Unknown error');
    }
  };

  const retryMessage = async (messageId: string) => {
    const message = messages.find(msg => msg._id === messageId);
    if (message && message.user._id === 'user') {
      await sendMessage(message.text, messageId);
    }
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
    apiStatus,
    sendMessage,
    clearChat,
    updateConfig,
    validateApiKey: validateApiKeyHandler,
    testConnection,
    availableModels,
    toggleChat,
    openChat,
    closeChat,
    retryMessage,
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