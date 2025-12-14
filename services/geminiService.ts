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
      description: "The conversational response. Include empathetic lifestyle advice here (e.g., 'You seem tired, I scheduled a break')."
    },
    suggested_actions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['ADD', 'UPDATE', 'DELETE', 'RESCHEDULE'] },
          taskId: { type: Type.STRING, description: "CRITICAL: The EXACT 'id' of the task to modify from the context." },
          taskData: {
             type: Type.OBJECT,
             properties: {
                 title: { type: Type.STRING },
                 description: { type: Type.STRING, description: "CRITICAL: Include the 'Method' or 'Mindset'. E.g., 'Do a rough draft only' or 'Focus on deep details'." },
                 durationMinutes: { type: Type.INTEGER },
                 dueTime: { type: Type.STRING, description: "ISO 8601 Format Date String" },
                 category: { type: Type.STRING, enum: ['work', 'personal', 'growth', 'health'] },
                 status: { type: Type.STRING, enum: ['TODO', 'IN_PROGRESS', 'DONE', 'PENDING_RESCHEDULE'] }
             }
          },
          reason: { type: Type.STRING, description: "Explanation of the STRATEGY. Why this duration? Why this time?" }
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
      response_text: "API Key is missing. Please check your configuration.",
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
  
  const now = new Date();
  const dateTimeContext = `
    Current Date: ${now.toLocaleDateString()}
    Current Time: ${now.toLocaleTimeString()}
    ISO String: ${now.toISOString()}
    Weekday: ${now.toLocaleDateString('en-US', { weekday: 'long' })}
  `;

  const systemPrompt = `
    You are an intelligent "Holistic Life Architect" acting as: "${persona.name}".
    ${persona.systemInstruction}

    === CONTEXT ===
    Current User Mood: ${moodContext}
    Current Tasks (JSON): ${taskContext}
    ${dateTimeContext}

    === YOUR PHILOSOPHY ===
    You are NOT just a mechanical scheduler. You are a coach.
    1. **Quality over Quantity**: When adding tasks, advise on the *Level of Effort* in the description. Does this need 100% perfection or just a "shitty first draft"?
    2. **Bio-Rhythms**: Watch out for the user's biology. 
       - If they add 3 hours of work, suggest a break.
       - If it's late (after 10 PM), suggest winding down, not deep work.
    3. **Missed Tasks**: 
       - Look for tasks with status "PENDING_RESCHEDULE". These are OVERDUE.
       - Proactively suggest a new time for them (RESCHEDULE action) or ask if they should be deleted.
       - Do not scold the user. Be compassionate (or reframing, depending on persona).

    === INSTRUCTIONS FOR TASK MANAGEMENT ===
    Analyze the user's message for intents like "add", "schedule", "remind me", "change", "delete", "remove", "reschedule".

    1. **ADD**: 
       - **Description Field**: MUST include "How to do it" advice. 
       - **Time**: Calculate 'dueTime' precisely based on "Current Time".

    2. **UPDATE / RESCHEDULE / DELETE**:
       - **CRITICAL**: You MUST use the EXACT 'id' from the "Current Tasks" JSON provided above. Do NOT invent IDs.
       - **RESCHEDULE**: You MUST populate 'taskData.dueTime' with the new ISO date/time. Change status back to 'TODO' if rescheduling.

    === OUTPUT FORMAT ===
    Return a valid JSON object matching the schema.
    The 'reason' field in suggested_actions is displayed to the user. Make it sound insightful.
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
      response_text: "I'm having trouble connecting to my thought process right now. But I'm here listening.",
      suggested_actions: []
    };
  }
};
