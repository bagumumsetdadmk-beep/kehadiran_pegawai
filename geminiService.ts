
import { GoogleGenAI, Type } from "@google/genai";
import { AttendanceRecord } from "./types";

// Fixed: Initialization according to documentation guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAttendance = async (records: AttendanceRecord[]) => {
  const summary = records.map(r => `${r.date}: In ${r.fingerprintIn}, Out ${r.fingerprintOut}, ${r.remarks}`).join('\n');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Berikan ringkasan performa kehadiran singkat (max 2 kalimat) berdasarkan data berikut:\n${summary}`,
      config: {
        systemInstruction: "Anda adalah asisten HR yang ramah dan profesional di Indonesia."
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return "Gagal mendapatkan analisis AI saat ini.";
  }
};
