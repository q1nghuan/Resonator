import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { X, Calendar, Clock, Briefcase, User, Sparkles, Heart, Trash2, Check, AlertTriangle, TrendingUp } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  initialTask?: Task | null;
}

const CATEGORIES = [
  { id: 'work', label: '工作', icon: Briefcase, color: 'bg-violet-100 text-violet-600 border-violet-200' },
  { id: 'personal', label: '个人', icon: User, color: 'bg-rose-100 text-rose-600 border-rose-200' },
  { id: 'growth', label: '成长', icon: Sparkles, color: 'bg-sky-100 text-sky-600 border-sky-200' },
  { id: 'health', label: '健康', icon: Heart, color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
] as const;

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, onDelete, initialTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Task['category']>('personal');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [importance, setImportance] = useState<Task['importance']>('medium');
  const [urgency, setUrgency] = useState<Task['urgency']>('medium');

  // Reset or populate form when opening
  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description || '');
        setCategory(initialTask.category);
        setDuration(initialTask.durationMinutes);
        setImportance(initialTask.importance || 'medium');
        setUrgency(initialTask.urgency || 'medium');
        
        if (initialTask.dueTime) {
          const d = new Date(initialTask.dueTime);
          setDate(d.toISOString().split('T')[0]);
          setTime(d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' }));
        }
      } else {
        // Defaults for new task
        setTitle('');
        setDescription('');
        setCategory('personal');
        setDuration(30);
        setImportance('medium');
        setUrgency('medium');
        const now = new Date();
        setDate(now.toISOString().split('T')[0]);
        setTime(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' }));
      }
    }
  }, [isOpen, initialTask]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct ISO date string from date + time inputs
    let dueTime = new Date().toISOString();
    if (date && time) {
        const dateTimeStr = `${date}T${time}`;
        dueTime = new Date(dateTimeStr).toISOString();
    }

    const newTask: Task = {
      id: initialTask?.id || Date.now().toString(),
      title,
      description,
      status: initialTask?.status || TaskStatus.TODO,
      category,
      durationMinutes: duration,
      dueTime,
      importance: importance === 'medium' ? undefined : importance,
      urgency: urgency === 'medium' ? undefined : urgency,
    };

    onSave(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-serif font-bold text-slate-800">
            {initialTask ? '编辑任务' : '新建任务'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Title & Category */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">需要做什么？</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：晨跑、完成报告"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 placeholder-slate-400"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all whitespace-nowrap ${
                    category === cat.id 
                      ? cat.color 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <cat.icon size={16} />
                  {cat.label}
                  {category === cat.id && <Check size={14} className="ml-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* Time & Duration (Stacked layout to prevent overlap) */}
          <div className="space-y-4">
             {/* Row 1: Date and Time */}
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                   <Calendar size={12} /> 日期和时间
                </label>
                <div className="flex gap-3">
                   <input 
                     type="date" 
                     value={date}
                     onChange={(e) => setDate(e.target.value)}
                     className="flex-[2] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:outline-none"
                   />
                   <input 
                     type="time" 
                     value={time}
                     onChange={(e) => setTime(e.target.value)}
                     className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:outline-none"
                   />
                </div>
             </div>
             
             {/* Row 2: Duration */}
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                   <Clock size={12} /> 时长（分钟）
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="5"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-xs">
                    分钟
                  </div>
                </div>
             </div>
          </div>

          {/* Priority Matrix */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <TrendingUp size={12} /> 优先级矩阵
              </label>
              <p className="text-xs text-slate-400 mb-3">帮助您更好地安排任务优先级</p>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Importance */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">重要性</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setImportance('high')}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        importance === 'high'
                          ? 'bg-red-100 text-red-700 border-2 border-red-300'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      高
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportance('medium')}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        importance === 'medium'
                          ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      中
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportance('low')}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        importance === 'low'
                          ? 'bg-green-100 text-green-700 border-2 border-green-300'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      低
                    </button>
                  </div>
                </div>
                
                {/* Urgency */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">紧急性</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setUrgency('high')}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        urgency === 'high'
                          ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      高
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrgency('medium')}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        urgency === 'medium'
                          ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      中
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrgency('low')}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        urgency === 'low'
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      低
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">备注</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加详细信息、子任务或反思..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 text-sm placeholder-slate-400 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
             {initialTask && onDelete ? (
               <button 
                 type="button"
                 onClick={() => {
                    if(confirm('确定要删除这个任务吗？')) {
                        onDelete(initialTask.id);
                        onClose();
                    }
                 }}
                 className="flex items-center gap-2 text-rose-500 hover:text-rose-600 text-sm font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
               >
                 <Trash2 size={16} /> 删除
               </button>
             ) : (
                <div></div> /* Spacer */
             )}

             <div className="flex gap-3">
               <button 
                 type="button" 
                 onClick={onClose}
                 className="px-5 py-2.5 text-slate-500 font-medium hover:bg-slate-100 rounded-xl transition-colors"
               >
                 取消
               </button>
               <button 
                 type="submit"
                 className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95"
               >
                 {initialTask ? '保存更改' : '创建任务'}
               </button>
             </div>
          </div>

        </form>
      </div>
    </div>
  );
};