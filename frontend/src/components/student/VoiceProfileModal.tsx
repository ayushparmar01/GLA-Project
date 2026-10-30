import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle,
  AlertCircle,
  X,
  Volume2,
  Clock,
  Languages,
  Plus,
  Trash2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { extractVoiceProfileApi } from '../../services/api';

interface VoiceProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProfile: (profileData: {
    fullName?: string;
    course?: string;
    educationLevel?: string;
    skills: string[];
    careerInterests: string[];
    preferredWorkLocation: string[];
    preferredJobRoles?: string[];
  }) => Promise<void>;
  token?: string | null;
}

type VoiceLanguage = 'ta' | 'kn' | 'hi' | 'en';

interface LanguageConfig {
  code: VoiceLanguage;
  locale: string;
  label: string;
  nativeLabel: string;
  samplePrompt: string;
  sampleText: string;
}

const LANGUAGE_CONFIGS: Record<VoiceLanguage, LanguageConfig> = {
  ta: {
    code: 'ta',
    locale: 'ta-IN',
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
    samplePrompt: 'உங்கள் பெயர், படிப்பு (எ.கா. டிப்ளமோ எலக்ட்ரிக்கல்), திறன்கள் (வயரிங், மோட்டார் சர்வீசிங்), இடம் மற்றும் விருப்பமான வேலை பற்றி கூறுங்கள்.',
    sampleText: 'என் பெயர் விஜய். நான் அரசு பாலிடெக்னிக் கல்லூரியில் டிப்ளமோ எலக்ட்ரிக்கல் முடித்துள்ளேன். எனக்கு எலக்ட்ரிக்கல் மெயின்டனன்ஸ் மற்றும் வயரிங் தெரியும். சென்னை அல்லது கோயம்புத்தூரில் டெக்னீசியன் வேலை வேண்டும். மாதம் 15000 ஸ்டைபண்ட் எதிர்பார்க்கிறேன்.',
  },
  kn: {
    code: 'kn',
    locale: 'kn-IN',
    label: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
    samplePrompt: 'ನಿಮ್ಮ ಹೆಸರು, ಶಿಕ್ಷಣ (ಉದಾ: ಡಿಪ್ಲೊಮಾ ಎಲೆಕ್ಟ್ರಿಕಲ್), ಕೌಶಲ್ಯಗಳು (ವೈರಿಂಗ್, ಮೋಟರ್ ನಿರ್ವಹಣೆ), ಸ್ಥಳ ಮತ್ತು ಬಯಸಿದ ಉದ್ಯೋಗದ ಬಗ್ಗೆ ಮಾತನಾಡಿ.',
    sampleText: 'ನನ್ನ ಹೆಸರು ಪ್ರವೀಣ್. ನಾನು ಪಾಲಿಟೆಕ್ನಿಕ್ ಕಾಲೇಜಿನಲ್ಲಿ ಡಿಪ್ಲೊಮಾ ಎಲೆಕ್ಟ್ರಿಕಲ್ ಮುಗಿಸಿದ್ದೇನೆ. ನನಗೆ ಎಲೆಕ್ಟ್ರಿಕಲ್ ನಿರ್ವಹಣೆ ಮತ್ತು ವೈರಿಂಗ್ ಕೆಲಸ ತಿಳಿದಿದೆ. ಬೆಂಗಳೂರು ಅಥವಾ ಮೈಸೂರಿನಲ್ಲಿ ತಂತ್ರಜ್ಞ ಕೆಲಸ ಬೇಕು. ತಿಂಗಳಿಗೆ 15000 ಸ್ಟೈಪೆಂಡ್ ನಿರೀಕ್ಷಿಸುತ್ತೇನೆ.',
  },
  hi: {
    code: 'hi',
    locale: 'hi-IN',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    samplePrompt: 'अपना नाम, शिक्षा (जैसे डिप्लोमा इलेक्ट्रिकल), कौशल, स्थान और पसंदीदा नौकरी के बारे में बताएं।',
    sampleText: 'मेरा नाम राहुल है। मैंने डिप्लोमा इलेक्ट्रिकल किया है। मुझे इलेक्ट्रिकल मेंटेनेंस और वायरिंग आती है। मुझे पुणे में तकनीशियन की नौकरी चाहिए।',
  },
  en: {
    code: 'en',
    locale: 'en-IN',
    label: 'English',
    nativeLabel: 'English',
    samplePrompt: 'Speak your name, qualification (e.g. Diploma in Electrical), skills (wiring, maintenance), location, and preferred role.',
    sampleText: 'My name is Vijay. I completed Diploma in Electrical Engineering. My skills are Electrical Maintenance, Wiring and Motor Servicing. Looking for a Technician role in Chennai or Coimbatore with 15000 monthly stipend.',
  },
};

export const VoiceProfileModal: React.FC<VoiceProfileModalProps> = ({
  isOpen,
  onClose,
  onApplyProfile,
  token,
}) => {
  const [selectedLang, setSelectedLang] = useState<VoiceLanguage>('ta');
  const [recordingState, setRecordingState] = useState<'idle' | 'listening' | 'processing' | 'review' | 'error'>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [fallbackInput, setFallbackInput] = useState<string>('');
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Time Tracking (Ensures target < 5 minutes)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Editable Review Form State
  const [extractedName, setExtractedName] = useState('');
  const [extractedDegree, setExtractedDegree] = useState('');
  const [extractedCourse, setExtractedCourse] = useState('');
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [extractedLocations, setExtractedLocations] = useState<string[]>([]);
  const [newLocationInput, setNewLocationInput] = useState('');
  const [extractedRoles, setExtractedRoles] = useState<string[]>([]);
  const [extractedStipend, setExtractedStipend] = useState('');
  const [confidence, setConfidence] = useState<number>(0);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    if (recordingState === 'listening') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingState]);

  if (!isOpen) return null;

  const startListening = () => {
    setErrorMessage(null);
    setTranscript('');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      setRecordingState('error');
      setErrorMessage('Browser Speech Recognition is not supported in this browser. Please use the text input fallback.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = LANGUAGE_CONFIGS[selectedLang].locale;

      recognition.onstart = () => {
        setRecordingState('listening');
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentText.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn('[VoiceProfile] Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please grant microphone permission or use the text transcript fallback.');
          setRecordingState('error');
        } else if (event.error === 'network') {
          setErrorMessage('Network error during speech recognition. You can paste or type the transcript below.');
          setRecordingState('error');
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // If still in listening mode when recognition ends, process the transcript
        if (recordingState === 'listening') {
          stopListening();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to start speech recognition.');
      setRecordingState('error');
    }
  };

  const stopListening = async () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop error
      }
    }
    await processTranscript(transcript);
  };

  const processTranscript = async (textToProcess: string) => {
    const text = textToProcess.trim();
    if (!text) {
      setErrorMessage('No speech detected. Please speak clearly or paste your details.');
      setRecordingState('error');
      return;
    }

    setRecordingState('processing');
    try {
      const res = await extractVoiceProfileApi(text, selectedLang, token);
      if (res.success && res.data) {
        const d = res.data;
        setExtractedName(d.fullName || '');
        setExtractedDegree(d.degree || d.educationLevel || '');
        setExtractedCourse(d.course || d.specialization || '');
        setExtractedSkills(d.skills || []);
        setExtractedLocations(d.preferredWorkLocation || []);
        setExtractedRoles(d.preferredJobRoles || []);
        setExtractedStipend(d.expectedStipend || '');
        setConfidence(d.confidenceScore || 0.85);
        setRecordingState('review');
      } else {
        setErrorMessage(res.error?.message || 'Failed to extract profile from speech.');
        setRecordingState('error');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error communicating with extraction service.');
      setRecordingState('error');
    }
  };

  const handleApplySample = (sample: string) => {
    setTranscript(sample);
    processTranscript(sample);
  };

  const handleAddSkill = () => {
    if (newSkillInput.trim() && !extractedSkills.includes(newSkillInput.trim())) {
      setExtractedSkills([...extractedSkills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setExtractedSkills(extractedSkills.filter((s) => s !== skill));
  };

  const handleAddLocation = () => {
    if (newLocationInput.trim() && !extractedLocations.includes(newLocationInput.trim())) {
      setExtractedLocations([...extractedLocations, newLocationInput.trim()]);
      setNewLocationInput('');
    }
  };

  const handleRemoveLocation = (loc: string) => {
    setExtractedLocations(extractedLocations.filter((l) => l !== loc));
  };

  const handleSaveAndConfirm = async () => {
    setSavingProfile(true);
    try {
      await onApplyProfile({
        fullName: extractedName.trim() || undefined,
        course: extractedCourse.trim() || undefined,
        educationLevel: extractedDegree.trim() || undefined,
        skills: extractedSkills,
        careerInterests: extractedRoles,
        preferredWorkLocation: extractedLocations,
        preferredJobRoles: extractedRoles,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save confirmed profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8 animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg">Voice-Assisted Profile Creation</h3>
                <span className="bg-emerald-500/40 text-emerald-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                  Tamil &bull; Kannada
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Complete your full candidate profile in under 5 minutes in your mother tongue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Language Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Languages className="w-4 h-4 text-emerald-600" />
              <span>Select Spoken Language</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(LANGUAGE_CONFIGS) as VoiceLanguage[]).map((code) => {
                const conf = LANGUAGE_CONFIGS[code];
                const isSelected = selectedLang === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      if (recordingState === 'listening') stopListening();
                      setSelectedLang(code);
                    }}
                    className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-sm font-bold">{conf.nativeLabel}</span>
                    <span className="text-[11px] opacity-75">{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speaking Guidance Prompt */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center space-x-1">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Suggested Speaking Guide ({LANGUAGE_CONFIGS[selectedLang].nativeLabel}):</span>
            </div>
            <p className="leading-relaxed italic">"{LANGUAGE_CONFIGS[selectedLang].samplePrompt}"</p>
          </div>

          {/* RECORDING / REVIEW PHASES */}
          {recordingState === 'idle' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md hover:scale-105 transition cursor-pointer"
                onClick={startListening}
              >
                <Mic className="w-10 h-10 animate-pulse" />
              </div>
              <div>
                <button
                  type="button"
                  onClick={startListening}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition"
                >
                  Start Speaking ({LANGUAGE_CONFIGS[selectedLang].nativeLabel})
                </button>
                <p className="text-xs text-slate-400 mt-2">
                  Microphone will only activate when you click start. Speak clearly at normal speed.
                </p>
              </div>

              {/* Sample Speech Quick Loader for Testing & Demonstration */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleApplySample(LANGUAGE_CONFIGS[selectedLang].sampleText)}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium underline inline-flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Try sample verified {LANGUAGE_CONFIGS[selectedLang].label} transcript</span>
                </button>
              </div>
            </div>
          )}

          {recordingState === 'listening' && (
            <div className="py-6 text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto shadow-lg animate-pulse">
                  <Mic className="w-10 h-10" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600" />
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-800 flex items-center justify-center space-x-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span>Listening in {LANGUAGE_CONFIGS[selectedLang].nativeLabel}...</span>
                </div>
                <div className="text-xs font-mono text-slate-500 flex items-center justify-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Timer: {formatTimer(elapsedSeconds)} / 5:00 min</span>
                </div>
              </div>

              {/* Live Transcript Box */}
              <div className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs text-left min-h-[90px] max-h-36 overflow-y-auto border border-slate-800">
                {transcript || 'Speaking detected... Transcript will stream here in real-time...'}
              </div>

              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={stopListening}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md transition flex items-center space-x-2"
                >
                  <MicOff className="w-4 h-4" />
                  <span>Done Speaking &bull; Extract Profile</span>
                </button>
              </div>
            </div>
          )}

          {recordingState === 'processing' && (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-800">Processing Natural Voice Information...</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Extracting educational qualifications, skills, locations, and preferences from your speech.
              </p>
            </div>
          )}

          {recordingState === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">
                    Profile extracted successfully ({Math.round(confidence * 100)}% match confidence)
                  </span>
                </div>
                <span className="font-mono text-emerald-700">Time: {formatTimer(elapsedSeconds)}</span>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Full Name */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={extractedName}
                    onChange={(e) => setExtractedName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    placeholder="Candidate Name"
                  />
                </div>

                {/* Qualification / Degree */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Qualification / Degree</label>
                  <input
                    type="text"
                    value={extractedDegree}
                    onChange={(e) => setExtractedDegree(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Diploma / B.Tech"
                  />
                </div>

                {/* Course / Branch */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Course &amp; Branch</label>
                  <input
                    type="text"
                    value={extractedCourse}
                    onChange={(e) => setExtractedCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Electrical Engineering"
                  />
                </div>

                {/* Expected Stipend */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expected Stipend / Salary</label>
                  <input
                    type="text"
                    value={extractedStipend}
                    onChange={(e) => setExtractedStipend(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. ₹15,000/month"
                  />
                </div>
              </div>

              {/* Skills Tag Input */}
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-700 block">Extracted Skills (Editable)</label>
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50 min-h-[44px]">
                  {extractedSkills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-medium"
                    >
                      <span>{sk}</span>
                      <button type="button" onClick={() => handleRemoveSkill(sk)} className="hover:text-emerald-950">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="inline-flex items-center space-x-1">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="+ Add skill"
                      className="px-2 py-0.5 text-xs bg-transparent border-0 focus:outline-hidden"
                    />
                    {newSkillInput && (
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="text-emerald-700 hover:text-emerald-900"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Preferred Locations */}
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-700 block">Preferred Work Locations (Editable)</label>
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  {extractedLocations.map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 font-medium"
                    >
                      <span>{loc}</span>
                      <button type="button" onClick={() => handleRemoveLocation(loc)} className="hover:text-indigo-950">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="inline-flex items-center space-x-1">
                    <input
                      type="text"
                      value={newLocationInput}
                      onChange={(e) => setNewLocationInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                      placeholder="+ Add location"
                      className="px-2 py-0.5 text-xs bg-transparent border-0 focus:outline-hidden"
                    />
                    {newLocationInput && (
                      <button
                        type="button"
                        onClick={handleAddLocation}
                        className="text-indigo-700 hover:text-indigo-900"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRecordingState('idle');
                    setTranscript('');
                  }}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-record Speech</span>
                </button>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex-1 sm:flex-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingProfile}
                    onClick={handleSaveAndConfirm}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition flex items-center justify-center space-x-1.5 flex-1 sm:flex-none"
                  >
                    <span>{savingProfile ? 'Saving...' : 'Confirm & Save Profile'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {recordingState === 'error' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                <div className="flex items-center space-x-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Speech Input Notice</span>
                </div>
                <p>{errorMessage || 'Could not process speech input.'}</p>
              </div>

              {/* Fallback Text Input (Ensures system works regardless of hardware/browser support) */}
              <div className="space-y-2 text-xs">
                <label className="font-semibold text-slate-700 block">
                  Paste or Type Spoken Transcript ({LANGUAGE_CONFIGS[selectedLang].nativeLabel}):
                </label>
                <textarea
                  rows={3}
                  value={fallbackInput}
                  onChange={(e) => setFallbackInput(e.target.value)}
                  placeholder={`உதாரணம்: ${LANGUAGE_CONFIGS[selectedLang].sampleText}`}
                  className="w-full p-3 border border-slate-300 rounded-xl font-sans text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRecordingState('idle');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Try Again with Mic
                </button>
                <button
                  type="button"
                  onClick={() => processTranscript(fallbackInput)}
                  disabled={!fallbackInput.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 transition"
                >
                  Process Text Transcript
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
