import React, { useMemo, useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle2, Circle, Clock, Plus, AlertCircle, Calendar } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
}

const TaskCard: React.FC<{ task: Task; onToggle: () => void; onEdit: () => void }> = ({ task, onToggle, onEdit }) => {
  const isDone = task.status === TaskStatus.DONE;
  
  // ---------------------------------------------------------
  // 实时计算是否过期
  // ---------------------------------------------------------
  const isOverdue = useMemo(() => {
    if (isDone || !task.dueTime) return false;
    return new Date(task.dueTime) < new Date();
  }, [task.dueTime, isDone]);

  // isReschedule: 既包括手动标记为重排的状态，也包括时间上已经过期的任务
  const isReschedule = task.status === TaskStatus.PENDING_RESCHEDULE || isOverdue;

  // Category Color Map for Dark Mode
  const CAT_STYLES = {
      work: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      personal: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      growth: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      health: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  };

  return (
    <div 
      className={`group relative p-4 rounded-xl border transition-all duration-300 hover:shadow-lg backdrop-blur-md ${
        isDone ? 'bg-white/5 border-white/5 opacity-50' : 
        isReschedule ? 'bg-amber-900/10 border-amber-500/30' : 
        'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-start gap-4">
        <button 
          onClick={onToggle}
          className={`mt-1 transition-colors ${
            isDone ? 'text-emerald-400' : 
            isReschedule ? 'text-amber-400 hover:text-emerald-400' : 
            'text-slate-500 hover:text-indigo-400'
          }`}
        >
          {isDone ? <CheckCircle2 size={22} /> : 
           isReschedule ? <AlertCircle size={22} /> : 
           <Circle size={22} />}
        </button>
        
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
          <div className="flex justify-between items-start gap-2">
            <h4 className={`font-medium text-lg leading-snug font-serif ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
              {task.title}
            </h4>
            <div className="flex gap-2">
                {isReschedule && !isDone && (
                    <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-bold bg-amber-500/20 text-amber-300 border border-amber-500/20">
                        {isOverdue ? '已过期' : '重排'}
                    </span>
                )}
                <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-bold border ${CAT_STYLES[task.category]}`}>
                    {task.category === 'work' ? '工作' : task.category === 'personal' ? '个人' : task.category === 'growth' ? '成长' : '健康'}
                </span>
            </div>
          </div>
          
          {task.description && (
             <div className={`mt-2 text-sm ${isDone ? 'text-slate-600' : 'text-slate-400'}`}>
                <p className="line-clamp-2">{task.description}</p>
             </div>
          )}
          
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            {task.dueTime && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${isReschedule ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-slate-400'}`}>
                <Clock size={12} />
                <span className="font-mono">{new Date(task.dueTime).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Shanghai'})}</span>
              </div>
            )}
            <div className="bg-white/5 px-2 py-1 rounded-md text-slate-400 font-mono">{task.durationMinutes} 分钟</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onToggleStatus, onAddTask, onEditTask }) => {
  // 强制刷新：每分钟更新一次组件，确保过期状态实时更新
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date();
  const todayDateStr = today.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    timeZone: 'Asia/Shanghai' 
  });

  const tasksByDate = useMemo(() => {
    // ---------------------------------------------------------
    // 过滤逻辑
    // ---------------------------------------------------------
    const filtered = tasks.filter(task => {
      if (!task.dueTime) return false;
      const taskDate = new Date(task.dueTime);
      const taskDateStr = taskDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Shanghai'
      });
      
      const isDone = task.status === TaskStatus.DONE;
      
      // 保留条件：(日期是今天或未来) 或者 (未完成的任务，即使日期是过去)
      return taskDateStr >= todayDateStr || !isDone;
    });

    const grouped: Record<string, Task[]> = {};
    filtered.forEach(task => {
      if (!task.dueTime) return;
      const taskDate = new Date(task.dueTime);
      const dateKey = taskDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Shanghai'
      });
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });


    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        // A. 优先把“已完成”的任务放到最后
        const isDoneA = a.status === TaskStatus.DONE;
        const isDoneB = b.status === TaskStatus.DONE;
        
        if (isDoneA !== isDoneB) {
            return isDoneA ? 1 : -1; // 完成的(true)排在未完成(false)后面
        }

        // B. 将时间字符串转为毫秒数 (Number) 再比较
        // 这样无论格式是 UTC ("...Z") 还是本地 ("...T10:00")，都会被 Date 对象正确解析为绝对时间
        const timeA = new Date(a.dueTime || 0).getTime();
        const timeB = new Date(b.dueTime || 0).getTime();
        
        // C. 如果时间戳完全相同，用 ID 兜底
        if (timeA === timeB) {
            return a.id > b.id ? 1 : -1;
        }

        return timeA - timeB; // 从小到大排序 (早 -> 晚)
      });
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(a.replace(/\//g, '-'));
      const dateB = new Date(b.replace(/\//g, '-'));
      return dateA.getTime() - dateB.getTime();
    });

    return sortedDates.map(dateKey => ({
      date: dateKey,
      tasks: grouped[dateKey]
    }));
  }, [tasks, todayDateStr]);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr.replace(/\//g, '-'));
    const today = new Date();
    // 重置时间部分以便只比较日期
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateZero = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const todayStr = today.toLocaleDateString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai'
    });
    
    // 判断是否是过去
    if (dateZero < todayZero) {
        return `已过期 - ${date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}`;
    }

    if (dateStr === todayStr) {
      return '今天';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai'
    });
    
    if (dateStr === tomorrowStr) {
      return '明天';
    }
    
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      timeZone: 'Asia/Shanghai'
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6 px-2">
        <div>
            <h2 className="text-2xl font-serif font-bold text-white tracking-wide">每日轨迹</h2>
            <p className="text-slate-400 text-xs font-mono mt-1">设计你的轨道。</p>
        </div>
        <button 
          onClick={onAddTask}
          className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)] active:scale-95 hover:rotate-90 duration-300"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-20 scrollbar-hide">
        {tasksByDate.length === 0 ? (
           <div className="text-center py-20 opacity-50">
             <p className="text-slate-400 font-serif italic text-lg">虚空中的寂静。</p>
           </div>
        ) : (
            tasksByDate.map(({ date, tasks }) => {
              // 判断该组是否全是过期任务
              const isPastGroup = date.includes('已过期');

              return (
                <div key={date} className="space-y-3">
                  <div className="flex items-center gap-2 px-2 sticky top-0 z-10 bg-transparent backdrop-blur-sm pb-2">
                    {isPastGroup ? (
                        <AlertCircle size={16} className="text-amber-500" />
                    ) : (
                        <Calendar size={16} className="text-indigo-400" />
                    )}
                    <h3 className={`text-sm font-mono font-bold uppercase tracking-wider ${isPastGroup ? 'text-amber-400' : 'text-indigo-300'}`}>
                      {formatDateLabel(date)}
                    </h3>
                    <div className={`flex-1 h-px bg-gradient-to-r ${isPastGroup ? 'from-amber-500/30' : 'from-indigo-500/30'} to-transparent`}></div>
                    <span className="text-xs text-slate-500 font-mono">{tasks.length} 个任务</span>
                  </div>
                  
                  <div className="space-y-3 pl-2">
                    {tasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onToggle={() => onToggleStatus(task.id)} 
                        onEdit={() => onEditTask(task)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};