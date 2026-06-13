import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, X } from 'lucide-react';
import { UserEcoState } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface SmartAssistantProps {
  ecoState: UserEcoState;
}

export default function SmartAssistant({ ecoState }: SmartAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your Smart Eco Assistant. Based on your profile, how can I help you optimize your carbon footprint today?",
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate AI decision making based on user context
    setTimeout(() => {
      let aiResponseContext = "";
      const lowerInput = userMsg.content.toLowerCase();
      
      if (lowerInput.includes('score') || lowerInput.includes('footprint')) {
        aiResponseContext = `Your current score is ${ecoState.profile?.baselineScore || 0} kg CO₂. You're doing great!`;
      } else if (lowerInput.includes('habit') || lowerInput.includes('tips')) {
        aiResponseContext = `I recommend focusing on your largest emissions category. Have you tried switching to a plant-based meal today?`;
      } else {
        aiResponseContext = "That's an interesting question! Based on your tracking, taking shorter showers and carpooling can save up to 15% of your daily emissions. Would you like me to add that as a goal?";
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseContext,
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 z-40 focus:outline-none focus:ring-4 focus:ring-emerald-300"
        aria-label="Open Smart Assistant"
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">Eco Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white rounded-md"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`p-3 rounded-2xl max-w-[75%] text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for eco advice..."
              className="flex-1 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Type your message"
            />
            <button
              onClick={handleSend}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              aria-label="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
