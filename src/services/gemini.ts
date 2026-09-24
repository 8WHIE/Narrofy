import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as Record<string, string>);
  const apiKey = metaEnv.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '');
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  try {
    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
  } catch (err) {
    console.warn('Gemini client could not be initialized:', err);
    return null;
  }
}

export async function generateStoryIdea(genre: string, topic?: string): Promise<string> {
  const ai = getAIClient();
  if (!ai) {
    return `A captivating ${genre} tale about ${topic || 'an unexpected discovery that turns an ordinary world upside down'}. Explore characters pushed beyond their limits and a mystery waiting in the shadows.`;
  }
  try {
    const prompt = `Generate a compelling and original story idea/hook in the "${genre}" genre${topic ? ` focused on "${topic}"` : ''}. Keep it punchy, evocative, around 2-3 paragraphs. Do NOT include markdown code blocks.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || 'Unable to generate idea.';
  } catch (e) {
    console.error('Gemini generateStoryIdea error:', e);
    return `An intriguing ${genre} tale exploring mystery, tension, and choices that define fate.`;
  }
}

export async function generateStoryOutline(title: string, category: string, description: string): Promise<string[]> {
  const ai = getAIClient();
  if (!ai) {
    return [
      'Chapter 1: The Call to Adventure — The ordinary world and the disruption.',
      'Chapter 2: Crossing the Threshold — Facing initial trials and discovering secrets.',
      'Chapter 3: The Darkest Hour — Confronting unexpected betrayals or revelations.',
      'Chapter 4: The Climax & Resolution — The final confrontation and lasting change.',
    ];
  }
  try {
    const prompt = `Create a 4-chapter narrative outline for a story titled "${title}" in the "${category}" genre. Description: "${description}". Provide each chapter on a new line starting with "Chapter X: Title — Summary".`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const lines = (response.text || '').split('\n').map(l => l.trim()).filter(l => l.length > 5);
    return lines.length > 0 ? lines : ['Chapter 1: The Beginning', 'Chapter 2: The Rising Action', 'Chapter 3: The Climax', 'Chapter 4: The Aftermath'];
  } catch (e) {
    console.error('Gemini outline error:', e);
    return ['Chapter 1: The Inciting Incident', 'Chapter 2: The Rising Tension', 'Chapter 3: The Climax', 'Chapter 4: The Resolution'];
  }
}

export async function suggestTitles(synopsis: string, category: string): Promise<string[]> {
  const ai = getAIClient();
  if (!ai) {
    return ['Whispers of the Unknown', 'The Echo of Tomorrow', 'Beneath the Starlit Canopy', 'Shadows of Memory'];
  }
  try {
    const prompt = `Suggest 5 catchy, engaging story titles for a "${category}" story with this premise: "${synopsis}". Return only 5 titles, one per line, without numbers or quotes.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return (response.text || '')
      .split('\n')
      .map(t => t.trim().replace(/^[0-9]+[\.\)\-]\s*/, '').replace(/^"|"$/g, ''))
      .filter(Boolean)
      .slice(0, 5);
  } catch {
    return ['The Forgotten Voyage', 'Echoes in the Silence', 'Beyond the Edge'];
  }
}

export async function suggestTags(title: string, content: string, category: string): Promise<string[]> {
  const ai = getAIClient();
  if (!ai) {
    return [category.toLowerCase(), 'fiction', 'original', 'trending'];
  }
  try {
    const prompt = `Suggest 5 to 7 relevant storytelling tags/hashtags for the story "${title}" (Genre: ${category}). Text snippet: "${content.slice(0, 300)}". Return comma-separated lowercase tags without hashtags.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return (response.text || '')
      .split(',')
      .map(t => t.trim().toLowerCase().replace(/#/g, ''))
      .filter(t => t.length > 1 && t.length < 25)
      .slice(0, 7);
  } catch {
    return [category.toLowerCase(), 'fiction', 'drama', 'creative'];
  }
}

export async function polishText(text: string): Promise<string> {
  const ai = getAIClient();
  if (!ai) return text;
  try {
    const prompt = `Improve the flow, grammar, and sensory prose of this creative writing snippet without altering its core meaning or voice: "${text}". Return only the improved text.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || text;
  } catch {
    return text;
  }
}

export async function translateContent(text: string, targetLanguage: string): Promise<string> {
  const ai = getAIClient();
  if (!ai) return text;
  try {
    const prompt = `Translate this story text accurately into ${targetLanguage}, preserving narrative tone and emotion: "${text}". Return only the translated text.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || text;
  } catch {
    return text;
  }
}
