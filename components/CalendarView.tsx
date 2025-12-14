import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, MoodEntry } from '../types';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, ArrowUpRight, Star } from 'lucide-react';
import { ResonanceWave, HolisticBalance, ChronotypeScatter } from './Visualizations';

interface CalendarViewProps {
  tasks: Task[];
  moodHistory: MoodEntry[];
  onEditTask: (task: Task) => void;
}

// --- COSMIC PALETTE (Neon/Pastel on Dark) ---
const COLORS = {
    work: '#a78bfa',    // Soft Purple
    personal: '#fb7185',// Soft Rose
    growth: '#38bdf8',  // Soft Cyan
    health: '#34d399',  // Soft Emerald
    orbit: 'rgba(255, 255, 255, 0.08)',
    star: '#fff'
};

const CATEGORY_LABELS = {
    work: 'Work',
    personal: 'Life',
    growth: 'Growth',
    health: 'Health'
};

type DayStats = {
  totalDuration: number;
  count: number;
  categories: Record<string, number>;
};

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, moodHistory, onEditTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // --- Logic ---
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(year, month);
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // --- Stats Processing ---
  const dayStats = useMemo(() => {
    const stats: Record<number, DayStats> = {};
    tasks.forEach(task => {
        if (!task.dueTime) return;
        const d = new Date(task.dueTime);
        if (d.getMonth() === month && d.getFullYear() === year) {
            const day = d.getDate();
            if (!stats[day]) stats[day] = { totalDuration: 0, count: 0, categories: { work: 0, personal: 0, growth: 0, health: 0 } };
            stats[day].totalDuration += task.durationMinutes || 0;
            stats[day].count += 1;
            const cat = task.category;
            stats[day].categories[cat] = (stats[day].categories[cat] || 0) + (task.durationMinutes || 0);
        }
    });
    return stats;
  }, [tasks, month, year]);

  const maxDuration = useMemo(() => {
    let max = 0;
    Object.values(dayStats).forEach((s) => { 
        const stat = s as DayStats;
        if (stat.totalDuration > max) max = stat.totalDuration; 
    });
    return Math.max(max, 120); 
  }, [dayStats]);

  const selectedDateTasks = useMemo(() => {
    return tasks.filter(task => {
        if (!task.dueTime) return false;
        const taskDate = new Date(task.dueTime);
        return (
        taskDate.getDate() === selectedDate.getDate() &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getFullYear() === selectedDate.getFullYear()
        );
    }).sort((a, b) => (a.dueTime || '') > (b.dueTime || '') ? 1 : -1);
  }, [tasks, selectedDate]);

  // --- Geometry Logic ---
  const getPosition = (day: number, totalDays: number, radius: number) => {
      // Start from Top (-PI/2)
      const angleStep = (2 * Math.PI) / totalDays;
      const angle = -Math.PI / 2 + (day - 1) * angleStep;
      // Convert polar to cartesian (percentage based 0-100)
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);
      return { x, y, angle }; // Return angle for rotation calculations
  };

  // --- Sub-Components ---

  // The glowing planet node
  const PlanetNode = ({ day, stats, isToday }: { day: number, stats?: DayStats, isToday: boolean }) => {
     // Planet size based on load
     const size = stats ? 12 + Math.min(stats.count, 8) * 2 : 4; 
     
     // Color mixing
     let mainColor = COLORS.star;
     if (stats) {
         // Determine dominant category
         const entries = Object.entries(stats.categories);
         const dominant = entries.reduce((a, b) => a[1] > b[1] ? a : b);
         if (dominant[1] > 0) mainColor = COLORS[dominant[0] as keyof typeof COLORS];
     }

     return (
        <div className="relative flex items-center justify-center group">
            {/* Glow Halo */}
            <div 
                className={`absolute rounded-full blur-md transition-all duration-500 ${isToday ? 'opacity-80 scale-150' : 'opacity-0 group-hover:opacity-60 scale-125'}`}
                style={{ backgroundColor: mainColor, width: size * 2.5, height: size * 2.5 }}
            ></div>
            
            {/* Core Body */}
            <div 
                className={`rounded-full transition-all duration-300 relative z-10 border border-white/20 ${isToday ? 'animate-pulse' : ''}`}
                style={{ 
                    backgroundColor: stats ? mainColor : 'rgba(255,255,255,0.3)',
                    width: size, 
                    height: size,
                    boxShadow: isToday ? `0 0 15px ${mainColor}` : 'none'
                }}
            >
                {/* Rings for tasks */}
                {stats && stats.count > 0 && (
                    <div className="absolute inset-0 -m-1 rounded-full border border-white/30 animate-spin-slow" style={{ animationDuration: '8s' }}></div>
                )}
            </div>

            {/* Label */}
            <span className={`absolute -bottom-6 text-[10px] font-mono tracking-widest transition-all duration-300 ${isToday ? 'text-white font-bold opacity-100' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`}>
                {day}
            </span>
        </div>
     );
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(year, month, day));
    setIsDayModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full relative w-full pt-2">
        
        <style>{`
            @keyframes orbit {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .orbit-ring {
                animation: orbit 120s linear infinite;
            }
            .orbit-ring-reverse {
                animation: orbit 180s linear infinite reverse;
            }
        `}</style>

        {/* --- HERO TITLE --- */}
        <div className="text-center mb-8 relative z-20 animate-in fade-in duration-1000">
            <h2 className="text-4xl md:text-5xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                The Astrolabe
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-2 uppercase tracking-[0.4em]">
                {new Date(year, month).toLocaleString('default', { month: 'long' })} • {year}
            </p>
        </div>

        {/* --- MAIN ASTROLABE SVG --- */}
        <div className="relative w-full max-w-[600px] aspect-square mx-auto mb-16 select-none perspective-[1000px]">
            
            {/* 1. Background Universe Layers */}
            <div className="absolute inset-0 flex items-center justify-center">
                {/* Outer faint ring */}
                <div className="w-[95%] h-[95%] rounded-full border border-white/5 absolute orbit-ring-reverse opacity-30"></div>
                {/* Middle dashed ring */}
                <div className="w-[75%] h-[75%] rounded-full border border-dashed border-white/10 absolute orbit-ring opacity-50"></div>
                {/* Inner solid ring */}
                <div className="w-[55%] h-[55%] rounded-full border border-indigo-500/10 absolute shadow-[0_0_50px_rgba(79,70,229,0.1)]"></div>
            </div>

            {/* 2. Interactive SVG Layer */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible z-10">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <radialGradient id="sunGradient">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.8"/>
                        <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0"/>
                    </radialGradient>
                </defs>

                {/* Constellation Lines (Connecting days with tasks) */}
                <g className="opacity-20 stroke-white/50" strokeWidth="0.1">
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        if (!dayStats[day]) return null;
                        // Simple logic: connect to previous day if it also had tasks
                        const prevDay = day - 1;
                        if (prevDay > 0 && dayStats[prevDay]) {
                             const p1 = getPosition(day, daysInMonth, 38);
                             const p2 = getPosition(prevDay, daysInMonth, 38);
                             return <line key={`line-${day}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
                        }
                        return null;
                    })}
                </g>
            </svg>

            {/* 3. The Core (Month Controller) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center w-32 h-32 rounded-full glass-card hover:bg-white/10 transition-all duration-500 group">
                 <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity"></div>
                 
                 <div className="flex items-center gap-4 z-10">
                    <button onClick={prevMonth} className="text-slate-500 hover:text-white transition-colors"><ChevronLeft size={16}/></button>
                    <div className="text-center">
                        <span className="block text-2xl font-serif text-white font-bold drop-shadow-md">
                            {currentDate.toLocaleString('default', { month: 'short' }).toUpperCase()}
                        </span>
                    </div>
                    <button onClick={nextMonth} className="text-slate-500 hover:text-white transition-colors"><ChevronRight size={16}/></button>
                 </div>
            </div>

            {/* 4. The Planets (Interactive DOM Elements) */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                // Position planets on the 38% radius circle (76% diameter)
                const pos = getPosition(day, daysInMonth, 38); 
                const stats = dayStats[day];
                const isToday = day === new Date().getDate() && month === new Date().getMonth();

                return (
                    <div
                        key={day}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                    >
                        <button
                            onClick={() => stats && handleDayClick(day)}
                            className={`outline-none focus:scale-110 transition-transform ${!stats ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            <PlanetNode day={day} stats={stats} isToday={isToday} />
                        </button>
                    </div>
                );
            })}
        </div>

        {/* --- LEGEND --- */}
        <div className="flex justify-center gap-8 mb-16 relative z-10">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                const color = COLORS[key as keyof typeof COLORS];
                return (
                    <div key={key} className="flex items-center gap-2 group cursor-default opacity-60 hover:opacity-100 transition-opacity">
                        <div className="w-2 h-2 rounded-full shadow-[0_0_8px] transition-transform group-hover:scale-125" style={{ backgroundColor: color, shadowColor: color }}></div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300">{label}</span>
                    </div>
                );
            })}
        </div>

        {/* --- ANALYSIS SECTION --- */}
        <div className="relative z-10 px-4 pb-12">
            <h3 className="text-center font-mono text-xs text-slate-500 mb-8 uppercase tracking-[0.2em] opacity-50">
                — Resonance Patterns —
            </h3>
            
            <ResonanceWave data={moodHistory} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <HolisticBalance tasks={tasks} />
                <ChronotypeScatter tasks={tasks} />
            </div>
        </div>

        {/* --- GLASS MODAL (Deep Space Edition) --- */}
        {isDayModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div 
                    className="glass-panel rounded-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col max-h-[80vh] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-t border-white/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex justify-between items-start shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent"></div>
                        <div className="relative z-10">
                             <h3 className="text-5xl font-serif italic text-white drop-shadow-lg">
                                {selectedDate.getDate()}
                             </h3>
                             <p className="text-xs text-indigo-300 font-mono uppercase tracking-[0.3em] mt-2">
                                {selectedDate.toLocaleDateString('en-US', { month: 'long', weekday: 'long' })}
                             </p>
                        </div>
                        <button onClick={() => setIsDayModalOpen(false)} className="relative z-10 p-2 text-slate-400 hover:text-white transition-colors hover:rotate-90 duration-300">
                            <X size={20} />
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 overflow-y-auto scrollbar-hide space-y-4 flex-1">
                         {selectedDateTasks.length === 0 ? (
                            <div className="text-center py-16 opacity-40">
                                <Star size={24} className="mx-auto mb-3 text-white" />
                                <span className="text-xs font-mono text-slate-300">No signals detected.</span>
                            </div>
                         ) : (
                            selectedDateTasks.map((task, idx) => (
                                <div 
                                    key={task.id} 
                                    onClick={() => {
                                        setIsDayModalOpen(false);
                                        onEditTask(task);
                                    }}
                                    className="group relative p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md"
                                    style={{ animationDelay: `${idx * 75}ms` }}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-[9px] font-bold font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 ${
                                            task.category === 'work' ? 'text-purple-300 bg-purple-500/10' :
                                            task.category === 'growth' ? 'text-cyan-300 bg-cyan-500/10' :
                                            task.category === 'health' ? 'text-emerald-300 bg-emerald-500/10' :
                                            'text-rose-300 bg-rose-500/10'
                                        }`}>
                                            {task.category}
                                        </span>
                                        {task.dueTime && (
                                            <span className="text-xs text-slate-400 font-mono">
                                                {new Date(task.dueTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className={`font-serif text-lg text-white/90 ${task.status === TaskStatus.DONE ? 'line-through opacity-40' : ''}`}>
                                        {task.title}
                                    </h4>
                                    
                                    <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                        <ArrowUpRight size={18} className="text-white/70" />
                                    </div>
                                </div>
                            ))
                         )}
                    </div>
                </div>
             </div>
        )}
    </div>
  );
};