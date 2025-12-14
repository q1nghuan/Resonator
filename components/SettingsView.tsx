import React from 'react';
import { UserSettings, AgentType, AgentPersona } from '../types';
import { User, Moon, Sun, Clock, Save, Bot, Heart } from 'lucide-react';
import { AGENT_PERSONAS } from '../constants';

interface SettingsViewProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = React.useState<UserSettings>({
    ...settings,
    agentPersonas: settings.agentPersonas || {
      [AgentType.COMPANION]: AGENT_PERSONAS[AgentType.COMPANION],
      [AgentType.IDEAL_SELF]: AGENT_PERSONAS[AgentType.IDEAL_SELF]
    }
  });
  const [isSaved, setIsSaved] = React.useState(false);
  const [expandedAgent, setExpandedAgent] = React.useState<AgentType | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    // 修改这里：将 max-w-2xl 改为 max-w-4xl (或者 5xl/6xl) 以增加宽度
    <div className="w-full max-w-2xl mx-auto pt-4">
      <div className="mb-8">
        <h2 className="text-2xl font-serif font-bold text-slate-300">设置</h2>
        <p className="text-slate-500 text-sm">自定义你的 Resonator 体验。</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-8">
        
        {/* Profile Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <User size={16} /> 个人资料
          </h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">显示名称</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Bio-Rhythm Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
             <Clock size={16} /> 能量与日程
          </h3>
          <p className="text-sm text-slate-500">帮助AI在合适的时间建议任务。</p>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">工作开始时间</label>
              <select 
                value={formData.workStartHour}
                onChange={e => setFormData({...formData, workStartHour: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary text-slate-800"
              >
                {Array.from({length: 24}).map((_, i) => (
                  <option key={i} value={i}>{i}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">工作结束时间</label>
              <select 
                value={formData.workEndHour}
                onChange={e => setFormData({...formData, workEndHour: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary text-slate-800"
              >
                {Array.from({length: 24}).map((_, i) => (
                  <option key={i} value={i}>{i}:00</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* AI Agent Customization */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Bot size={16} /> AI 代理自定义
          </h3>
          <p className="text-sm text-slate-500">自定义你的AI代理的人格和回复风格。</p>
          
          <div className="space-y-4">
            {/* Companion Agent */}
            <div className="border border-slate-200 rounded-xl p-4">
              <button
                type="button"
                onClick={() => setExpandedAgent(expandedAgent === AgentType.COMPANION ? null : AgentType.COMPANION)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Heart size={20} className="text-rose-500" />
                  <div className="text-left">
                    <div className="font-semibold text-slate-800">
                      {formData.agentPersonas?.[AgentType.COMPANION]?.name || AGENT_PERSONAS[AgentType.COMPANION].name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formData.agentPersonas?.[AgentType.COMPANION]?.description || AGENT_PERSONAS[AgentType.COMPANION].description}
                    </div>
                  </div>
                </div>
                <span className="text-slate-400">{expandedAgent === AgentType.COMPANION ? '▼' : '▶'}</span>
              </button>
              
              {expandedAgent === AgentType.COMPANION && (
                <div className="mt-4 space-y-3 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">名称</label>
                    <input
                      type="text"
                      value={formData.agentPersonas?.[AgentType.COMPANION]?.name || ''}
                      onChange={e => setFormData({
                        ...formData,
                        agentPersonas: {
                          ...formData.agentPersonas!,
                          [AgentType.COMPANION]: {
                            ...formData.agentPersonas![AgentType.COMPANION],
                            name: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">描述</label>
                    <input
                      type="text"
                      value={formData.agentPersonas?.[AgentType.COMPANION]?.description || ''}
                      onChange={e => setFormData({
                        ...formData,
                        agentPersonas: {
                          ...formData.agentPersonas!,
                          [AgentType.COMPANION]: {
                            ...formData.agentPersonas![AgentType.COMPANION],
                            description: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">系统指令</label>
                    <textarea
                      value={formData.agentPersonas?.[AgentType.COMPANION]?.systemInstruction || ''}
                      onChange={e => setFormData({
                        ...formData,
                        agentPersonas: {
                          ...formData.agentPersonas!,
                          [AgentType.COMPANION]: {
                            ...formData.agentPersonas![AgentType.COMPANION],
                            systemInstruction: e.target.value
                          }
                        }
                      })}
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                      placeholder="定义这个代理的行为和回复风格..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Ideal Self Agent */}
            <div className="border border-slate-200 rounded-xl p-4">
              <button
                type="button"
                onClick={() => setExpandedAgent(expandedAgent === AgentType.IDEAL_SELF ? null : AgentType.IDEAL_SELF)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Bot size={20} className="text-indigo-500" />
                  <div className="text-left">
                    <div className="font-semibold text-slate-800">
                      {formData.agentPersonas?.[AgentType.IDEAL_SELF]?.name || AGENT_PERSONAS[AgentType.IDEAL_SELF].name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formData.agentPersonas?.[AgentType.IDEAL_SELF]?.description || AGENT_PERSONAS[AgentType.IDEAL_SELF].description}
                    </div>
                  </div>
                </div>
                <span className="text-slate-400">{expandedAgent === AgentType.IDEAL_SELF ? '▼' : '▶'}</span>
              </button>
              
              {expandedAgent === AgentType.IDEAL_SELF && (
                <div className="mt-4 space-y-3 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">名称</label>
                    <input
                      type="text"
                      value={formData.agentPersonas?.[AgentType.IDEAL_SELF]?.name || ''}
                      onChange={e => setFormData({
                        ...formData,
                        agentPersonas: {
                          ...formData.agentPersonas!,
                          [AgentType.IDEAL_SELF]: {
                            ...formData.agentPersonas![AgentType.IDEAL_SELF],
                            name: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">描述</label>
                    <input
                      type="text"
                      value={formData.agentPersonas?.[AgentType.IDEAL_SELF]?.description || ''}
                      onChange={e => setFormData({
                        ...formData,
                        agentPersonas: {
                          ...formData.agentPersonas!,
                          [AgentType.IDEAL_SELF]: {
                            ...formData.agentPersonas![AgentType.IDEAL_SELF],
                            description: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">系统指令</label>
                    <textarea
                      value={formData.agentPersonas?.[AgentType.IDEAL_SELF]?.systemInstruction || ''}
                      onChange={e => setFormData({
                        ...formData,
                        agentPersonas: {
                          ...formData.agentPersonas!,
                          [AgentType.IDEAL_SELF]: {
                            ...formData.agentPersonas![AgentType.IDEAL_SELF],
                            systemInstruction: e.target.value
                          }
                        }
                      })}
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                      placeholder="定义这个代理的行为和回复风格..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Appearance */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
             外观
          </h3>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setFormData({...formData, theme: 'light'})}
              className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                formData.theme === 'light' 
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200' 
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Sun size={24} />
              <span className="text-sm font-medium">浅色模式</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, theme: 'dark'})}
              className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                formData.theme === 'dark' 
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200' 
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Moon size={24} />
              <span className="text-sm font-medium">深色模式</span>
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-semibold shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isSaved ? '保存成功！' : (
                <>
                    <Save size={18} /> 保存设置
                </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};