import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Database,
  CheckCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  User,
  CornerDownLeft
} from 'lucide-react';
import { api } from '../services/api';
import { AssistantResponse } from '../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  dataSources?: string[];
  citations?: any[];
  confidence?: number;
  timestamp: string;
}

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `### Welcome to AgriMarket AI Intelligence Assistant! 🌾\n\nI have real-time analytical access to your connected **AGMARKNET mandi price feeds**, **Open-Meteo weather logs**, **Government MSP benchmarks**, and **Scikit-Learn forecasting models**.\n\nAsk me anything regarding current mandi rates, multi-market spreads, price forecasts, or MSP distress checks.`,
      dataSources: ['AgriMarket Analytical Core', 'AGMARKNET Feeds', 'CACP MSP Notifications'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQueries = [
    'What is the current wheat price in Punjab?',
    'Which mandi has the highest onion price?',
    'Predict tomato prices for the next 15 days.',
    'Show commodities trading below MSP.',
    'How does rainfall affect onion prices?',
    'Calculate profit from selling 100 quintals of mustard.',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputText;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputText('');
    setLoading(true);

    try {
      const res: AssistantResponse = await api.askAssistant(q);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer,
        dataSources: res.data_sources,
        citations: res.citations,
        confidence: res.confidence,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Apologies, I encountered an issue retrieving real-time market data. Please verify backend connectivity.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> MODULE 14: CONVERSATIONAL AGRI-INTELLIGENCE
          </span>
          <span className="text-xs text-slate-400 font-medium">Grounded in Active Mandi Databases</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          AI Agricultural Market Intelligence Assistant
        </h1>
        <p className="text-xs text-slate-500">
          Ask complex market questions in natural language. The assistant queries live database models before responding.
        </p>
      </div>

      {/* Suggested chips */}
      <div className="shrink-0 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {suggestedQueries.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition shrink-0 shadow-2xs"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-emerald-700 text-white font-medium rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none space-y-3'
                }`}
              >
                {/* Message body with basic markdown support */}
                <div className="space-y-2 whitespace-pre-line font-normal">
                  {m.text}
                </div>

                {/* Citations & Sources for Bot Messages */}
                {!isUser && m.dataSources && m.dataSources.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-600">Verified Sources:</span>
                      {m.dataSources.map((src, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">
                          {src}
                        </span>
                      ))}
                    </div>
                    {m.confidence && (
                      <span className="font-bold text-emerald-700">
                        {Math.round(m.confidence * 100)}% Verified Confidence
                      </span>
                    )}
                  </div>
                )}

                <div className={`text-[10px] pt-1 text-right ${isUser ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {m.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Querying database models and statistical estimators...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="shrink-0 flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-300 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition"
      >
        <input
          type="text"
          placeholder="Ask a factual question (e.g. 'Compare potato prices in Delhi and Agra', 'Predict mustard prices')..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-4 py-2 text-xs text-slate-800 focus:outline-none placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <span>Send Query</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
