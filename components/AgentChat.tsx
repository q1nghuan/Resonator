import React, { useState, useRef, useEffect } from 'react';
import { AgentType, ChatMessage, TaskAction, UserSettings } from '../types';
import { Sparkles, Heart, Bot, ArrowRight, X, Check, Lightbulb } from 'lucide-react';
import { AGENT_PERSONAS } from '../constants';

interface AgentChatProps {
  messages: ChatMessage[];
  currentAgent: AgentType;
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  onAgentChange?: (agent: AgentType) => void; // 可选，用于向后兼容
  onApproveAction: (action: TaskAction, messageId: string) => void;
  onDismissAction: (action: TaskAction, messageId: string) => void;
  userSettings?: UserSettings;
}

export const AgentChat: React.FC<AgentChatProps> = ({ 
  messages, 
  currentAgent, 
  isTyping, 
  onSendMessage, 
  onAgentChange,
  onApproveAction,
  onDismissAction,
  userSettings
}) => {
  // 获取当前agent的配置（自定义或默认）
  const getAgentPersona = (agentType: AgentType) => {
    return userSettings?.agentPersonas?.[agentType] || AGENT_PERSONAS[agentType];
  };
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Action Card Component
  const ActionCard: React.FC<{ action: TaskAction, messageId: string }> = ({ action, messageId }) => {
    const actionTitle = () => {
        if (action.type === 'ADD' && action.taskData) return `计划: ${action.taskData.title}`;
        if (action.type === 'UPDATE') return `调整任务`;
        if (action.type === 'DELETE') return `删除任务`;
        if (action.type === 'RESCHEDULE') return `重新安排`;
        return '建议';
    };

    return (
      <div className="mt-4 bg-white border border-indigo-100 rounded-xl p-4 shadow-sm relative overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-300">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full -z-0"></div>

        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-indigo-100 text-primary rounded-lg">
                    <Sparkles size={14} />
                </div>
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                    {actionTitle()}
                </span>
            </div>

            {/* AI Reasoning / Advice */}
            <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex gap-2 items-start">
                    <Lightbulb size={14} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                        "{action.reason}"
                    </p>
                </div>
                {action.taskData?.description && (
                    <p className="text-xs text-slate-400 mt-2 pl-6 border-l-2 border-slate-200">
                        备注: {action.taskData.description}
                    </p>
                )}
            </div>

            {/* Task Details Preview (if ADD/UPDATE) */}
            {action.taskData && (
                <div className="flex gap-4 text-xs text-slate-500 mb-4 px-1">
                    {action.taskData.durationMinutes && (
                        <span>⏱ {action.taskData.durationMinutes} min</span>
                    )}
                    {action.taskData.dueTime && (
                        <span>📅 {new Date(action.taskData.dueTime).toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit', timeZone: 'Asia/Shanghai'})}</span>
                    )}
                </div>
            )}
            
            <div className="flex gap-2">
                <button 
                    onClick={() => onApproveAction(action, messageId)}
                    className="flex-1 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                >
                    <Check size={14} /> 应用
                </button>
                <button 
                    onClick={() => onDismissAction(action, messageId)}
                    className="px-3 py-2 bg-white border border-slate-200 text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-50 hover:text-slate-600 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
      </div>
    );
  };

  const persona = getAgentPersona(currentAgent);
  const IconComponent = currentAgent === AgentType.COMPANION ? Heart : Bot;

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-xl border-l border-slate-200">
      {/* Header - Single Agent Display */}
      <div className="p-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${
            currentAgent === AgentType.COMPANION 
              ? 'bg-rose-100 text-rose-600' 
              : 'bg-indigo-100 text-indigo-600'
          }`}>
            <IconComponent size={18} className={currentAgent === AgentType.COMPANION ? 'fill-current' : ''} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 text-sm">{persona.name}</h3>
            <p className="text-xs text-slate-500">{persona.description}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div 
                className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-br-none' 
                    : currentAgent === AgentType.COMPANION 
                        ? 'bg-rose-50 text-slate-800 rounded-bl-none border border-rose-100'
                        : 'bg-indigo-50 text-slate-800 rounded-bl-none border border-indigo-100'
                }`}
              >
                {msg.text}
              </div>
              
              {/* Render actions if they exist in the message */}
              {msg.suggestedActions?.map((action, idx) => (
                <ActionCard key={`${msg.id}-action-${idx}`} action={action} messageId={msg.id} />
              ))}
              
              <span className="text-[10px] text-slate-300 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Shanghai'})}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-bl-none flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`与你的${getAgentPersona(currentAgent).name}对话...`}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 resize-none h-12"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
