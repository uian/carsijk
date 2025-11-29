import { GoogleGenAI } from "@google/genai";
import { RequestLog } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeLogWithGemini(log: RequestLog): Promise<string> {
  try {
    const prompt = `
      You are a Shibboleth IdP System Administrator.
      Analyze the following authentication request log trace and identify the root cause of any failure or confirm success details.
      
      Transaction ID: ${log.id}
      SP Entity: ${log.spEntityId}
      User: ${log.userPrincipal}
      Status: ${log.status}
      
      Trace Steps:
      ${log.steps.map(s => `- [${s.status}] ${s.name}: ${s.details}`).join('\n')}
      
      Raw Logs:
      ${log.rawLogs.join('\n')}
      
      Please provide a concise, technical diagnosis in Chinese.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "无法生成分析结果";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "AI 分析服务暂时不可用，请检查网络或 API Key 设置。";
  }
}