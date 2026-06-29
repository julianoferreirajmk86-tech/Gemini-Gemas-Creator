import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Sparkles, Check, ArrowLeft, Bot, Sparkle, Send, 
  ThumbsUp, ThumbsDown, Volume2, StopCircle, User, Globe, Play 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// === TYPES ===
export interface Assistant {
  id: string;
  name: string;
  description: string;
  instructions: string;
  capacity: string;
  createdAt: number;
  color: string;
  voiceId?: string;
  languageCode?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  feedback?: 'up' | 'down' | null;
}

export type ViewState = 'HOME' | 'CREATE' | 'PREPARING' | 'CHAT';

// === COMPONENTS ===
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'floating';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-google-blue text-white hover:bg-google-blueHover rounded-full px-6 py-2.5 text-sm shadow-sm hover:shadow-md",
    secondary: "bg-google-gray text-google-text hover:bg-gray-200 rounded-full px-6 py-2.5 text-sm",
    text: "bg-transparent text-google-blue hover:bg-blue-50 rounded px-4 py-2 text-sm",
    floating: "bg-google-blue text-white hover:bg-google-blueHover rounded-2xl p-4 shadow-lg hover:shadow-xl fixed bottom-8 right-8 z-50 transition-transform hover:scale-105"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="relative mb-6 group">
      <input
        className={`peer w-full border border-gray-300 rounded-lg px-3 py-3 text-google-text placeholder-transparent focus:outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue transition-all bg-white ${className}`}
        placeholder={label}
        {...props}
      />
      <label className="absolute left-3 -top-2.5 bg-white px-1 text-xs text-google-subtext transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-google-blue pointer-events-none">
        {label}
      </label>
    </div>
  );
};

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="relative mb-6 group">
      <textarea
        className={`peer w-full border border-gray-300 rounded-lg px-3 py-3 text-google-text placeholder-transparent focus:outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue transition-all bg-white resize-none ${className}`}
        placeholder={label}
        {...props}
      />
      <label className="absolute left-3 -top-2.5 bg-white px-1 text-xs text-google-subtext transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-google-blue pointer-events-none">
        {label}
      </label>
    </div>
  );
};

// Utility for random gradient colors for avatars
const getRandomColor = () => {
  const gradients = [
    'from-blue-400 to-indigo-500',
    'from-purple-400 to-pink-500',
    'from-green-400 to-emerald-500',
    'from-orange-400 to-red-500',
    'from-teal-400 to-cyan-500',
  ];
  return gradients[HTML_ELEMENT_RANDOM_INDEX(gradients)];
};

const HTML_ELEMENT_RANDOM_INDEX = (arr: any[]) => Math.floor(Math.random() * arr.length);

// Verified supported languages for modern SpeechSynthesis engines
const SUPPORTED_LANGUAGES = [
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'pt-PT', name: 'Português (Portugal)' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Español (España)' },
  { code: 'es-MX', name: 'Español (México)' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'zh-TW', name: '中文 (繁體)' },
  { code: 'ru-RU', name: 'Русский' },
  { code: 'ar-SA', name: 'العربية' },
  { code: 'hi-IN', name: 'हिन्दी' },
  { code: 'tr-TR', name: 'Türkçe' },
  { code: 'nl-NL', name: 'Nederlands' },
  { code: 'pl-PL', name: 'Polski' },
  { code: 'sv-SE', name: 'Svenska' },
  { code: 'da-DK', name: 'Dansk' },
  { code: 'no-NO', name: 'Norsk' },
  { code: 'fi-FI', name: 'Suomi' },
  { code: 'el-GR', name: 'Ελληνικά' },
  { code: 'he-IL', name: 'עברית' },
  { code: 'th-TH', name: 'ไทย' },
  { code: 'id-ID', name: 'Indonesia' },
  { code: 'vi-VN', name: 'Tiếng Việt' },
  { code: 'cs-CZ', name: 'Čeština' },
  { code: 'hu-HU', name: 'Magyar' },
  { code: 'ro-RO', name: 'Română' },
  { code: 'sk-SK', name: 'Slovenčina' },
  { code: 'uk-UA', name: 'Українська' },
  { code: 'ca-ES', name: 'Català' },
  { code: 'hr-HR', name: 'Hrvatski' },
  { code: 'ms-MY', name: 'Bahasa Melayu' },
  { code: 'bn-IN', name: 'বাংলা' },
  { code: 'ta-IN', name: 'தமிழ்' },
  { code: 'te-IN', name: 'తెలుగు' },
  { code: 'ur-PK', name: 'اردو' },
  { code: 'gu-IN', name: 'ગુજરાતી' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ' },
  { code: 'ml-IN', name: 'മലയാളം' },
  { code: 'mr-IN', name: 'मराठी' },
  { code: 'pa-IN', name: 'ਪੰਜਾਬੀ' },
  { code: 'jv-ID', name: 'Jawa' },
  { code: 'is-IS', name: 'Íslenska' },
  { code: 'lv-LV', name: 'Latviešu' },
  { code: 'lt-LT', name: 'Lietuvių' },
];

export default function App() {
  // State
  const [view, setView] = useState<ViewState>('HOME');
  
  // Initialize assistants from LocalStorage
  const [assistants, setAssistants] = useState<Assistant[]>(() => {
    try {
      const saved = localStorage.getItem('gemini_gemas_list');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Erro ao carregar assistentes salvos", e);
      return [];
    }
  });
  
  const [activeAssistant, setActiveAssistant] = useState<Assistant | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  // Create Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [capacity, setCapacity] = useState('');
  const [language, setLanguage] = useState('pt-BR');
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Effect to load voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persistence Effect: Save assistants whenever they change
  useEffect(() => {
    localStorage.setItem('gemini_gemas_list', JSON.stringify(assistants));
  }, [assistants]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (view === 'CHAT') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view, isTyping]);

  // Toast Timer
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Audio cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleStartCreate = () => {
    setName('');
    setDescription('');
    setInstructions('');
    setCapacity('');
    setLanguage('pt-BR');
    // Try to find a default voice for Portuguese
    const voices = window.speechSynthesis.getVoices();
    const defaultVoice = voices.find(v => v.lang.replace('_', '-').startsWith('pt')) || null;
    setSelectedVoice(defaultVoice);
    setView('CREATE');
  };

  const testVoice = (voice: SpeechSynthesisVoice) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Olá, como posso ajudar você hoje?");
    utterance.lang = voice.lang;
    utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const handlePrepare = () => {
    if (!name || !instructions) return;
    setView('PREPARING');
    
    setTimeout(() => {
      const newAssistant: Assistant = {
        id: Date.now().toString(),
        name,
        description,
        instructions,
        capacity,
        createdAt: Date.now(),
        color: getRandomColor(),
        languageCode: language,
        voiceId: selectedVoice?.voiceURI,
      };
      
      setAssistants(prev => [newAssistant, ...prev]);
      setView('HOME');
      setShowToast(true);
    }, 2500);
  };

  const handleSelectAssistant = (assistant: Assistant) => {
    setActiveAssistant(assistant);
    setMessages([]); // Clear history for new session
    setView('CHAT');
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeAssistant) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Initialize Gemini Client
      const apiKey = process.env.API_KEY || ''; 
      
      let responseText = "Desculpe, não consegui conectar à IA no momento. Verifique sua chave de API.";

      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: userMsg.text }] }
          ],
          config: {
            systemInstruction: `Você é ${activeAssistant.name}. ${activeAssistant.instructions}. ${activeAssistant.capacity}`,
          }
        });
        
        if (response.text) {
          responseText = response.text;
        }
      } else {
        // Fallback simulation for demo purposes if no key is present
        await new Promise(resolve => setTimeout(resolve, 1500));
        responseText = `[Simulação sem API Key] Olá! Eu sou ${activeAssistant.name}. Recebi sua mensagem: "${userMsg.text}". Como posso ajudar com base nas minhas instruções: "${activeAssistant.instructions}"?`;
      }

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
        feedback: null
      };

      setMessages(prev => [...prev, modelMsg]);

    } catch (error) {
      console.error("Erro ao gerar resposta:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Desculpe, ocorreu um erro ao processar sua solicitação.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleSpeech = (messageId: string, text: string) => {
    if (speakingMessageId === messageId) {
      // Pause/Stop
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    } else {
      // Play
      window.speechSynthesis.cancel(); // Stop any previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = activeAssistant.languageCode || 'pt-BR';
      
      if (activeAssistant.voiceId) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.voiceURI === activeAssistant.voiceId);
        if (voice) utterance.voice = voice;
      }

      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);
      
      window.speechSynthesis.speak(utterance);
      setSpeakingMessageId(messageId);
    }
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        // Toggle logic: if clicking same type, remove feedback. If different, switch.
        const newFeedback = msg.feedback === type ? null : type;
        return { ...msg, feedback: newFeedback };
      }
      return msg;
    }));
  };

  // --- Render Components ---

  const renderHome = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in relative">
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-2 rounded-lg">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-normal text-google-text">Gemini Gemas</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowLanguageModal(true)}
            className="p-2 rounded-full hover:bg-gray-100 text-google-subtext transition-colors"
            title="Mudar idioma"
          >
            <Globe size={20} />
          </button>
        </div>
      </header>

      {assistants.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center mt-20 animate-slide-up">
          <div className="bg-blue-50 p-6 rounded-full mb-6">
            <Bot className="w-16 h-16 text-google-blue" />
          </div>
          <h2 className="text-2xl font-normal text-gray-900 mb-2">Crie seu primeiro assistente</h2>
          <p className="text-google-subtext mb-8 max-w-md">
            Personalize uma IA para ajudar com tarefas específicas, escrita criativa ou análise de dados.
          </p>
          <Button onClick={handleStartCreate} icon={<Plus size={20} />}>
            Criar novo assistente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assistants.map((assistant) => (
            <div 
              key={assistant.id} 
              onClick={() => handleSelectAssistant(assistant)}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden"
            >
               <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                  <Sparkle className="w-24 h-24 text-gray-900" />
               </div>
               
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${assistant.color} mb-4 flex items-center justify-center text-white font-bold text-xl shadow-sm`}>
                {assistant.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">{assistant.name}</h3>
              <p className="text-sm text-google-subtext line-clamp-2">{assistant.description || "Sem descrição"}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-xs text-google-subtext">
                 <span className="bg-gray-100 px-2 py-1 rounded-md font-medium text-gray-600">Personalizado</span>
              </div>
            </div>
          ))}
          
          <div className="fixed bottom-8 right-8 z-20">
            <Button onClick={handleStartCreate} variant="floating" icon={<Plus size={24} />}>
              Novo
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderCreate = () => (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => setView('HOME')} 
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 mr-2 text-google-subtext transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-medium text-google-text flex-1">Criar novo assistente</h1>
        <button 
          onClick={() => setShowLanguageModal(true)}
          className="p-2 rounded-full hover:bg-gray-100 text-google-subtext transition-colors"
          title="Mudar idioma"
        >
          <Globe size={20} />
        </button>
      </div>

      <div className="bg-white">
        <div className="flex justify-between items-center mb-4 px-1">
          <div className="flex gap-2">
            <button 
              onClick={() => setShowVoiceModal(true)}
              className="p-2.5 rounded-full bg-blue-50 text-google-blue hover:bg-blue-100 transition-colors flex items-center gap-2 pr-4 shadow-sm"
            >
              <User size={18} />
              <span className="text-sm font-medium">Voz</span>
            </button>
          </div>
        </div>

        <Input 
          label="Nome do assistente" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        
        <Input 
          label="Descrição curta" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        
        <div className="mt-6">
          <p className="text-xs text-google-subtext mb-2 ml-1">
            Defina o comportamento, tom de voz e regras principais.
          </p>
          <TextArea 
            label="Instruções" 
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
          />
        </div>

        <div className="mt-8">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            Integrar capacidade
            <Sparkles size={14} className="text-google-blue" />
          </label>
          <p className="text-xs text-google-subtext mb-3">
            Adicione capacidades específicas ou ferramentas.
          </p>
          <TextArea 
            label="Capacidade" 
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            rows={3}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex justify-end mt-8">
          <Button 
            onClick={handlePrepare} 
            disabled={!name.trim() || !instructions.trim()}
          >
            Preparar
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPreparing = () => (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center animate-fade-in">
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-google-blue rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="text-google-blue animate-pulse" size={24} />
        </div>
      </div>
      <h2 className="text-xl font-medium text-google-text mb-2">Preparando...</h2>
      <p className="text-google-subtext">Configurando sua Gema personalizada</p>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-screen bg-white animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView('HOME')} 
            className="p-2 rounded-full hover:bg-gray-100 text-google-subtext transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${activeAssistant?.color} flex items-center justify-center text-white font-bold text-sm`}>
            {activeAssistant?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-sm font-medium text-gray-900">{activeAssistant?.name}</h1>
            <p className="text-xs text-google-subtext">Gema personalizada</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
             <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${activeAssistant?.color} mb-4 flex items-center justify-center text-white font-bold text-3xl opacity-80`}>
                {activeAssistant?.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-gray-500">Comece a conversar com {activeAssistant?.name}</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className="flex-shrink-0 mt-1">
                {msg.role === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User size={16} className="text-gray-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                    <Sparkle size={16} className="text-google-blue" />
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="flex flex-col">
                <div 
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-gray-100 text-gray-800 rounded-tr-sm' 
                      : 'bg-transparent text-gray-800 pl-0 pt-1'
                  }`}
                >
                  {msg.text}
                </div>

                {/* AI Actions */}
                {msg.role === 'model' && (
                  <div className="flex items-center gap-2 mt-2 ml-0">
                    <button 
                      onClick={() => handleFeedback(msg.id, 'up')}
                      className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${msg.feedback === 'up' ? 'text-google-blue bg-blue-50' : 'text-gray-400'}`}
                    >
                      <ThumbsUp size={16} />
                    </button>
                    <button 
                      onClick={() => handleFeedback(msg.id, 'down')}
                      className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${msg.feedback === 'down' ? 'text-red-500 bg-red-50' : 'text-gray-400'}`}
                    >
                      <ThumbsDown size={16} />
                    </button>
                    <button 
                      onClick={() => toggleSpeech(msg.id, msg.text)}
                      className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${speakingMessageId === msg.id ? 'text-google-blue bg-blue-50' : 'text-gray-400'}`}
                    >
                      {speakingMessageId === msg.id ? <StopCircle size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <Sparkle size={16} className="text-google-blue animate-pulse" />
              </div>
              <div className="flex gap-1 bg-gray-50 px-3 py-2 rounded-full">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-gray-100">
        <div className="max-w-4xl mx-auto relative bg-gray-50 rounded-full border border-gray-200 focus-within:border-gray-300 focus-within:shadow-sm transition-all flex items-center pr-2">
          <input
            type="text"
            className="flex-1 bg-transparent px-6 py-4 outline-none text-gray-700 placeholder-gray-500"
            placeholder="Digite uma mensagem..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isTyping}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className={`p-2.5 rounded-full transition-all duration-200 ${
              inputText.trim() && !isTyping 
                ? 'bg-google-blue text-white hover:bg-google-blueHover shadow-sm' 
                : 'bg-transparent text-gray-300 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          A IA pode cometer erros. Considere verificar informações importantes.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      {view === 'HOME' && renderHome()}
      {view === 'CREATE' && renderCreate()}
      {view === 'PREPARING' && renderPreparing()}
      {view === 'CHAT' && renderChat()}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-slide-up z-50 min-w-[300px] justify-center">
          <div className="bg-green-500 rounded-full p-0.5">
            <Check size={14} className="text-white" strokeWidth={3} />
          </div>
          <span className="font-medium text-sm">Seu assistente foi criado com sucesso</span>
        </div>
      )}

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Globe size={18} className="text-google-blue" />
                Selecionar Idioma
              </h3>
              <button onClick={() => setShowLanguageModal(false)} className="text-gray-400 hover:text-gray-600">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-1">
              {[...SUPPORTED_LANGUAGES].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLanguageModal(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between ${
                    language === lang.code ? 'bg-blue-50 text-google-blue font-medium' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {lang.name}
                  {language === lang.code && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Voice Selection Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <User size={18} className="text-google-blue" />
                Escolher Voz
              </h3>
              <button onClick={() => setShowVoiceModal(false)} className="text-gray-400 hover:text-gray-600">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3 flex-1 min-h-0">
              {availableVoices
                .filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(language.split('-')[0].toLowerCase()))
                .map((voice, idx) => (
                  <div 
                    key={voice.voiceURI}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      selectedVoice?.voiceURI === voice.voiceURI 
                        ? 'border-google-blue bg-blue-50/50 shadow-sm' 
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedVoice(voice)}
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {voice.name.toLowerCase().includes('male') ? 'Voz Masculina' : voice.name.toLowerCase().includes('female') ? 'Voz Feminina' : `Voz ${idx + 1}`}
                      </p>
                      <p className="text-xs text-google-subtext mt-0.5">{voice.name}</p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => testVoice(voice)}
                      className="p-2 rounded-full bg-white border border-gray-200 text-google-blue hover:shadow-md transition-shadow"
                      title="Reproduzir"
                    >
                      <Play size={16} fill="currentColor" />
                    </motion.button>
                  </div>
                ))}
              
              {availableVoices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(language.split('-')[0].toLowerCase())).length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  Nenhuma voz específica encontrada para este idioma. <br/>
                  Será usada a voz padrão do sistema.
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <Button onClick={() => setShowVoiceModal(false)} className="w-full">
                Confirmar Seleção
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
