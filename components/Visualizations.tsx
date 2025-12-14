import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { MoodEntry, Task } from '../types';
import { Activity, Hexagon, Clock4, Target } from 'lucide-react';

interface VisualizationsProps {
  moodHistory: MoodEntry[];
  tasks: Task[];
}

// --- COSMIC PALETTE ---
const COLORS = {
    work: '#a78bfa',    // Purple
    personal: '#fb7185',// Rose
    growth: '#38bdf8',  // Cyan
    health: '#34d399',  // Emerald
    neutral: '#94a3b8'  // Slate
};

// --- Custom Tooltip Component (Glass) ---
const CustomTooltip = ({ active, payload, label, type }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-xl text-xs font-medium text-white">
        {type === 'scatter' ? (
             <>
                <p className="text-indigo-300 font-serif font-bold mb-1 text-sm">{payload[0].payload.name}</p>
                <div className="flex gap-3 text-slate-300">
                    <span>{payload[0].payload.timeStr}</span>
                    <span className="bg-white/10 px-1.5 py-0.5 rounded text-slate-200">{payload[0].value}m</span>
                </div>
             </>
        ) : (
            <>
                <p className="text-slate-400 mb-1 uppercase tracking-wider text-[10px] font-bold">{label || payload[0].name}</p>
                <p className="text-white font-serif text-lg leading-none">
                {payload[0].value} <span className="text-[10px] font-sans font-normal text-slate-400 align-top">{payload[0].unit || ''}</span>
                </p>
            </>
        )}
      </div>
    );
  }
  return null;
};

// --- Component 1: Resonance Wave (Mood) ---
export const ResonanceWave: React.FC<{ data: MoodEntry[] }> = ({ data }) => {
  return (
    <div className="h-48 w-full glass-card rounded-3xl p-6 relative overflow-hidden group hover:bg-white/10 transition-colors duration-500">
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div>
            <h3 className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
               <Activity size={12} className="text-rose-400"/> 情绪流动
            </h3>
        </div>
      </div>
      
      <div className="absolute inset-0 pt-12 px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.personal} stopOpacity={0.4}/>
                <stop offset="100%" stopColor={COLORS.personal} stopOpacity={0}/>
                </linearGradient>
            </defs>
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: COLORS.personal, strokeWidth: 1, strokeDasharray: '2 2', opacity: 0.5 }} />
            <Area 
                type="monotone" 
                dataKey="score" 
                stroke={COLORS.personal}
                strokeWidth={2}
                fill="url(#colorMood)" 
                animationDuration={2000}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#fff', stroke: COLORS.personal }}
            />
            </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- Component 2: Holistic Balance (Radar) ---
export const HolisticBalance: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const categories = ['work', 'personal', 'growth', 'health'];
  
  const dataMap = tasks.reduce((acc, task) => {
    const duration = task.durationMinutes || 30;
    acc[task.category] = (acc[task.category] || 0) + duration;
    return acc;
  }, {} as Record<string, number>);

  const maxVal = Math.max(...(Object.values(dataMap) as number[]), 60);

  const data = categories.map(cat => ({
    subject: cat.charAt(0).toUpperCase() + cat.slice(1),
    A: dataMap[cat] || 0,
    fullMark: maxVal,
  }));

  return (
    <div className="h-48 w-full glass-card rounded-3xl p-6 flex flex-col hover:bg-white/10 transition-colors duration-500">
       <div className="flex items-center justify-between mb-0 z-10">
            <div>
                <h3 className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                   <Hexagon size={12} className="text-violet-400"/> 专注网络
                </h3>
            </div>
       </div>
       
       <div className="flex-1 min-h-0 -mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="52%" outerRadius="65%" data={data}>
                <PolarGrid stroke="#e2e8f0" strokeOpacity={0.1} />
                <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'Space Grotesk' }} 
                />
                <PolarRadiusAxis angle={30} domain={[0, maxVal]} tick={false} axisLine={false} />
                <Radar
                    name="Focus"
                    dataKey="A"
                    stroke={COLORS.work}
                    strokeWidth={1.5}
                    fill={COLORS.work}
                    fillOpacity={0.3}
                />
                <Tooltip content={<CustomTooltip />} />
                </RadarChart>
            </ResponsiveContainer>
       </div>
    </div>
  );
};

// --- Component 3: Chronotype Scatter (Scatter) ---
export const ChronotypeScatter: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    // 获取本周的开始和结束日期（UTC+8时区）
    const now = new Date();
    
    // 获取UTC+8时区的当前日期
    const getUTC8Date = (date: Date) => {
      const utc8Str = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        timeZone: 'Asia/Shanghai' 
      });
      const [month, day, year] = utc8Str.split('/').map(Number);
      return new Date(year, month - 1, day);
    };
    
    const today = getUTC8Date(now);
    
    // 计算本周一（周一作为一周的开始）
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    
    // 计算本周日
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    const data = tasks
        .filter(t => {
            if (!t.dueTime) return false;
            const taskDate = getUTC8Date(new Date(t.dueTime));
            // 检查任务日期是否在本周范围内（周一至周日）
            return taskDate >= monday && taskDate <= sunday;
        })
        .map(t => {
            const d = new Date(t.dueTime!);
            const hour = d.getHours() + d.getMinutes() / 60;
            return {
                x: hour,
                y: t.durationMinutes,
                name: t.title,
                category: t.category,
                timeStr: d.toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Shanghai'})
            };
        });

    return (
        <div className="h-48 w-full glass-card rounded-3xl p-6 flex flex-col hover:bg-white/10 transition-colors duration-500">
             <div className="flex items-center justify-between mb-0 z-10">
                <div>
                    <h3 className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                        <Clock4 size={12} className="text-sky-400"/> 节奏
                    </h3>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 15, right: 10, bottom: 0, left: -25 }}>
                    <PolarGrid stroke="#e2e8f0" strokeOpacity={0.1} />
                    <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="时间" 
                        unit="时" 
                        domain={[6, 22]} 
                        tick={{fontSize: 9, fill: '#64748b'}}
                        tickCount={5}
                        allowDataOverflow={false}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis 
                        type="number" 
                        dataKey="y" 
                        name="时长" 
                        unit=" 分钟" 
                        tick={{fontSize: 9, fill: '#64748b'}}
                        axisLine={false}
                        tickLine={false}
                    />
                    <ZAxis range={[50, 400]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3', stroke: '#475569' }} content={<CustomTooltip type="scatter" />} />
                    <Scatter name="任务" data={data} fill="#8884d8">
                        {data.map((entry, index) => {
                            const color = 
                                entry.category === 'work' ? COLORS.work : 
                                entry.category === 'health' ? COLORS.health : 
                                entry.category === 'growth' ? COLORS.growth : 
                                entry.category === 'personal' ? COLORS.personal :
                                COLORS.neutral; 
                            return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.7} stroke="none" />;
                        })}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};

// --- Component 4: Priority Matrix (Four Quadrants) ---
export const PriorityMatrix: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  // 获取本周的开始和结束日期（UTC+8时区）
  const now = new Date();
  const getUTC8Date = (date: Date) => {
    const utc8Str = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      timeZone: 'Asia/Shanghai' 
    });
    const [month, day, year] = utc8Str.split('/').map(Number);
    return new Date(year, month - 1, day);
  };
  
  const today = getUTC8Date(now);
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  // 过滤出本周且未完成的任务
  const activeTasks = tasks.filter(t => {
    if (t.status === 'DONE') return false;
    if (!t.dueTime) return false;
    const taskDate = getUTC8Date(new Date(t.dueTime));
    return taskDate >= monday && taskDate <= sunday;
  });
  
  // 将任务分类到四个象限
  const quadrants: Record<string, Task[]> = {
    '重要紧急': [],
    '重要非紧急': [],
    '非重要紧急': [],
    '非重要非紧急': [],
  };

  // 分类任务
  activeTasks.forEach(task => {
    const importance = task.importance || 'high'; // 默认为重要
    const urgency = task.urgency;
    
    if (!urgency && task.dueTime) {
      // 如果没有设置紧急性，根据截止时间推断
      const dueDate = new Date(task.dueTime);
      const now = new Date();
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const inferredUrgency = hoursUntilDue <= 24 ? 'high' : 'low';
      
      if (importance === 'high' && inferredUrgency === 'high') {
        quadrants['重要紧急'].push(task);
      } else if (importance === 'high' && inferredUrgency === 'low') {
        quadrants['重要非紧急'].push(task);
      } else if (importance === 'low' && inferredUrgency === 'high') {
        quadrants['非重要紧急'].push(task);
      } else {
        quadrants['非重要非紧急'].push(task);
      }
    } else {
      const finalUrgency = urgency || 'low';
      if (importance === 'high' && finalUrgency === 'high') {
        quadrants['重要紧急'].push(task);
      } else if (importance === 'high' && finalUrgency === 'low') {
        quadrants['重要非紧急'].push(task);
      } else if (importance === 'low' && finalUrgency === 'high') {
        quadrants['非重要紧急'].push(task);
      } else {
        quadrants['非重要非紧急'].push(task);
      }
    }
  });

  const quadrantConfig: Record<string, { 
    label: string; 
    bg: string; 
    border: string; 
    text: string;
    icon: string;
    description: string;
  }> = {
    '重要紧急': {
      label: '重要 · 紧急',
      bg: 'bg-gradient-to-br from-red-500/20 to-red-600/10',
      border: 'border-red-400/50',
      text: 'text-red-200',
      icon: '🔥',
      description: '立即处理'
    },
    '重要非紧急': {
      label: '重要 · 非紧急',
      bg: 'bg-gradient-to-br from-green-500/20 to-green-600/10',
      border: 'border-green-400/50',
      text: 'text-green-200',
      icon: '⭐',
      description: '计划执行'
    },
    '非重要紧急': {
      label: '非重要 · 紧急',
      bg: 'bg-gradient-to-br from-orange-500/20 to-orange-600/10',
      border: 'border-orange-400/50',
      text: 'text-orange-200',
      icon: '⚡',
      description: '委托他人'
    },
    '非重要非紧急': {
      label: '非重要 · 非紧急',
      bg: 'bg-gradient-to-br from-blue-500/20 to-blue-600/10',
      border: 'border-blue-400/50',
      text: 'text-blue-200',
      icon: '📋',
      description: '稍后处理'
    },
  };

  return (
    <div className="w-full glass-panel rounded-3xl p-6 relative overflow-hidden border border-white/10 mb-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Target size={18} className="text-indigo-300"/>
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-white">优先级矩阵</h3>
              <p className="text-xs text-slate-400 font-mono">任务优先级可视化</p>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            共 {activeTasks.length} 个任务
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(quadrantConfig).map(([key, config]) => (
            <div 
              key={key}
              className={`${config.bg} ${config.border} border-2 rounded-2xl p-4 backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}
            >
              {/* Quadrant decoration */}
              {/* <div className="absolute top-0 right-0 w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="absolute top-2 right-2 text-4xl">{config.icon}</div>
              </div> */}
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <div>
                      <div className={`text-sm font-bold ${config.text}`}>
                        {config.label}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {config.description}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs font-bold ${config.text} bg-white/10 px-2 py-1 rounded-full`}>
                    {quadrants[key].length}
                  </div>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
                  {quadrants[key].length > 0 ? (
                    quadrants[key].map(task => (
                      <div 
                        key={task.id} 
                        className={`text-xs ${config.text} bg-white/5 rounded-lg px-2 py-1.5 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer group/item`}
                        title={task.description || task.title}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 group-hover/item:opacity-100 transition-opacity"></span>
                          <span className="truncate flex-1">{task.title}</span>
                        </div>
                        {task.dueTime && (
                          <div className="text-[10px] text-slate-500 mt-1 ml-3.5">
                            {new Date(task.dueTime).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Asia/Shanghai'
                            })}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={`text-xs ${config.text} opacity-40 italic text-center py-4`}>
                      暂无任务
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const DashboardVisuals: React.FC<VisualizationsProps> = ({ moodHistory, tasks }) => {
  return (
    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 relative z-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">
                <ResonanceWave data={moodHistory} />
            </div>
            <div className="col-span-1">
                <HolisticBalance tasks={tasks} />
            </div>
            <div className="col-span-1">
                <ChronotypeScatter tasks={tasks} />
            </div>
        </div>
        {/* Priority Matrix - Full Width, with proper spacing and z-index */}
        <div className="w-full relative z-10">
            <PriorityMatrix tasks={tasks} />
        </div>
    </div>
  );
};