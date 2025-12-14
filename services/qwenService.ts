import { AgentType, Task, TaskAction, AIResponseSchema, UserSettings, UserHabits } from '../types';
import { AGENT_PERSONAS } from '../constants';

// --- 配置区域 ---
// 指向刚才搭建的本地代理服务器
// 如果你在手机真机调试，请将 localhost 换成电脑的局域网 IP (例如 192.168.1.x)
const apiBaseUrl = 'http://localhost:3001/api/chat';

// 模型配置 (可选)
const model = process.env.QWEN_MODEL || 'qwen-turbo'; 

// --- API 调用函数 (修改版) ---
async function callQwenAPI(messages: Array<{ role: string; content: string }>, systemPrompt: string): Promise<string> {
  try {
    const response = await fetch(apiBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 注意：这里不再需要 Authorization 头，因为 Key 在后端
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        systemPrompt: systemPrompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Server Error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        // 读取后端转发回来的阿里云错误信息
        errorMessage += ` - ${errorData.message || errorData.msg || errorData.code || errorText}`;
      } catch {
        errorMessage += ` - ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // --- 解析响应 ---
    // 逻辑保持不变，确保兼容后端转发回来的各种格式
    if (data.output && data.output.choices && data.output.choices.length > 0) {
      const choice = data.output.choices[0];
      if (choice.message && choice.message.content) {
        return choice.message.content;
      }
    }
    
    if (data.choices && data.choices.length > 0) {
      const choice = data.choices[0];
      if (choice.message && choice.message.content) {
        return choice.message.content;
      }
    }
    
    if (typeof data === 'string') {
      return data;
    }
    
    throw new Error('Unexpected response format: ' + JSON.stringify(data));

  } catch (error) {
    console.error("API Call Failed:", error);
    throw error; // 继续抛出让外层捕获
  }
}

// --- 主生成函数 ---
export const generateAgentResponse = async (
  agentType: AgentType,
  userMessage: string,
  currentTasks: Task[],
  moodContext: string,
  userSettings?: UserSettings,
  userHabits?: UserHabits
): Promise<AIResponseSchema> => {
  
  // 移除：不再需要在前端检查 API Key
  // if (!apiKey) { ... }

  // 使用自定义agent配置或默认配置
  const defaultPersona = AGENT_PERSONAS[agentType];
  const persona = userSettings?.agentPersonas?.[agentType] || defaultPersona;
  
  // 构建任务上下文
  const taskContext = JSON.stringify(currentTasks.map(t => ({ 
    id: t.id, 
    title: t.title, 
    status: t.status, 
    dueTime: t.dueTime,
    duration: t.durationMinutes,
    category: t.category,
    description: t.description
  })));
  
  // 时间上下文 (UTC+8)
  const now = new Date();
  const dateTimeContext = `
    当前日期: ${now.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}
    当前时间: ${now.toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    完整时间: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'long' })}
    ISO字符串(UTC): ${now.toISOString()}
    时区: UTC+8 (中国标准时间 - Asia/Shanghai)
  `;

  // 构建 System Prompt (保持原样，核心逻辑)
  const systemPrompt = `
    你是一位智能的"全息生活架构师"，扮演角色："${persona.name}"。
    ${persona.systemInstruction}

    === 上下文信息 ===
    用户当前心情: ${moodContext}
    当前任务列表 (JSON): ${taskContext}
    ${dateTimeContext}
    
    ${userHabits ? `
    === 用户个性化信息 ===
    用户偏好工作时间段: ${userHabits.preferredWorkTimes.length > 0 ? userHabits.preferredWorkTimes.join(', ') : '暂无记录'}
    偏好任务时长: ${userHabits.taskPreferences.preferredDuration}分钟
    偏好任务类别: ${userHabits.taskPreferences.preferredCategories.length > 0 ? userHabits.taskPreferences.preferredCategories.join(', ') : '暂无记录'}
    沟通风格: ${userHabits.communicationStyle || '待观察'}
    最近行为模式: ${userHabits.recentPatterns.length > 0 ? userHabits.recentPatterns.join('; ') : '暂无记录'}
    
    请根据这些个性化信息调整你的回复和建议，使其更符合用户的习惯和偏好。
    ` : ''}
    
    ${userSettings ? `
    === 用户设置 ===
    用户名: ${userSettings.name}
    工作时间: ${userSettings.workStartHour}:00 - ${userSettings.workEndHour}:00
    ` : ''}

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

    === 输出格式要求（严格） ===
    你必须返回一个有效的JSON对象，且只返回JSON，不要包含任何其他文字或markdown标记。
    
    JSON格式如下：
    {
      "response_text": "你的对话回复内容（必须使用中文）",
      "suggested_actions": [
        {
          "type": "ADD" | "UPDATE" | "DELETE" | "RESCHEDULE",
          "taskId": "任务ID（UPDATE/DELETE/RESCHEDULE时需要）",
          "taskData": {
            "title": "任务标题",
            "description": "任务描述（包含执行方法）",
            "durationMinutes": 30,
            "dueTime": "ISO 8601格式日期字符串",
            "category": "work" | "personal" | "growth" | "health",
            "status": "TODO" | "IN_PROGRESS" | "DONE" | "PENDING_RESCHEDULE"
          },
          "reason": "操作原因说明（必须使用中文）"
        }
      ]
    }

    === 重要要求 ===
    - 所有回复必须使用中文
    - 所有时间计算使用UTC+8时区（中国标准时间）
    - 使用温暖、自然的中文表达
    - 必须返回纯JSON格式，不要包含markdown代码块标记（如三个反引号加json）
    - 不要添加任何解释性文字，只返回JSON对象
    - response_text 字段必须包含对话回复
    - suggested_actions 是一个数组，可以包含0个或多个操作建议
    - 如果不需要执行任何操作，suggested_actions 可以是空数组 []
  `;

  try {
    const messages = [
      { role: 'user', content: userMessage }
    ];

    // 发送请求到本地后端
    let responseText = await callQwenAPI(messages, systemPrompt);
    
    // 清理响应文本，移除可能的markdown代码块标记
    responseText = responseText.trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsed = JSON.parse(responseText) as AIResponseSchema;
    
    // 验证返回的数据结构
    if (!parsed.response_text || !Array.isArray(parsed.suggested_actions)) {
      throw new Error('Invalid response format from Qwen API');
    }
    
    return parsed;

  } catch (error) {
    console.error("Qwen Proxy/API Error:", error);
    return {
      response_text: "我现在无法连接到我的思维过程（连接代理服务器失败或AI响应错误）。请确保本地 server.js 已启动。",
      suggested_actions: []
    };
  }
};