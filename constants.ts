import { Language } from './types';

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'zh', name: '简体中文' },
  { code: 'en', name: '英语' },
  { code: 'ja', name: '日语' },
  { code: 'ko', name: '韩语' },
  { code: 'fr', name: '法语' },
  { code: 'es', name: '西班牙语' },
  { code: 'de', name: '德语' },
  { code: 'ru', name: '俄语' },
  { code: 'pt', name: '葡萄牙语' },
  { code: 'it', name: '意大利语' },
];

export const MODEL_TEXT = 'gemini-2.5-flash';
export const MODEL_TTS = 'gemini-2.5-flash-preview-tts';