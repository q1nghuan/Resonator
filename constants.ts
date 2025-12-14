import { Task, TaskStatus, MoodEntry, AgentType } from './types';

// Helper to generate a realistic spread of tasks for visualization demo
const generateMockTasks = (): Task[] => {
  const tasks: Task[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Helper to create ISO date string
  const getDate = (day: number, hour: number, minute: number = 0) => {
    // Handle month overflow/underflow if day is out of range, though for mock data we keep it simple
    // We clamp day to max 28 to avoid February issues for this simple demo
    const safeDay = Math.min(day, 28); 
    return new Date(currentYear, currentMonth, safeDay, hour, minute).toISOString();
  };

  // 1. "Heavy" Workload Days (Large Bubbles)
  // These days have multiple long tasks to test the max bubble size
  const heavyDays = [5, 12, 19, 26]; 
  heavyDays.forEach(day => {
      const isPast = day < now.getDate();
      tasks.push(
        {
          id: `mock-heavy-${day}-1`,
          title: '深度工作：系统架构设计',
          description: '专注于核心可扩展性和数据库架构。',
          status: isPast ? TaskStatus.DONE : TaskStatus.TODO,
          category: 'work',
          durationMinutes: 120,
          dueTime: getDate(day, 9, 0)
        },
        {
          id: `mock-heavy-${day}-2`,
          title: '设计团队同步会议',
          description: '与设计团队的每周同步。',
          status: isPast ? TaskStatus.DONE : TaskStatus.TODO,
          category: 'work',
          durationMinutes: 60,
          dueTime: getDate(day, 13, 30)
        },
        {
          id: `mock-heavy-${day}-3`,
          title: '晚间高强度间歇训练',
          description: '高强度间歇训练。',
          status: isPast ? TaskStatus.DONE : TaskStatus.TODO,
          category: 'health',
          durationMinutes: 45,
          dueTime: getDate(day, 18, 0)
        }
      );
  });

  // 2. "Medium" Workload Days (Medium Bubbles)
  const mediumDays = [2, 8, 10, 15, 17, 22, 24];
  mediumDays.forEach(day => {
       const isPast = day < now.getDate();
       tasks.push(
        {
          id: `mock-med-${day}-1`,
          title: '客户评审',
          status: isPast ? TaskStatus.DONE : TaskStatus.TODO,
          category: 'work',
          durationMinutes: 45,
          dueTime: getDate(day, 11, 0)
        },
        {
          id: `mock-med-${day}-2`,
          title: '阅读：认知科学',
          status: isPast ? TaskStatus.DONE : TaskStatus.TODO,
          category: 'growth',
          durationMinutes: 30,
          dueTime: getDate(day, 20, 0)
        }
       );
  });

  // 3. "Light" Days (Small/Tiny Bubbles)
  const lightDays = [3, 7, 13, 21, 28];
  lightDays.forEach(day => {
       const isPast = day < now.getDate();
       tasks.push({
          id: `mock-light-${day}-1`,
          title: '晨间冥想',
          status: isPast ? TaskStatus.DONE : TaskStatus.TODO,
          category: 'health',
          durationMinutes: 15,
          dueTime: getDate(day, 8, 0)
      });
  });

  // 4. "Today's" Specific Tasks (For Dashboard Demo)
  const today = now.getDate();
  tasks.push(
    {
      id: 'today-1',
      title: '晨间反思',
      description: '写下3件让我感恩的事情。',
      status: TaskStatus.DONE,
      category: 'growth',
      durationMinutes: 15,
      dueTime: getDate(today, 8, 0),
    },
    {
      id: 'today-2',
      title: '深度工作：项目Alpha',
      description: '专注于Q3报告分析。',
      status: TaskStatus.IN_PROGRESS,
      category: 'work',
      durationMinutes: 90,
      dueTime: getDate(today, 10, 0),
    },
    {
      id: 'today-3',
      title: '健身房训练',
      description: '有氧运动和轻量举重。',
      status: TaskStatus.TODO,
      category: 'health',
      durationMinutes: 60,
      dueTime: getDate(today, 17, 30),
    },
    {
      id: 'today-4',
      title: '阅读研究论文',
      description: '阅读最新的CHI论文关于自我声音。',
      status: TaskStatus.TODO,
      category: 'growth',
      durationMinutes: 45,
      dueTime: getDate(today, 20, 0),
    }
  );

  return tasks;
};

export const INITIAL_TASKS: Task[] = generateMockTasks();

export const INITIAL_MOOD_HISTORY: MoodEntry[] = Array.from({ length: 14 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  
  // Create a slight "wave" pattern in the mock mood data
  const wave = Math.sin(i / 2) * 2; 
  const baseScore = 6;
  const score = Math.max(1, Math.min(10, Math.round(baseScore + wave + Math.random() * 2)));

  return {
    date: d.toISOString().split('T')[0],
    score: score, 
    tags: score > 7 ? ['精力充沛', '心流'] : score < 5 ? ['疲惫', '焦虑'] : ['中性'],
    note: '示例心情记录'
  };
});

export const AGENT_PERSONAS = {
  [AgentType.COMPANION]: {
    name: "心灵伴侣",
    description: "共情、不评判，专注于情感支持。",
    systemInstruction: `你是一个支持性、共情性的AI伴侣。
    你的目标是验证用户的感受，减少孤独感，并温和地引导他们。
    如果用户拖延或感到"空虚"，先给予安慰，然后提供小而可管理的步骤。
    说话要温暖。不要过于催促。`
  },
  [AgentType.IDEAL_SELF]: {
    name: "理想自我",
    description: "坚韧、成长导向，帮助你重新定义失败。",
    systemInstruction: `你是用户的"理想自我"——坚韧、自律、富有同情心但坚定的版本。
    经常使用"我们"的语言（例如，"我们可以做到"）。
    将失败重新定义为学习机会。
    关注用户的长期身份和目标。鼓励他们坚持习惯。`
  }
};