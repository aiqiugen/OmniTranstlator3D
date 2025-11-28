export interface Language {
  code: string;
  name: string;
}

export enum FileType {
  PDF = 'pdf',
  DOC = 'doc',
  DOCX = 'docx',
  TXT = 'txt',
  AUDIO = 'audio',
  VIDEO = 'video',
}

export interface TranslationState {
  sourceText: string;
  targetText: string;
  isTranslating: boolean;
  isProcessingFile: boolean;
}