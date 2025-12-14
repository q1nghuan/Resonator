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
        <h2 className="text-2xl font-serif font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500 text-sm">Customize your Resonator experience.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-8">
        
        {/* Profile Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <User size={16} /> Profile
          </h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
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
             <Clock size={16} /> Energy & Schedule
          </h3>
          <p className="text-sm text-slate-500">Helping the AI suggest tasks at the right time.</p>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Work Start Hour</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Work End Hour</label>
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
             Appearance
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
              <span className="text-sm font-medium">Light Mode</span>
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
              <span className="text-sm font-medium">Dark Mode</span>
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-semibold shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isSaved ? 'Saved Successfully!' : (
                <>
                    <Save size={18} /> Save Settings
                </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
