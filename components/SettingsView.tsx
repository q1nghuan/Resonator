import React from 'react';
import { UserSettings } from '../types';
import { User, Moon, Sun, Clock, Save } from 'lucide-react';

interface SettingsViewProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = React.useState<UserSettings>(settings);
  const [isSaved, setIsSaved] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <div className="mb-8">
        <h2 className="text-2xl font-serif font-bold text-slate-800">设置</h2>
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
