import React, { useState, useEffect, useRef } from 'react';
import { SUPPORTED_LANGUAGES } from './constants';
import { translateText, fileToText, urlToText } from './services/geminiService';
import ThreeDButton from './components/ThreeDButton';
import mammoth from 'mammoth';

// Icons
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2 2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const TranslateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>; // Arrow Right
const TranslateIconMobile = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></svg>; // Arrow Down
const ExchangeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M4 20h5v-5"/><path d="M21 3l-7.5 7.5"/><path d="M10.5 13.5L3 21"/></svg>;

// Map App Language Codes to Browser Speech Synthesis Locales
const TTS_LANG_MAP: Record<string, string> = {
  'zh': 'zh-CN',
  'en': 'en-US',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'fr': 'fr-FR',
  'es': 'es-ES',
  'de': 'de-DE',
  'ru': 'ru-RU',
  'pt': 'pt-PT', // Can fallback to pt-BR if needed in logic
  'it': 'it-IT',
};

const App: React.FC = () => {
  // State
  const [sourceLang, setSourceLang] = useState('zh');
  const [targetLang, setTargetLang] = useState('en');
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState<string | null>(null);

  // TTS State
  const [activeTTS, setActiveTTS] = useState<'source' | 'target' | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Initialize Voices
  useEffect(() => {
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    updateVoices();
    
    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = updateVoices;
    
    return () => {
        window.speechSynthesis.onvoiceschanged = null;
    }
  }, []);

  // Monitor Speech Synthesis State
  useEffect(() => {
    const interval = setInterval(() => {
        if (!window.speechSynthesis.speaking && activeTTS && !isPaused) {
            setActiveTTS(null);
            setIsPaused(false);
        }
    }, 500);
    return () => clearInterval(interval);
  }, [activeTTS, isPaused]);

  // Helper to handle text changes
  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSourceText(e.target.value);
  };

  // Swap Languages
  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(targetText);
    setTargetText(sourceText);
    stopTTS();
  };

  // 1. Voice Input (Speech Recognition)
  const startListening = (langCode: string, isSource: boolean) => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Browser does not support speech recognition.");
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Map langCode to dialect for better recognition if possible
    const recognitionLang = TTS_LANG_MAP[langCode] || langCode;
    recognition.lang = recognitionLang;
    
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setStatus(`Listening (${recognitionLang})...`);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (isSource) {
        setSourceText((prev) => prev + (prev ? ' ' : '') + transcript);
      } else {
        setTargetText((prev) => prev + (prev ? ' ' : '') + transcript);
      }
      setStatus('');
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setStatus('Error listening');
    };

    recognition.onend = () => {
      setStatus('');
    };

    recognition.start();
  };

  // 2. File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isVideo: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check File Size (Limit to 10MB for stability with base64)
    if (file.size > 10 * 1024 * 1024) {
        alert("File is too large. Please use a file smaller than 10MB.");
        e.target.value = '';
        return;
    }

    setIsLoading(true);
    setStatus(`Processing ${file.name}...`);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';

      // --- TXT HANDLING (Local) ---
      if (extension === 'txt') {
        const reader = new FileReader();
        reader.onload = () => {
            setSourceText(reader.result as string);
            setIsLoading(false);
            setStatus('');
        };
        reader.onerror = () => {
            setStatus('Failed to read text file');
            setIsLoading(false);
        };
        reader.readAsText(file);
        e.target.value = '';
        return;
      }

      // --- DOCX HANDLING (Local via Mammoth) ---
      if (extension === 'docx') {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            if (!arrayBuffer) return;
            try {
                const result = await mammoth.extractRawText({ arrayBuffer });
                setSourceText(result.value);
            } catch (err) {
                console.error("Mammoth error:", err);
                alert("Failed to parse .docx file. Ensure it is a valid Word document.");
            } finally {
                setIsLoading(false);
                setStatus('');
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
        return;
      }

      // --- DOC HANDLING (Legacy) ---
      if (extension === 'doc') {
          alert("Legacy .doc format is not supported directly in the browser. Please save your file as .docx (Word Document) and try again.");
          setIsLoading(false);
          setStatus('');
          e.target.value = '';
          return;
      }

      // --- MEDIA & PDF HANDLING (Gemini API) ---
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Strip data url prefix for API
        const base64Data = base64String.split(',')[1];
        
        // Ensure correct mime type if browser fails to detect it
        let mimeType = file.type;
        if (!mimeType || mimeType === '') {
            if (extension === 'pdf') mimeType = 'application/pdf';
            else if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) mimeType = `image/${extension}`;
            else if (['mp3', 'wav', 'aac', 'flac'].includes(extension)) mimeType = `audio/${extension}`;
            else if (['mp4', 'mov', 'avi', 'webm', 'mpeg', 'mpg'].includes(extension)) mimeType = `video/${extension}`;
            
            // Fallback for some video types
            if (extension === 'mov') mimeType = 'video/mp4'; 
        }

        try {
            const extractedText = await fileToText(base64Data, mimeType, sourceLang);
            setSourceText(extractedText);
        } catch (err) {
            console.error(err);
            alert("Could not process file. The format might not be supported or the file is corrupted.");
        } finally {
            setIsLoading(false);
            setStatus('');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setStatus('Failed to process file.');
      setIsLoading(false);
    }
    // Reset input
    e.target.value = '';
  };

  // 3. URL Input
  const handleUrlSubmit = async () => {
    if (!urlInput) return;
    setIsLoading(true);
    setStatus('Extracting content from URL...');
    try {
      const text = await urlToText(urlInput);
      setSourceText(text);
      setUrlInput(null); // Close modal
    } catch (error) {
      alert("Could not extract text from URL.");
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  // Core Translation
  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    setStatus('Translating...');
    try {
      const sLangName = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang;
      const tLangName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
      const result = await translateText(sourceText, sLangName, tLangName);
      setTargetText(result);
    } catch (error) {
      alert("Translation failed.");
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  // --- Fast Browser TTS Logic ---
  const stopTTS = () => {
    window.speechSynthesis.cancel();
    setActiveTTS(null);
    setIsPaused(false);
  };

  const handleTTS = (text: string, langCode: string, isSource: boolean) => {
    if (!text) return;
    const currentSide = isSource ? 'source' : 'target';

    // 1. If currently playing this side: Toggle Pause/Resume
    if (activeTTS === currentSide) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    // 2. If playing other side or nothing: Start New
    stopTTS(); // Cancel others

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLangTag = TTS_LANG_MAP[langCode] || langCode;
    utterance.lang = targetLangTag;
    utterance.rate = 1.0; 

    // Explicitly find a matching voice. 
    // This fixes issues where non-Chinese languages fail if the browser default is set to a different language.
    if (availableVoices.length > 0) {
        // First try exact match (e.g. 'fr-FR')
        let selectedVoice = availableVoices.find(v => v.lang === targetLangTag);
        
        // If not found, try base language match (e.g. 'fr')
        if (!selectedVoice) {
            selectedVoice = availableVoices.find(v => v.lang.startsWith(langCode));
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        } else {
            console.warn(`No specific voice found for ${targetLangTag}, using system default.`);
        }
    }

    utterance.onend = () => {
      setActiveTTS(null);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.error("TTS Error", e);
      setActiveTTS(null);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setActiveTTS(currentSide);
    setIsPaused(false);
  };

  const clearText = (isSource: boolean) => {
    if (isSource) {
        setSourceText('');
        if (activeTTS === 'source') stopTTS();
    } else {
        setTargetText('');
        if (activeTTS === 'target') stopTTS();
    }
  };

  return (
    <div className="min-h-screen bg-sky-200 py-6 px-4 font-sans flex flex-col items-center">
      
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 drop-shadow-sm tracking-tight mb-2 flex items-center justify-center gap-3">
          <span className="bg-blue-600 text-white rounded-lg px-2 py-1 text-2xl shadow-md">Omni</span>
          Translator 全能翻译
        </h1>
        <p className="text-blue-700 font-medium opacity-80 text-sm">Global communication made simple</p>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-7xl bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/50 flex flex-col gap-6">
        
        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-start">
            
            {/* --- SOURCE COLUMN --- */}
            <div className="flex flex-col gap-4">
               {/* Lang Select */}
               <div className="relative">
                 <select 
                    value={sourceLang} 
                    onChange={(e) => { setSourceLang(e.target.value); stopTTS(); }}
                    className="w-full appearance-none bg-white border-2 border-blue-200 hover:border-blue-400 text-gray-800 py-2 px-4 pr-8 rounded-xl focus:outline-none focus:border-blue-600 font-bold text-lg shadow-sm transition-all cursor-pointer text-center"
                 >
                    {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-blue-500">
                    <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                 </div>
               </div>

                {/* Source Tools Row (1 Row) */}
                <div className="flex gap-2 items-center justify-between">
                    <ThreeDButton 
                        label="Voice" 
                        icon={<MicIcon />} 
                        variant="success" 
                        onClick={() => startListening(sourceLang, true)}
                        className="text-xs px-2 py-2 flex-1 !rounded-lg"
                    />
                    <div className="relative flex-1">
                        <input type="file" id="fileDoc" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleFileUpload(e, false)} />
                        <ThreeDButton 
                            label="File" 
                            icon={<FileIcon />} 
                            variant="primary" 
                            onClick={() => document.getElementById('fileDoc')?.click()} 
                            className="text-xs px-2 py-2 w-full !rounded-lg"
                        />
                    </div>
                    <div className="relative flex-1">
                        <input type="file" id="fileMedia" className="hidden" accept="audio/*,video/*" onChange={(e) => handleFileUpload(e, true)} />
                        <ThreeDButton 
                            label="Media" 
                            icon={<VideoIcon />} 
                            variant="primary" 
                            onClick={() => document.getElementById('fileMedia')?.click()} 
                            className="text-xs px-2 py-2 w-full !rounded-lg"
                        />
                    </div>
                    <ThreeDButton 
                        label="URL" 
                        icon={<LinkIcon />} 
                        variant="warning" 
                        onClick={() => setUrlInput('')} 
                        className="text-xs px-2 py-2 flex-1 !rounded-lg"
                    />
                </div>

                {/* Source Text Area (Increased Height) */}
                <textarea
                    className="w-full h-80 md:h-[26rem] p-4 text-lg rounded-2xl border-2 border-blue-100 focus:border-blue-400 focus:ring-0 resize-none shadow-inner bg-white text-gray-800 transition-colors"
                    placeholder="Enter text here..."
                    value={sourceText}
                    onChange={handleSourceChange}
                />

                {/* Source Bottom Controls */}
                <div className="flex gap-3">
                    <ThreeDButton 
                        label={activeTTS === 'source' && !isPaused ? "Pause" : "Play"} 
                        icon={activeTTS === 'source' && !isPaused ? <PauseIcon /> : <PlayIcon />} 
                        variant="warning"
                        onClick={() => handleTTS(sourceText, sourceLang, true)}
                        className="flex-1 text-sm py-2"
                    />
                    <ThreeDButton 
                        label="Clear" 
                        icon={<TrashIcon />} 
                        variant="danger" 
                        onClick={() => clearText(true)}
                        className="flex-1 text-sm py-2"
                    />
                </div>
            </div>

            {/* --- CENTER COLUMN (CONTROLS) --- */}
            <div className="flex md:flex-col flex-row gap-4 justify-between items-center h-full md:py-2">
                
                {/* Swap Button (Top aligned with selects) */}
                <div className="flex items-center justify-center md:h-[48px]">
                    <button 
                        onClick={swapLanguages}
                        className="p-3 bg-white hover:bg-blue-50 text-blue-600 rounded-full transition-all shadow-md border-b-2 border-blue-100 hover:scale-110 active:scale-95"
                        title="Swap Languages"
                    >
                        <ExchangeIcon />
                    </button>
                </div>

                {/* Translate Button (Vertically Centered) */}
                <div className="flex-grow flex items-center justify-center">
                     <ThreeDButton 
                        label=""
                        icon={window.innerWidth >= 768 ? <TranslateIcon /> : <TranslateIconMobile />} 
                        variant="primary" 
                        onClick={handleTranslate}
                        disabled={isLoading || !sourceText}
                        className="!rounded-full w-12 h-12 !p-0 flex items-center justify-center shadow-lg hover:shadow-blue-500/50 hover:scale-110 transition-all bg-gradient-to-r from-blue-600 to-blue-500"
                        title="Translate"
                     />
                </div>

                 {/* Spacer for bottom alignment matching target */}
                 <div className="hidden md:block h-[40px]"></div>
            </div>

            {/* --- TARGET COLUMN --- */}
            <div className="flex flex-col gap-4">
                {/* Lang Select */}
               <div className="relative">
                 <select 
                    value={targetLang} 
                    onChange={(e) => { setTargetLang(e.target.value); stopTTS(); }}
                    className="w-full appearance-none bg-white border-2 border-blue-200 hover:border-blue-400 text-gray-800 py-2 px-4 pr-8 rounded-xl focus:outline-none focus:border-blue-600 font-bold text-lg shadow-sm transition-all cursor-pointer text-center"
                 >
                    {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-blue-500">
                    <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                 </div>
               </div>

                {/* Target Tools Row */}
                <div className="flex gap-2 items-center">
                    <ThreeDButton 
                        label="Voice" 
                        icon={<MicIcon />} 
                        variant="success" 
                        onClick={() => startListening(targetLang, false)}
                        className="text-xs px-2 py-2 w-24 !rounded-lg" 
                    />
                    <div className="flex-grow"></div> 
                </div>

                {/* Target Text Area (Increased Height) */}
                <textarea
                    readOnly
                    className="w-full h-80 md:h-[26rem] p-4 text-lg rounded-2xl border-2 border-blue-50 bg-gray-50/50 text-gray-800 shadow-inner resize-none focus:outline-none"
                    placeholder="Translation..."
                    value={targetText}
                />

                {/* Target Bottom Controls */}
                <div className="flex gap-3">
                    <ThreeDButton 
                        label={activeTTS === 'target' && !isPaused ? "Pause" : "Play"} 
                        icon={activeTTS === 'target' && !isPaused ? <PauseIcon /> : <PlayIcon />} 
                        variant="warning"
                        onClick={() => handleTTS(targetText, targetLang, false)}
                        className="flex-1 text-sm py-2"
                    />
                    <ThreeDButton 
                        label="Clear" 
                        icon={<TrashIcon />} 
                        variant="danger" 
                        onClick={() => clearText(false)}
                        className="flex-1 text-sm py-2"
                    />
                </div>
            </div>
        </div>

        {/* Status Bar */}
        {status && (
            <div className="text-center mt-2 p-2 rounded-lg bg-blue-50 text-blue-800 font-semibold animate-pulse border border-blue-100 text-sm">
                {status}
            </div>
        )}

      </main>

      {/* URL Input Modal */}
      {urlInput !== null && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg border-b-8 border-blue-200 animate-bounce-in">
                  <h3 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <LinkIcon /> Enter URL
                  </h3>
                  <p className="mb-4 text-gray-600 text-sm">Paste a website link to extract text, or a link to a video/audio file.</p>
                  <input 
                    type="text" 
                    className="w-full border-2 border-gray-300 rounded-xl p-3 mb-6 focus:border-blue-500 outline-none text-lg"
                    placeholder="https://..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-4">
                      <ThreeDButton label="Cancel" variant="secondary" onClick={() => setUrlInput(null)} />
                      <ThreeDButton label="Extract Text" variant="primary" onClick={handleUrlSubmit} />
                  </div>
              </div>
          </div>
      )}

      {/* Footer */}
      <footer className="mt-8 text-blue-800/60 text-sm font-semibold">
        © 2025 OmniTranslator AI
      </footer>

    </div>
  );
};

export default App;