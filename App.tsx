import React, { useState, useEffect, useRef } from 'react';
import { AgentType, Task, MoodEntry, ChatMessage, TaskStatus, TaskAction, UserSettings, UserHabits } from './types';
import { INITIAL_TASKS, INITIAL_MOOD_HISTORY, AGENT_PERSONAS } from './constants';
import { TaskBoard } from './components/TaskBoard';
import { AgentChat } from './components/AgentChat';
import { DashboardVisuals } from './components/Visualizations';
import { generateAgentResponse } from './services/geminiService';
import { TaskModal } from './components/TaskModal';
import { CalendarView } from './components/CalendarView';
import { SettingsView } from './components/SettingsView';
import { LayoutDashboard, Calendar, Settings, Trophy, Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  // --- State ---
  const [currentView, setCurrentView] = useState<'dashboard' | 'calendar' | 'settings'>('dashboard');
  
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>(INITIAL_MOOD_HISTORY);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: 'Alex',
    workStartHour: 9,
    workEndHour: 18,
    theme: 'dark', // Force dark for now given the redesign
    agentPersonas: undefined // 使用默认配置
  });
  
  // 用户习惯记录
  const [userHabits, setUserHabits] = useState<UserHabits>({
    preferredWorkTimes: [],
    taskPreferences: {
      preferredDuration: 30,
      preferredCategories: []
    },
    communicationStyle: '',
    recentPatterns: [],
    lastUpdated: Date.now()
  });
  
  // 用于记录用户消息历史，用于分析习惯
  const userMessagesRef = useRef<string[]>([]);
  
  // 按agent类型分别存储聊天记录
  const [chatMessagesByAgent, setChatMessagesByAgent] = useState<Record<AgentType, ChatMessage[]>>({
    [AgentType.COMPANION]: [
      {
        id: 'welcome-companion',
        role: 'model',
        text: "我们漂浮在时间的河流中。今天我们要专注于什么？",
        timestamp: Date.now()
      }
    ],
    [AgentType.IDEAL_SELF]: [
      {
        id: 'welcome-ideal',
        role: 'model',
        text: "我们站在成长的起点。今天我们要如何超越昨天的自己？",
        timestamp: Date.now()
      }
    ]
  });
  // 每个agent独立的typing状态
  const [isTypingByAgent, setIsTypingByAgent] = useState<Record<AgentType, boolean>>({
    [AgentType.COMPANION]: false,
    [AgentType.IDEAL_SELF]: false
  });
  const [toast, setToast] = useState<{message: string, icon: React.ReactNode} | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // --- Effects & Handlers (Logic remains same, updating mostly layout) ---
  useEffect(() => {
    if (toast) {
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const checkOverdueTasks = () => {
      const now = new Date();
      setTasks(prevTasks => prevTasks.map(task => {
        if (task.status === TaskStatus.TODO && task.dueTime) {
          const dueTime = new Date(task.dueTime);
          if (dueTime < now) {
            return { ...task, status: TaskStatus.PENDING_RESCHEDULE };
          }
        }
        return task;
      }));
    };
    checkOverdueTasks();
    const intervalId = setInterval(checkOverdueTasks, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const isCompleting = t.status !== TaskStatus.DONE;
        if (isCompleting) {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#a78bfa', '#fb7185', '#34d399'] });
            setToast({ message: "收集到星尘。", icon: <Trophy className="text-yellow-400" /> });
        }
        return { ...t, status: isCompleting ? TaskStatus.DONE : TaskStatus.TODO };
      }
      return t;
    }));
  };

  // 分析并更新用户习惯
  const updateUserHabits = (userMessage: string, suggestedActions: TaskAction[]) => {
    setUserHabits(prev => {
      const newHabits = { ...prev };
      
      // 记录用户消息
      userMessagesRef.current.push(userMessage);
      if (userMessagesRef.current.length > 20) {
        userMessagesRef.current.shift(); // 只保留最近20条
      }
      
      // 分析任务偏好
      suggestedActions.forEach(action => {
        if (action.taskData) {
          // 记录偏好的任务时长
          if (action.taskData.durationMinutes) {
            const durations = [...(newHabits.taskPreferences.preferredDuration ? [newHabits.taskPreferences.preferredDuration] : []), action.taskData.durationMinutes];
            newHabits.taskPreferences.preferredDuration = Math.round(
              durations.reduce((a, b) => a + b, 0) / durations.length
            );
          }
          
          // 记录偏好的任务类别
          if (action.taskData.category && !newHabits.taskPreferences.preferredCategories.includes(action.taskData.category)) {
            newHabits.taskPreferences.preferredCategories = [
              ...newHabits.taskPreferences.preferredCategories,
              action.taskData.category
            ].slice(-5); // 只保留最近5个
          }
          
          // 分析工作时间偏好
          if (action.taskData.dueTime) {
            const taskTime = new Date(action.taskData.dueTime);
            const hour = taskTime.getHours();
            const timeStr = `${hour}:00-${hour + 1}:00`;
            if (!newHabits.preferredWorkTimes.includes(timeStr)) {
              newHabits.preferredWorkTimes = [
                ...newHabits.preferredWorkTimes,
                timeStr
              ].slice(-10); // 只保留最近10个时间段
            }
          }
        }
      });
      
      // 分析沟通风格（从最近的消息中提取关键词）
      const recentMessages = userMessagesRef.current.slice(-5).join(' ');
      if (recentMessages.length > 0) {
        // 简单的风格分析
        if (recentMessages.includes('谢谢') || recentMessages.includes('感谢')) {
          newHabits.communicationStyle = '礼貌、正式';
        } else if (recentMessages.includes('！') || recentMessages.includes('？')) {
          newHabits.communicationStyle = '热情、直接';
        } else {
          newHabits.communicationStyle = '简洁、实用';
        }
      }
      
      // 记录最近模式
      if (suggestedActions.length > 0) {
        const pattern = suggestedActions.map(a => a.type).join(',');
        if (!newHabits.recentPatterns.includes(pattern)) {
          newHabits.recentPatterns = [...newHabits.recentPatterns, pattern].slice(-5);
        }
      }
      
      newHabits.lastUpdated = Date.now();
      return newHabits;
    });
  };

  const handleSendMessage = async (text: string, agentType: AgentType) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    
    // 将用户消息添加到对应agent的聊天记录中
    setChatMessagesByAgent(prev => ({
      ...prev,
      [agentType]: [...prev[agentType], userMsg]
    }));
    
    // 设置对应agent的typing状态
    setIsTypingByAgent(prev => ({ ...prev, [agentType]: true }));

    const moodContext = `用户上周平均心情为 ${(moodHistory.reduce((a,b) => a + b.score, 0) / moodHistory.length).toFixed(1)}/10。`;
    const aiResponse = await generateAgentResponse(
      agentType, 
      text, 
      tasks, 
      moodContext,
      userSettings,
      userHabits
    );
    
    // 更新用户习惯
    updateUserHabits(text, aiResponse.suggested_actions);
    
    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: aiResponse.response_text,
      timestamp: Date.now(),
      suggestedActions: aiResponse.suggested_actions
    };
    
    // 将AI回复添加到对应agent的聊天记录中
    setChatMessagesByAgent(prev => ({
      ...prev,
      [agentType]: [...prev[agentType], modelMsg]
    }));
    
    // 重置对应agent的typing状态
    setIsTypingByAgent(prev => ({ ...prev, [agentType]: false }));
  };

  const removeActionFromMessage = (messageId: string, actionToRemove: TaskAction, agentType: AgentType) => {
    setChatMessagesByAgent(prev => ({
      ...prev,
      [agentType]: prev[agentType].map(msg => {
        if (msg.id === messageId && msg.suggestedActions) {
          return { ...msg, suggestedActions: msg.suggestedActions.filter(a => a !== actionToRemove) };
        }
        return msg;
      })
    }));
  };

  const handleApproveAction = (action: TaskAction, messageId: string, agentType: AgentType) => {
    switch (action.type) {
      case 'ADD':
        if (action.taskData) {
          const newTask: Task = {
            id: Date.now().toString(),
            title: action.taskData.title || 'New Orbit',
            description: action.taskData.description || '',
            status: TaskStatus.TODO,
            category: action.taskData.category || 'personal',
            durationMinutes: action.taskData.durationMinutes || 30,
            dueTime: action.taskData.dueTime || new Date().toISOString(),
          };
          setTasks(prev => [...prev, newTask]);
          setToast({ message: "轨道已建立。", icon: <Rocket className="text-indigo-400" /> });
        }
        break;
      case 'UPDATE':
      case 'RESCHEDULE':
        if (action.taskId && action.taskData) {
          setTasks(prev => prev.map(t => {
            if (String(t.id) === String(action.taskId)) return { ...t, ...action.taskData, status: action.taskData.status || t.status };
            return t;
          }));
          setToast({ message: "轨迹已调整。", icon: <Rocket className="text-purple-400" /> });
        }
        break;
      case 'DELETE':
        if (action.taskId) setTasks(prev => prev.filter(t => String(t.id) !== String(action.taskId)));
        break;
    }
    removeActionFromMessage(messageId, action, agentType);
  };

  const handleDismissAction = (action: TaskAction, messageId: string, agentType: AgentType) => 
    removeActionFromMessage(messageId, action, agentType);


  const openCreateModal = () => { setEditingTask(null); setIsTaskModalOpen(true); };
  const openEditModal = (task: Task) => { setEditingTask(task); setIsTaskModalOpen(true); };
  const handleSaveTask = (taskToSave: Task) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === taskToSave.id ? taskToSave : t));
      setToast({ message: "信号已更新。", icon: <Rocket className="text-blue-400" /> });
    } else {
      setTasks(prev => [...prev, taskToSave]);
      setToast({ message: "新星诞生。", icon: <Rocket className="text-indigo-400" /> });
    }
    setIsTaskModalOpen(false);
  };
  const handleDeleteTask = (taskId: string) => { setTasks(prev => prev.filter(t => t.id !== taskId)); setIsTaskModalOpen(false); };

  // --- Render Views ---
  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return <CalendarView tasks={tasks} moodHistory={moodHistory} onEditTask={openEditModal} />;
      case 'settings':
        return <SettingsView settings={userSettings} onSave={setUserSettings} />;
      case 'dashboard':
      default:
        return (
          <>
            <header className="mb-8 pl-2">
              <h1 className="text-3xl font-serif italic text-white mb-1 drop-shadow-md">
                Hello, {userSettings.name}
              </h1>
              <p className="text-indigo-200 text-sm font-mono opacity-70">
                所有系统运行中。双代理模式已激活。
              </p>
            </header>

            <DashboardVisuals moodHistory={moodHistory} tasks={tasks} />

            <section className="glass-panel rounded-3xl p-6 relative overflow-hidden flex-1 min-h-[400px] border-t border-white/10 mt-6">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
              <TaskBoard 
                tasks={tasks} 
                onToggleStatus={handleToggleTask} 
                onAddTask={openCreateModal}
                onEditTask={openEditModal}
              />
            </section>
          </>
        );
    }
  };

  return (
    <div className="flex h-screen w-full text-slate-200 font-sans overflow-hidden bg-transparent">
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] animate-float">
            <div className="glass-card px-6 py-3 rounded-full flex items-center gap-3 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                {toast.icon}
                <span className="font-bold tracking-wide text-white text-sm">{toast.message}</span>
            </div>
        </div>
      )}

      {/* Floating Dock Sidebar (Bottom on mobile, Left on desktop) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:static md:w-24 md:flex md:flex-col md:items-center md:py-12 z-40">
        <div className="glass-panel p-2 rounded-full flex md:flex-col gap-4 shadow-2xl">
            <div className="hidden md:flex w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4 items-center justify-center text-white font-serif font-bold text-xl shadow-[0_0_20px_rgba(99,102,241,0.5)]">R</div>
            
            {[
                { id: 'dashboard', icon: LayoutDashboard },
                { id: 'calendar', icon: Calendar },
                { id: 'settings', icon: Settings }
            ].map(item => (
                <button 
                    key={item.id}
                    onClick={() => setCurrentView(item.id as any)}
                    className={`p-3 rounded-full transition-all duration-300 ${
                        currentView === item.id 
                        ? 'bg-white text-indigo-900 shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-110' 
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <item.icon size={20} />
                </button>
            ))}
        </div>
      </nav>

{/* App.tsx 的 main 部分 */}
<main className="flex-1 flex flex-col md:flex-row h-full relative z-10">
        
        {/* 左侧：动态内容区 */}
        {/* 这里的 flex-1 会在右侧消失时自动撑满全屏 */}
        <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 lg:px-12 lg:py-8 scrollbar-hide flex flex-col">
          {renderContent()}
        </div>

        {/* 右侧：AI 代理面板 */}
        {/* 🔥🔥🔥 核心修改在这里：添加这个判断 🔥🔥🔥 */}
        {currentView !== 'settings' && (
          <div className="hidden lg:flex gap-4 w-[760px] xl:w-[840px] h-full p-6 pl-0">
            {/* Companion Agent */}
            <div className="flex-1 min-w-0 h-full glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10">
              <AgentChat 
                messages={chatMessagesByAgent[AgentType.COMPANION]}
                currentAgent={AgentType.COMPANION}
                isTyping={isTypingByAgent[AgentType.COMPANION]}
                onSendMessage={(text) => handleSendMessage(text, AgentType.COMPANION)}
                onApproveAction={(action, msgId) => handleApproveAction(action, msgId, AgentType.COMPANION)}
                onDismissAction={(action, msgId) => handleDismissAction(action, msgId, AgentType.COMPANION)}
                userSettings={userSettings}
              />
            </div>
            
            {/* Ideal Self Agent */}
            <div className="flex-1 min-w-0 h-full glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10">
              <AgentChat 
                messages={chatMessagesByAgent[AgentType.IDEAL_SELF]}
                currentAgent={AgentType.IDEAL_SELF}
                isTyping={isTypingByAgent[AgentType.IDEAL_SELF]}
                onSendMessage={(text) => handleSendMessage(text, AgentType.IDEAL_SELF)}
                onApproveAction={(action, msgId) => handleApproveAction(action, msgId, AgentType.IDEAL_SELF)}
                onDismissAction={(action, msgId) => handleDismissAction(action, msgId, AgentType.IDEAL_SELF)}
                userSettings={userSettings}
              />
            </div>
          </div>
        )}
      </main>

      {/* Task Modal */}
      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialTask={editingTask}
      />
    </div>
  );
};