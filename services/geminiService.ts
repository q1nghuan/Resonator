import { GoogleGenAI, Schema, Type } from "@google/genai";
import { AgentType, Task, TaskAction, AIResponseSchema } from '../types';
import { AGENT_PERSONAS } from '../constants';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Define the response schema for JSON parsing
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    response_text: {
      type: Type.STRING,
      description: "对话回复内容。必须使用中文回复。包含共情的生活建议（例如：'你看起来累了，我为你安排了一个休息时间'）。"
    },
    suggested_actions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['ADD', 'UPDATE', 'DELETE', 'RESCHEDULE'] },
          taskId: { type: Type.STRING, description: "关键：必须使用上下文中任务的精确'id'。" },
          taskData: {
             type: Type.OBJECT,
             properties: {
                 title: { type: Type.STRING },
                 description: { type: Type.STRING, description: "关键：必须包含'方法'或'心态'。例如：'只做草稿即可'或'专注于深度细节'。使用中文描述。" },
                 durationMinutes: { type: Type.INTEGER },
                 dueTime: { type: Type.STRING, description: "ISO 8601格式日期字符串，使用UTC+8时区" },
                 category: { type: Type.STRING, enum: ['work', 'personal', 'growth', 'health'] },
                 status: { type: Type.STRING, enum: ['TODO', 'IN_PROGRESS', 'DONE', 'PENDING_RESCHEDULE'] }
             }
          },
          reason: { type: Type.STRING, description: "策略说明。必须使用中文。解释为什么是这个时长？为什么是这个时间？" }
        },
        required: ['type', 'reason']
      }
    }
  },
  required: ['response_text', 'suggested_actions']
};

export const generateAgentResponse = async (
  agentType: AgentType,
  userMessage: string,
  currentTasks: Task[],
  moodContext: string
): Promise<AIResponseSchema> => {
  
  if (!apiKey) {
    return {
      response_text: "API密钥缺失。请检查您的配置。",
      suggested_actions: []
    };
  }

  const persona = AGENT_PERSONAS[agentType];
  
  // Create a simplified view of tasks for the AI to process
  const taskContext = JSON.stringify(currentTasks.map(t => ({ 
    id: t.id, 
    title: t.title, 
    status: t.status, 
    dueTime: t.dueTime,
    duration: t.durationMinutes,
    category: t.category,
    description: t.description
  })));
  
  // 使用UTC+8时区（中国标准时间）
  const now = new Date();
  const dateTimeContext = `
    当前日期: ${now.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}
    当前时间: ${now.toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    完整时间: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'long' })}
    ISO字符串(UTC): ${now.toISOString()}
    时区: UTC+8 (中国标准时间 - Asia/Shanghai)
  `;

  const systemPrompt = `
    你是一位智能的"全息生活架构师"，扮演角色："${persona.name}"。
    ${persona.systemInstruction}

    === 上下文信息 ===
    用户当前心情: ${moodContext}
    当前任务列表 (JSON): ${taskContext}
    ${dateTimeContext}

    === 你的理念 ===
    你不仅仅是一个机械的日程安排工具。你是一位教练。
    1. **质量优于数量**：添加任务时，在描述中建议*努力程度*。这需要100%完美还是只需要"先做草稿"？
    2. **生物节律**：注意用户的生物节律。
       - 如果他们安排了3小时的工作，建议休息。
       - 如果时间很晚（晚上10点后），建议放松，而不是深度工作。
    3. **过期任务**：
       - 查找状态为"PENDING_RESCHEDULE"的任务。这些是过期的。
       - 主动建议新的时间（RESCHEDULE操作）或询问是否应该删除。
       - 不要责备用户。要富有同情心（或重新定义，取决于人格）。

    === 任务管理指令 ===
    分析用户消息中的意图，如"添加"、"安排"、"提醒我"、"更改"、"删除"、"移除"、"重新安排"。

    1. **ADD（添加）**：
       - **描述字段**：必须包含"如何完成"的建议。使用中文。
       - **时间**：根据上面提供的"当前时间"（UTC+8时区）精确计算'dueTime'。dueTime必须是ISO 8601格式字符串，表示UTC+8时区的实际时间。例如：如果当前时间是"2024-12-14 15:20"，要安排1小时后，dueTime应该是"2024-12-14T16:20:00+08:00"或类似的ISO格式。

    2. **UPDATE（更新）/ RESCHEDULE（重新安排）/ DELETE（删除）**：
       - **关键**：必须使用上面提供的"当前任务"JSON中的精确'id'。不要编造ID。
       - **RESCHEDULE**：必须用新的ISO日期/时间填充'taskData.dueTime'。如果重新安排，将状态改回'TODO'。

    === 输出格式 ===
    返回符合schema的有效JSON对象。
    suggested_actions中的'reason'字段会显示给用户。让它听起来有洞察力。使用中文。

    === 重要要求 ===
    - 所有回复必须使用中文
    - 所有时间计算使用UTC+8时区（中国标准时间）
    - 使用温暖、自然的中文表达
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text) as AIResponseSchema;
    return parsed;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      response_text: "我现在无法连接到我的思维过程。但我在这里倾听。",
      suggested_actions: []
    };
  }
};
