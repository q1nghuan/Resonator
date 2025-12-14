import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { MoodEntry, Task } from '../types';
import { Activity, Hexagon, Clock4 } from 'lucide-react';

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
    
    const data = tasks
        .filter(t => t.dueTime)
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

export const DashboardVisuals: React.FC<VisualizationsProps> = ({ moodHistory, tasks }) => {
  return (
    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
    </div>
  );
};