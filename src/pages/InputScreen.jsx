import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { getStoredToken, getStoredUser, getStoredSidebarCollapsed, getUserCredits, deductUserCredit, getUserRole, setUserCredits, syncUserCreditsWithBackend } from '../utils/cookieUtils';
import { SUPPORTED_LANGUAGES, getCurrentLanguage, setCurrentLanguage, t, useTranslation } from '../utils/i18n';

/* ─── Shared Theme Palette ─── */
const C = {
  bg:         '#f6f7fb',
  surface:    '#ffffff',
  surfaceAlt: '#f8fafc',
  border:     '#e2e8f0',
  borderMed:  '#cbd5e1',
  primary:    '#6366f1',
  primaryDk:  '#4f46e5',
  primaryLt:  '#eef2ff',
  accent:     '#06b6d4',
  accentLt:   '#ecfeff',
  success:    '#10b981',
  successLt:  '#d1fae5',
  warn:       '#f59e0b',
  warnLt:     '#fef3c7',
  textH:      '#0f172a',
  textB:      '#334155',
  textM:      '#64748b',
  textSub:    '#94a3b8',
  grad:       'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
};

/* ─── Icon Helper ─── */
function Icon({ d, size = 18, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}

const UPLOAD_ICON = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12';
const FILE_ICON   = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6';
const SPARK_ICON  = 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83';
const TRASH_ICON  = 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2';
const CHECK_ICON  = 'M20 6L9 17l-5-5';
const ARROW_RIGHT = 'M5 12h14M12 5l7 7-7 7';
const INFO_ICON   = 'M12 16v-4M12 8h.01M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0z';
const LAYERS_ICON = 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5';
const CLOUD_ICON  = 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z';
const CHAT_ICON   = 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z';
const LINK_ICON   = 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71';
const MIC_ICON    = 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8';
const STOP_ICON   = 'M6 6h12v12H6z';
const GLOBE_ICON  = 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 0c2.5 4 4 8 4 10s-1.5 6-4 10m0-20c-2.5 4-4 8-4 10s1.5 6 4 10m-8-10h16';
const COIN_ICON   = 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6';

/* ─── Industry Quick-Start Templates (Futurrizon Business Transformation) ─── */
const TEMPLATES = [
  {
    id: 'ai-automation',
    title: 'Customer Onboarding & KYC Automation',
    tag: 'FinTech & Banking',
    desc: 'Replace manual PDF verification with an AI-driven document extraction, risk scoring, and automated compliance pipeline.',
    samplePrompt: 'We need to transform our customer onboarding process. Currently, compliance officers manually review customer identification documents, proof of address, and financial statements, taking 3-5 business days per account. We want an automated solution featuring AI OCR, automated AML/PEP screening, rule-based risk classification, and automated approval workflows with human-in-the-loop exception handling.',
    cloud: 'Azure (Microsoft Ecosystem)',
    focus: 'AI Solution & Process Automation',
  },
  {
    id: 'cloud-modernization',
    title: 'Legacy Monolith to Microservices & Cloud',
    tag: 'Enterprise IT',
    desc: 'Deconstruct a legacy on-premise relational core system into modular containerized microservices on Kubernetes.',
    samplePrompt: 'Our core enterprise inventory and order management system is a 12-year-old on-premise monolithic application running on Windows Server and MS SQL. It suffers from slow deployment cycles, lack of horizontal scalability, and single points of failure. We want a modern cloud architecture with decoupled REST & gRPC microservices, event-driven messaging (Kafka/Service Bus), containerized deployment, and automated CI/CD pipelines.',
    cloud: 'Azure (Microsoft Ecosystem)',
    focus: 'Legacy Cloud Modernization',
  },
  {
    id: 'copilot-companion',
    title: 'Internal SOP & Policy AI Copilot',
    tag: 'Corporate & HR',
    desc: 'Enterprise RAG knowledge engine allowing employees to converse naturally with standard operating procedures and internal documents.',
    samplePrompt: 'Build an enterprise AI Assistant that ingests all internal standard operating procedures (SOPs), company policies, compliance guidelines, and technical documentation. Employees should be able to ask complex operational questions in natural language and receive grounded answers with exact document citations, maintaining strict role-based access control so sensitive executive materials remain confidential.',
    cloud: 'Azure (Microsoft Ecosystem)',
    focus: 'AI Agent & Copilot (RAG)',
  },
  {
    id: 'supply-chain',
    title: 'Smart Logistics & Predictive Demand',
    tag: 'Supply Chain & Retail',
    desc: 'Real-time telemetry, IoT warehouse tracking, and predictive inventory replenishment models.',
    samplePrompt: 'Transform regional distribution network with predictive inventory intelligence. We want to ingest ERP purchase histories, current stock levels across 14 warehouses, and supplier lead times to predict stockout risks 30 days in advance. Needs automated reorder triggers, interactive warehouse manager dashboards, and supplier EDI integration.',
    cloud: 'AWS (Amazon Web Services)',
    focus: 'Database & API Integration',
  },
];

export default function InputScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Authentication & Session
  const [user, setUser] = useState(null);
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setUser(getStoredUser());
  }, [navigate]);

  // Sidebar Layout State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return getStoredSidebarCollapsed();
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [industry, setIndustry] = useState('Enterprise Technology');
  const [problemPrompt, setProblemPrompt] = useState('');
  const [selectedCloud, setSelectedCloud] = useState('Azure (Microsoft Ecosystem)');
  const [selectedFocus, setSelectedFocus] = useState('AI Solution & Process Automation');
  const [targetTimeline, setTargetTimeline] = useState('Production MVP (8–12 Weeks)');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // 4-in-1 Input Mode: 'text' | 'doc' | 'url' | 'voice'
  const [inputMode, setInputMode] = useState('text');

  // Multilingual, Role & Credits State
  const { t, currentLanguage } = useTranslation();
  const [currentRole, setCurrentRole] = useState(() => getUserRole());
  const [credits, setCredits] = useState(() => getUserCredits());

  useEffect(() => {
    syncUserCreditsWithBackend().then(bal => setCredits(bal));
    const handleRole = (e) => setCurrentRole(e.detail?.role || getUserRole());
    const handleCredits = (e) => setCredits(e.detail?.credits || getUserCredits());
    window.addEventListener('role_changed', handleRole);
    window.addEventListener('credits_changed', handleCredits);
    return () => {
      window.removeEventListener('role_changed', handleRole);
      window.removeEventListener('credits_changed', handleCredits);
    };
  }, []);
  const isViewer = currentRole === 'viewer';

  // URL Scraping State
  const [urlInput, setUrlInput] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);

  // Voice Recording State & Real Web Speech API
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const voiceTimerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Handle Language Change (UI localization ONLY — does NOT overwrite user prompt!)
  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
  };

  // Explicit user-triggered demo loader (ONLY when user explicitly clicks an example button)
  const handleLoadDemoPreset = (presetKey) => {
    if (presetKey === 'gov_hi') {
      setCurrentLanguage('hi');
      setTitle('स्मार्ट सिटी ई-गवर्नेंस नागरिक सेवा पोर्टल');
      setProblemPrompt(t('samplePrompts.smartGovernance', 'hi'));
      setIndustry('Public Sector / Government');
    } else if (presetKey === 'gov_gu') {
      setCurrentLanguage('gu');
      setTitle('સ્માર્ટ સિટી ઈ-ગવર્નન્સ નાગરિક સેવા પોર્ટલ');
      setProblemPrompt(t('samplePrompts.smartGovernance', 'gu'));
      setIndustry('Public Sector / Government');
    } else if (presetKey === 'hr_en') {
      setCurrentLanguage('en');
      setTitle('HR & Employee Onboarding Automation');
      setProblemPrompt(t('samplePrompts.hrConsultancy', 'en'));
      setIndustry('Enterprise Technology');
    }
  };

  // Real Web Scraper via Backend API
  const handleScrapeUrl = async () => {
    if (!urlInput.trim()) {
      alert('Please enter a valid URL to extract requirements.');
      return;
    }
    setIsScrapingUrl(true);
    try {
      const res = await fetch('http://localhost:5000/api/ai/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not scrape requirements from URL.');
      }

      if (data.title && !title.trim()) {
        setTitle(data.title.slice(0, 80));
      }

      setProblemPrompt(prev => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed}\n\n${data.extractedContent}` : data.extractedContent;
      });

      setInputMode('text');
    } catch (err) {
      alert(`Scraping error: ${err.message}`);
    } finally {
      setIsScrapingUrl(false);
    }
  };

  // Real Microphone & Web Speech Recognition
  const handleToggleVoiceRecord = async () => {
    if (!isRecording) {
      setVoiceError('');
      setLiveTranscript('');

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setVoiceError('Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
      }

      try {
        // Request actual microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        // Real Web Audio API for volume metering
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
              if (!audioStreamRef.current) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              setVoiceVolume(Math.min(100, Math.round((avg / 128) * 100)));
              animationFrameRef.current = requestAnimationFrame(checkVolume);
            };
            checkVolume();
          }
        } catch (e) {
          console.warn('Real audio meter setup notice:', e);
        }

        // Initialize SpeechRecognition with user's selected language
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        const langMap = {
          hi: 'hi-IN',
          gu: 'gu-IN',
          es: 'es-ES',
          fr: 'fr-FR',
          en: 'en-US',
        };
        recognition.lang = langMap[currentLanguage] || 'en-US';

        let finalAccumulated = '';

        recognition.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              finalAccumulated += res[0].transcript + ' ';
            } else {
              interim += res[0].transcript;
            }
          }
          const spoken = (finalAccumulated + interim).trim();
          setLiveTranscript(spoken);
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition notice:', event.error);
          if (event.error === 'not-allowed') {
            setVoiceError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
            setIsRecording(false);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;

        setIsRecording(true);
        setRecordSeconds(0);
        voiceTimerRef.current = setInterval(() => {
          setRecordSeconds(s => s + 1);
        }, 1000);

      } catch (err) {
        console.error('Microphone access failed:', err);
        setVoiceError('Could not open microphone: ' + (err.message || 'Permission denied. Please grant microphone access.'));
        setIsRecording(false);
      }

    } else {
      // User clicked stop
      setIsRecording(false);
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }

      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) {}
        audioContextRef.current = null;
      }

      setVoiceVolume(0);

      // Append ONLY what the user actually spoke into the microphone!
      if (liveTranscript.trim()) {
        const spokenWords = liveTranscript.trim();
        setProblemPrompt(prev => {
          const trimmedPrev = prev.trim();
          return trimmedPrev ? `${trimmedPrev}\n\n${spokenWords}` : spokenWords;
        });

        if (!title.trim()) {
          const words = spokenWords.split(' ').slice(0, 6).join(' ');
          setTitle(words.charAt(0).toUpperCase() + words.slice(1));
        }

        setLiveTranscript('');
        setInputMode('text'); // switch to review text
      } else {
        setVoiceError('No speech was detected from your microphone. Please click the mic and speak clearly into your device.');
      }
    }
  };

  // Real Document Extract to Text Prompt
  const handleExtractDocToContext = async () => {
    if (uploadedFiles.length === 0) return;

    let extractedText = '';
    for (const file of uploadedFiles) {
      try {
        const content = await readFileContent(file);
        if (content && content.trim()) {
          extractedText += `\n\n[Ingested from: ${file.name}]\n${content.slice(0, 3000)}`;
        }
      } catch (e) {
        console.warn('Could not read file:', file.name, e);
      }
    }

    if (extractedText.trim()) {
      setProblemPrompt(prev => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed}${extractedText}` : extractedText.trim();
      });
      if (!title.trim() && uploadedFiles[0]) {
        setTitle(uploadedFiles[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      setInputMode('text');
    } else {
      alert('No readable text could be extracted from the uploaded document.');
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.csv')) {
        reader.onload = (e) => resolve(e.target.result || '');
        reader.onerror = () => resolve('');
        reader.readAsText(file);
      } else {
        reader.onload = (e) => {
          try {
            const buffer = new Uint8Array(e.target.result);
            let text = '';
            let word = '';
            for (let i = 0; i < Math.min(buffer.length, 50000); i++) {
              const byte = buffer[i];
              if (byte >= 32 && byte <= 126) {
                word += String.fromCharCode(byte);
              } else if (byte === 10 || byte === 13) {
                if (word.length >= 3) text += word + '\n';
                word = '';
              } else {
                if (word.length >= 3) text += word + ' ';
                word = '';
              }
            }
            if (word.length >= 3) text += word;
            const cleaned = text.replace(/\s+/g, ' ').trim();
            resolve(cleaned || `[Binary Document: ${file.name}, Size: ${(file.size / 1024).toFixed(1)} KB]`);
          } catch {
            resolve(`[Document: ${file.name}, Size: ${(file.size / 1024).toFixed(1)} KB]`);
          }
        };
        reader.onerror = () => resolve('');
        reader.readAsArrayBuffer(file);
      }
    });
  };

  // Submission & AI Generation State
  const [submitting, setSubmitting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showInvalidModal, setShowInvalidModal] = useState(false);

  // Debounced LLM SOP / BRD Validation
  useEffect(() => {
    const textToValidate = problemPrompt.trim();
    if (!textToValidate || textToValidate.length < 15) {
      setValidationResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidating(true);
      try {
        const res = await fetch('http://localhost:5000/api/ai/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToValidate }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.validation) {
            setValidationResult(data.validation);
          }
        }
      } catch (e) {
        // quiet fallback
      } finally {
        setIsValidating(false);
      }
    }, 650);

    return () => clearTimeout(timer);
  }, [problemPrompt]);

  // Apply Quick-Start Template
  const handleApplyTemplate = (tpl) => {
    setTitle(tpl.title);
    setProblemPrompt(tpl.samplePrompt);
    setSelectedCloud(tpl.cloud);
    setSelectedFocus(tpl.focus);
    setErrorNotice('');
    setValidationResult(null);
    setShowInvalidModal(false);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    const filtered = newFiles.filter(file => {
      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 25MB limit.`);
        return false;
      }
      return true;
    });

    setUploadedFiles(prev => [...prev, ...filtered]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate Completeness Score for AI Consultant Readiness
  const calcCompleteness = () => {
    let score = 0;
    if (title.trim().length >= 4) score += 20;
    if (problemPrompt.trim().length >= 40) score += 40;
    else if (problemPrompt.trim().length > 0) score += 20;
    if (uploadedFiles.length > 0) score += 20;
    if (selectedCloud) score += 10;
    if (selectedFocus) score += 10;
    return Math.min(100, score);
  };

  const completeness = calcCompleteness();

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorNotice('');

    if (isViewer) {
      alert('🔒 Access Restricted: Creation of new transformation blueprints is disabled in Viewer (Read-Only) mode. Switch your role to Developer or Admin in the top navigation bar to proceed.');
      return;
    }

    // 0. Enforce Coin Cost (1 Coin per Generation)
    const availableCredits = getUserCredits();
    if (availableCredits <= 0) {
      alert('🪙 Insufficient Coins: Blueprint generation costs 1 coin. You have 0 coins remaining. Redirecting to Pricing to recharge...');
      navigate('/pricing');
      return;
    }

    if (validationResult && !validationResult.isValid) {
      setShowInvalidModal(true);
      setErrorNotice(validationResult.reason || 'Please provide a valid business requirement or SOP before proceeding.');
      return;
    }

    if (!title.trim()) {
      setErrorNotice('Please provide a title for your transformation blueprint project.');
      return;
    }

    if (!problemPrompt.trim() && uploadedFiles.length === 0) {
      setErrorNotice('Please provide either an initial business problem description or upload supporting documentation (SOPs, BRDs, PDFs).');
      return;
    }

    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setProgressMsg('Initializing Business Transformation session in MySQL...');

    try {
      // 1. Compose full context text from prompt + selected parameters
      const compositeInitialText = `Project Title: ${title.trim()}
Industry Domain: ${industry}
Target Cloud Platform: ${selectedCloud}
Transformation Focus: ${selectedFocus}
Target Delivery Horizon: ${targetTimeline}

Business Problem & Transformation Requirements:
${problemPrompt.trim()}`.trim();

      // 2. Initialize Session
      const sessionRes = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          initialText: compositeInitialText,
        }),
      });

      if (!sessionRes.ok) {
        const errData = await sessionRes.json().catch(() => ({}));
        if (sessionRes.status === 402 || errData.error === 'INSUFFICIENT_CREDITS') {
          alert('🪙 Insufficient Coins: You have 0 coins left. Please purchase coins on the Pricing page.');
          navigate('/pricing');
          return;
        }
        if (errData.validation && !errData.validation.isValid) {
          setValidationResult(errData.validation);
          setShowInvalidModal(true);
          setErrorNotice(errData.message || 'Input is not a valid SOP or Business Requirement.');
          setSubmitting(false);
          return;
        }
        throw new Error(errData.message || 'Failed to initialize transformation session.');
      }

      const sessionData = await sessionRes.json();
      const sessionId = sessionData.session.id;

      // 3. Upload Any Supporting Business Documents in Parallel (Sub-second)
      if (uploadedFiles.length > 0) {
        setProgressMsg(`Uploading ${uploadedFiles.length} supporting document(s) in parallel...`);
        const uploadTasks = uploadedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('fileName', file.name);
          formData.append('fileType', file.type || 'application/octet-stream');

          const uploadRes = await fetch(`http://localhost:5000/api/sessions/${sessionId}/input`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (!uploadRes.ok) {
            console.warn(`Warning: document "${file.name}" could not be ingested.`);
          }
        });
        await Promise.all(uploadTasks);
      }

      const remaining = typeof sessionData.remainingCredits === 'number'
        ? setUserCredits(sessionData.remainingCredits)
        : deductUserCredit(1);
      setCredits(remaining);
      setProgressMsg(`✓ 1 Coin Deducted (${remaining} coin${remaining === 1 ? '' : 's'} remaining). AI Discovery Engine active. Redirecting to Q&A...`);
      setTimeout(() => {
        navigate(`/session/${sessionId}`);
      }, 700);

    } catch (err) {
      console.error(err);
      setErrorNotice(err.message || 'Error creating transformation blueprint. Ensure backend is running on port 5000.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif', color: C.textH }}>
      {/* Invalid SOP / BRD Ask-Again Modal */}
      {showInvalidModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 520,
            width: '100%',
            padding: 28,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '1px solid #fee2e2',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                fontSize: 22,
                fontWeight: 900,
              }}>
                !
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#991b1b' }}>
                  Input Clarification Required
                </h3>
                <p style={{ margin: 0, fontSize: 12.5, color: '#b91c1c' }}>
                  Not a valid Standard Operating Procedure or Business Requirement
                </p>
              </div>
            </div>

            <div style={{
              background: '#fef2f2',
              borderRadius: 12,
              padding: 14,
              marginBottom: 18,
              border: '1px solid #fecaca',
            }}>
              <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.5, marginBottom: 10 }}>
                {validationResult?.reason || 'The provided text does not contain sufficient business context or process workflow steps to formulate an Architecture Blueprint.'}
              </div>

              {validationResult?.guidance && (
                <div style={{ fontSize: 12, color: '#7f1d1d', fontWeight: 600 }}>
                  💡 Recommendation: {validationResult.guidance}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textH, marginBottom: 8 }}>
                To proceed, please ensure your input includes:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: C.textB }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#ef4444' }}>•</span> Current operational workflow
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#ef4444' }}>•</span> Existing systems (ERP/CRM)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#ef4444' }}>•</span> Key bottlenecks/pain points
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#ef4444' }}>•</span> Target transformation goal
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  handleApplyTemplate(TEMPLATES[0]);
                  setShowInvalidModal(false);
                }}
                style={{
                  background: C.surfaceAlt,
                  border: `1px solid ${C.border}`,
                  color: C.textB,
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Use Example SOP
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowInvalidModal(false);
                }}
                style={{
                  background: C.primary,
                  border: 'none',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                }}
              >
                Revise My Input
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar />

      {/* Glassmorphic Sidebar */}
      <DashboardSidebar
        user={user}
        totalSessions={0}
        completedCount={0}
        inProgressCount={0}
        onNewBlueprint={() => {}}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <main
        style={{
          marginLeft: sidebarCollapsed ? 68 : 244,
          padding: '88px 32px 64px',
          transition: 'margin-left 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          minHeight: 'calc(100vh - 64px)',
          boxSizing: 'border-box',
        }}
        className="input-main"
      >
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>

          {/* Breadcrumb & Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textSub, marginBottom: 8 }}>
              <span style={{ cursor: 'pointer', color: C.primary, fontWeight: 600 }} onClick={() => navigate('/dashboard')}>
                {t('input.breadcrumbHome') || 'Dashboard'}
              </span>
              <span>/</span>
              <span>{t('input.breadcrumbNew') || 'New Blueprint'}</span>
              <span>/</span>
              <span style={{ color: C.textB, fontWeight: 600 }}>{t('input.stageIntake') || 'Stage 1: Business Intake'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: C.textH, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  {t('input.title') || 'Business Transformation Intake'}
                </h1>
                <p style={{ fontSize: 14, color: C.textM, margin: 0, maxWidth: 640 }}>
                  {t('input.subtitle') || 'Convert your business idea, legacy challenge, or operational SOP into an implementation-ready enterprise blueprint powered by AI Business Analysis.'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {/* Real Live Coin Balance Badge */}
                <div
                  onClick={() => navigate('/pricing')}
                  style={{
                    background: credits > 0 ? '#ecfdf5' : '#fef2f2',
                    border: `1.5px solid ${credits > 0 ? '#a7f3d0' : '#fecaca'}`,
                    borderRadius: 12,
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                  title="Click to recharge coins on Pricing page"
                >
                  <span style={{ fontSize: 22 }}>🪙</span>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: credits > 0 ? '#047857' : '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Balance (1 Coin / Gen)
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: credits > 0 ? '#065f46' : '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{credits} {credits === 1 ? 'Coin' : 'Coins'}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.primary, textDecoration: 'underline' }}>
                        {credits === 0 ? '+ Recharge' : 'Get More'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Stage Badge */}
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Transformation Pipeline
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: C.primaryDk }}>
                    {t('input.stepIndicator') || 'Step 1 of 3: Context Intake'}
                  </div>
                </div>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: C.grad,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 15,
                  boxShadow: '0 3px 10px rgba(99,102,241,0.35)',
                }}>
                  1
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* RBAC Viewer Alert Notice */}
          {isViewer && (
            <div style={{
              background: '#fef2f2',
              border: '1.5px solid #fca5a5',
              borderRadius: 14,
              padding: '14px 20px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: '0 2px 8px rgba(239,68,68,0.06)',
            }}>
              <span style={{ fontSize: 24 }}>🔒</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: '#991b1b', marginBottom: 2 }}>
                  {t('rbac.viewerNotice') || 'Viewing in Read-Only Mode'}
                </div>
                <div style={{ fontSize: 12.5, color: '#b91c1c', lineHeight: 1.5 }}>
                  You are exploring with <strong>Viewer</strong> role. Blueprint creation, intake submission, and live deployment are disabled. Switch to <strong>Developer</strong> or <strong>Admin</strong> in the top navigation bar to create blueprints.
                </div>
              </div>
            </div>
          )}
          {/* Multilingual Selector & Credits Status Bar */}
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}>
            {/* Left: Language Selection & Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textB, fontSize: 13, fontWeight: 700 }}>
                <Icon d={GLOBE_ICON} size={16} color={C.primary} />
                <span>Input / Output Language:</span>
              </div>
              <select
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: `1.5px solid ${C.border}`,
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.textH,
                  background: C.surfaceAlt,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>

              {/* 1-Click Multilingual Demo Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: C.textSub, fontWeight: 600 }}>Try Example:</span>
                <button
                  type="button"
                  onClick={() => handleLoadDemoPreset('gov_hi')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #c7d2fe',
                    background: '#ffffff',
                    color: C.primaryDk,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="लोड करें: ई-गवर्नेंस नागरिक सेवा पोर्टल"
                >
                  🏛️ ई-गवर्नेंस (Hindi)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemoPreset('gov_gu')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #c7d2fe',
                    background: '#ffffff',
                    color: C.primaryDk,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="લોડ કરો: ઈ-ગવર્નન્સ નાગરિક સેવા પોર્ટલ"
                >
                  🏛️ ઈ-ગવર્નન્સ (Gujarati)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemoPreset('hr_en')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: C.textB,
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Load HR Onboarding Example"
                >
                  💼 HR Onboarding
                </button>
              </div>
            </div>

            {/* Right: Credits Counter & Balance */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 14px',
                borderRadius: 20,
                background: '#fef3c7',
                border: '1px solid #fde68a',
                color: '#92400e',
                fontSize: 12.5,
                fontWeight: 700,
              }}>
                <span>🪙</span>
                <span>{credits} Credits Available</span>
              </div>
              <span style={{ fontSize: 11, color: C.textSub }}>
                (1 credit per blueprint compilation)
              </span>
            </div>
          </div>

          {/* 4-in-1 Input Mode Selector */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 24,
          }} className="input-modes-grid">
            {[
              { id: 'text', label: '1. Text Idea', icon: CHAT_ICON, desc: 'Describe problem or use templates' },
              { id: 'doc', label: '2. Upload Doc [PDF/PPT]', icon: UPLOAD_ICON, desc: 'PDF, DOCX, PPTX extraction' },
              { id: 'url', label: '3. Paste URL', icon: LINK_ICON, desc: 'Webpage SOP scraper & specs' },
              { id: 'voice', label: '4. Voice Record', icon: MIC_ICON, desc: 'Audio recording & transcription' },
            ].map((mode) => {
              const active = inputMode === mode.id;
              return (
                <div
                  key={mode.id}
                  onClick={() => setInputMode(mode.id)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 14,
                    background: active ? '#ffffff' : C.surface,
                    border: `2px solid ${active ? C.primary : C.border}`,
                    cursor: 'pointer',
                    boxShadow: active ? '0 6px 18px rgba(99,102,241,0.12)' : 'none',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: active ? C.primaryLt : C.surfaceAlt,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Icon d={mode.icon} size={15} color={active ? C.primary : C.textM} />
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: active ? C.primary : C.textH }}>
                      {mode.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: C.textSub, marginLeft: 36 }}>
                    {mode.desc}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 14.5, fontWeight: 700, color: C.textB, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon d={SPARK_ICON} size={16} color={C.primary} />
                Quick-Start Transformation Archetypes (Click to Auto-Fill)
              </h2>
              <span style={{ fontSize: 12, color: C.textSub }}>Optional Pre-sets</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 14,
            }} className="templates-grid">
              {TEMPLATES.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl)}
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = C.primary;
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,102,241,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                  }}
                >
                  <div>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: C.primaryDk,
                      background: C.primaryLt,
                      padding: '2px 7px',
                      borderRadius: 6,
                      display: 'inline-block',
                      marginBottom: 8,
                    }}>
                      {tpl.tag}
                    </span>
                    <h3 style={{ fontSize: 13.5, fontWeight: 700, color: C.textH, margin: '0 0 6px', lineHeight: 1.3 }}>
                      {tpl.title}
                    </h3>
                    <p style={{ fontSize: 12, color: C.textM, margin: 0, lineHeight: 1.45 }}>
                      {tpl.desc}
                    </p>
                  </div>
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.surfaceAlt}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: C.textSub }}>{tpl.cloud.split(' ')[0]}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.primary, display: 'flex', alignItems: 'center', gap: 3 }}>
                      Use Template →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form & Sidebar Grid */}
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 340px',
              gap: 28,
            }} className="input-grid">

              {/* Left Column: Primary Intake Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Section 1: Project Identity */}
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 24,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primaryLt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon d={LAYERS_ICON} size={17} color={C.primary} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: C.textH }}>1. Project Title & Industry Domain</h2>
                      <p style={{ fontSize: 12.5, color: C.textM, margin: 0 }}>Identify the initiative for organization governance</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }} className="title-industry-grid">
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textB, marginBottom: 6 }}>
                        Blueprint Project Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Automated Claims Adjudication Platform"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: 9,
                          border: `1.5px solid ${C.border}`,
                          fontSize: 14,
                          color: C.textH,
                          outline: 'none',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.15s',
                        }}
                        onFocus={e => e.target.style.borderColor = C.primary}
                        onBlur={e => e.target.style.borderColor = C.border}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textB, marginBottom: 6 }}>
                        Industry Sector
                      </label>
                      <select
                        value={industry}
                        onChange={e => setIndustry(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          borderRadius: 9,
                          border: `1.5px solid ${C.border}`,
                          fontSize: 13.5,
                          color: C.textH,
                          background: C.surface,
                          outline: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="Enterprise Technology">Enterprise Technology</option>
                        <option value="Banking & Financial Services">Banking & Financial Services</option>
                        <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                        <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                        <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                        <option value="Energy & Utilities">Energy & Utilities</option>
                        <option value="Public Sector / Government">Public Sector</option>
                        <option value="Other">Other Specialized Domain</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Problem Description & Business Goals */}
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 24,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon d={CHAT_ICON} size={17} color="#0284c7" />
                      </div>
                      <div>
                        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: C.textH }}>2. Business Context & Challenges</h2>
                        <p style={{ fontSize: 12.5, color: C.textM, margin: 0 }}>Describe current bottlenecks, pain points, and transformation goals</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: C.textSub }}>
                      {problemPrompt.length} characters
                    </span>
                  </div>

                  {/* Interactive URL Scraper Panel (Mode: url) */}
                  {inputMode === 'url' && (
                    <div style={{
                      background: '#f0f9ff',
                      border: '1.5px solid #bae6fd',
                      borderRadius: 14,
                      padding: 18,
                      marginBottom: 18,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Icon d={LINK_ICON} size={18} color="#0284c7" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0369a1' }}>
                          Web Scraper & Enterprise Spec Extractor
                        </span>
                      </div>
                      <p style={{ fontSize: 12.5, color: '#0c4a6e', margin: '0 0 12px' }}>
                        Paste any public URL (SOP doc, Confluence/Notion page, or RFP link) to automatically scrape requirements and pre-fill context:
                      </p>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                        <input
                          type="url"
                          placeholder="https://example.gov.in/digital-citizen-services.html"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: 9,
                            border: '1.5px solid #7dd3fc',
                            fontSize: 13.5,
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleScrapeUrl}
                          disabled={isScrapingUrl}
                          style={{
                            background: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            padding: '10px 18px',
                            borderRadius: 9,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          {isScrapingUrl ? 'Scraping Specs...' : 'Scrape & Extract'}
                        </button>
                      </div>
                      {/* Sample URLs */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 600 }}>Try sample URL:</span>
                        <button
                          type="button"
                          onClick={() => setUrlInput('https://digitalindia.gov.in/citizen-services-sop.html')}
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: '#ffffff',
                            border: '1px solid #7dd3fc',
                            color: '#0369a1',
                            cursor: 'pointer',
                          }}
                        >
                          🏛️ Citizen Services SOP
                        </button>
                        <button
                          type="button"
                          onClick={() => setUrlInput('https://enterprise.acme.com/hr-onboarding-spec.html')}
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: '#ffffff',
                            border: '1px solid #7dd3fc',
                            color: '#0369a1',
                            cursor: 'pointer',
                          }}
                        >
                          💼 HR Onboarding Spec
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Interactive Voice Recording Studio (Mode: voice) */}
                  {inputMode === 'voice' && (
                    <div style={{
                      background: isRecording ? '#fef2f2' : '#f5f3ff',
                      border: `1.5px solid ${isRecording ? '#fca5a5' : '#ddd6fe'}`,
                      borderRadius: 14,
                      padding: 20,
                      marginBottom: 18,
                      textAlign: 'center',
                      transition: 'all 0.25s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                        <Icon d={MIC_ICON} size={20} color={isRecording ? '#ef4444' : '#7c3aed'} />
                        <span style={{ fontSize: 14.5, fontWeight: 800, color: isRecording ? '#b91c1c' : '#6d28d9' }}>
                          {isRecording ? 'Listening to Live Microphone Stream...' : 'AI Voice Intake Studio'}
                        </span>
                      </div>
                      <p style={{ fontSize: 12.5, color: C.textM, margin: '0 0 16px' }}>
                        Click the microphone and speak your problem statement in English, हिन्दी (Hindi), or ગુજરાતી (Gujarati):
                      </p>

                      {/* Mic Button & Waveform */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                        <button
                          type="button"
                          onClick={handleToggleVoiceRecord}
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: isRecording ? '#ef4444' : C.primary,
                            border: 'none',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: isRecording ? '0 0 0 10px rgba(239, 68, 68, 0.25)' : '0 4px 20px rgba(99, 102, 241, 0.35)',
                            transition: 'all 0.2s',
                          }}
                          title={isRecording ? 'Click to Stop Recording' : 'Click to Open Microphone'}
                        >
                          <Icon d={isRecording ? STOP_ICON : MIC_ICON} size={28} color="#fff" />
                        </button>

                        {/* Real Audio Volume Waveform */}
                        {isRecording && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 32 }}>
                            {[10, 20, 16, 28, 14, 26, 12, 24, 18, 30, 15, 22].map((baseH, idx) => {
                              const dynamicHeight = Math.max(6, Math.min(32, Math.round(baseH * (voiceVolume > 0 ? (voiceVolume / 45) : 0.4))));
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    width: 4,
                                    height: `${dynamicHeight}px`,
                                    background: voiceVolume > 20 ? '#ef4444' : '#f87171',
                                    borderRadius: 2,
                                    transition: 'height 0.08s ease',
                                  }}
                                />
                              );
                            })}
                          </div>
                        )}

                        <div style={{ fontSize: 13, fontWeight: 700, color: isRecording ? '#ef4444' : C.textM }}>
                          {isRecording ? `● Recording: 00:${recordSeconds.toString().padStart(2, '0')} (Click Mic to Stop & Save)` : 'Click Mic to Start Speaking'}
                        </div>

                        {/* Live Transcribed Words Stream */}
                        {liveTranscript && (
                          <div style={{
                            background: '#ffffff',
                            border: '1.5px solid #a5b4fc',
                            borderRadius: 10,
                            padding: '12px 16px',
                            maxWidth: 640,
                            width: '100%',
                            fontSize: 13.5,
                            color: '#1e1b4b',
                            textAlign: 'left',
                            boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
                          }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                              Live Microphone Stream:
                            </div>
                            <span style={{ fontStyle: 'italic', lineHeight: 1.5 }}>
                              "{liveTranscript}"
                            </span>
                          </div>
                        )}

                        {/* Voice Error Notification */}
                        {voiceError && (
                          <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fca5a5',
                            borderRadius: 8,
                            padding: '8px 14px',
                            fontSize: 12.5,
                            color: '#991b1b',
                            maxWidth: 580,
                            textAlign: 'center',
                          }}>
                            ⚠️ {voiceError}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mode: doc Banner with Quick Extract */}
                  {inputMode === 'doc' && uploadedFiles.length > 0 && (
                    <div style={{
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: 12,
                      padding: '12px 16px',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon d={FILE_ICON} size={16} color="#d97706" />
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#92400e' }}>
                          {uploadedFiles.length} file(s) uploaded.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleExtractDocToContext}
                        style={{
                          background: '#d97706',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ⚡ Extract & Auto-Fill Context
                      </button>
                    </div>
                  )}

                  <textarea
                    rows={7}
                    placeholder="Provide detailed business context:&#10;• What is the current manual or legacy workflow?&#10;• What are the key bottlenecks or pain points?&#10;• What is the desired future state and target automation outcome?&#10;• Are there any specific integration points (e.g. SAP, Salesforce, Microsoft 365, internal SQL)?"
                    value={problemPrompt}
                    onChange={e => setProblemPrompt(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 10,
                      border: `1.5px solid ${C.border}`,
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      color: C.textH,
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = C.primary}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                  {/* AI SOP / BRD Validation Status Card */}
                  {isValidating && (
                    <div style={{
                      marginTop: 12,
                      padding: '10px 14px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 12.5,
                      color: C.textM,
                    }}>
                      <div style={{ width: 14, height: 14, border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span>AI Model analyzing input against 105.5k trained dataset patterns (validating SOP / BRD structure)...</span>
                    </div>
                  )}

                  {validationResult && !isValidating && (
                    <div style={{
                      marginTop: 12,
                      padding: 14,
                      borderRadius: 12,
                      border: validationResult.isValid ? '1px solid #86efac' : '1px solid #fca5a5',
                      background: validationResult.isValid ? '#f0fdf4' : '#fef2f2',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: validationResult.isValid ? '#22c55e' : '#ef4444',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 900,
                          }}>
                            {validationResult.isValid ? '✓' : '!'}
                          </span>
                          <span style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: validationResult.isValid ? '#15803d' : '#b91c1c',
                          }}>
                            {validationResult.isValid
                              ? `Validated ${validationResult.documentType || 'Business Context'} (${validationResult.confidenceScore || 85}% confidence)`
                              : 'Clarification Needed: Input is not a valid SOP or Business Requirement'}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: validationResult.isValid ? '#166534' : '#991b1b', fontWeight: 600 }}>
                          {validationResult.isValid ? 'Grounded in Dataset Corpus' : 'Action Required'}
                        </span>
                      </div>

                      <p style={{
                        margin: '0 0 6px',
                        fontSize: 12.5,
                        color: validationResult.isValid ? '#166534' : '#991b1b',
                        lineHeight: 1.5,
                      }}>
                        {validationResult.reason}
                      </p>

                      {validationResult.summary && validationResult.isValid && (
                        <div style={{ fontSize: 12, color: '#15803d', fontStyle: 'italic', marginBottom: 4 }}>
                          "{validationResult.summary}"
                        </div>
                      )}

                      {!validationResult.isValid && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #fecaca' }}>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#7f1d1d', marginBottom: 4 }}>
                            Checklist to qualify as a valid SOP / BRD:
                          </div>
                          <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 12, color: '#991b1b' }}>
                            {(validationResult.missingElements && validationResult.missingElements.length > 0) ? (
                              validationResult.missingElements.map((m, i) => <li key={i}>{m}</li>)
                            ) : (
                              <>
                                <li>Describe your current manual or legacy workflow</li>
                                <li>Mention key pain points or bottlenecks</li>
                                <li>Specify desired automation or software outcomes</li>
                              </>
                            )}
                          </ul>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                handleApplyTemplate(TEMPLATES[0]);
                                setValidationResult(null);
                              }}
                              style={{
                                background: '#dc2626',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Load Example SOP Template
                            </button>
                            <span style={{ fontSize: 11.5, color: '#991b1b' }}>or refine your description above</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: C.textSub }}>
                    <Icon d={INFO_ICON} size={14} color={C.textSub} />
                    <span>Our trained AI verifies input structure against 105,500 enterprise patterns before entering Discovery.</span>
                  </div>
                </div>

                {/* Section 3: Multi-Format Document Upload (PDF, Word, PPTX, SOPs) */}
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 24,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon d={UPLOAD_ICON} size={17} color="#d97706" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: C.textH }}>3. Upload SOPs, BRDs, PPTs & Documents</h2>
                      <p style={{ fontSize: 12.5, color: C.textM, margin: 0 }}>Support formats: PDF, DOCX, PPTX, Markdown, Text (up to 25MB each)</p>
                    </div>
                  </div>

                  {/* Dropzone Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${isDragging ? C.primary : C.borderMed}`,
                      background: isDragging ? C.primaryLt : C.surfaceAlt,
                      borderRadius: 14,
                      padding: '32px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      multiple
                      accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md,.json"
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: C.surface,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }}>
                      <Icon d={UPLOAD_ICON} size={22} color={C.primary} />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: C.textH }}>
                      Drag and drop your transformation files here, or <span style={{ color: C.primary, textDecoration: 'underline' }}>browse</span>
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: C.textSub }}>
                      SOPs, Process workflows, Architecture diagrams, RFPs, or Current-state spreadsheets
                    </p>
                  </div>

                  {/* Uploaded File List */}
                  {uploadedFiles.length > 0 && (
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.textM, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Attached Documents ({uploadedFiles.length})
                      </div>
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: C.surfaceAlt,
                          border: `1px solid ${C.border}`,
                          borderRadius: 10,
                          padding: '8px 14px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <Icon d={FILE_ICON} size={16} color={C.primary} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.textH, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {file.name}
                            </span>
                            <span style={{ fontSize: 11.5, color: C.textSub }}>
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: 4,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Remove file"
                          >
                            <Icon d={TRASH_ICON} size={14} color="#ef4444" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Architectural Parameters & AI Readiness Widget */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* AI Transformation Companion Widget */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(6,182,212,0.06) 100%)',
                  border: `1px solid rgba(99,102,241,0.2)`,
                  borderRadius: 18,
                  padding: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon d={SPARK_ICON} size={15} color="#fff" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: C.textH, margin: 0 }}>
                        AI Transformation Companion
                      </h3>
                      <p style={{ fontSize: 11.5, color: C.textSub, margin: 0 }}>Real-time Intake Guidance</p>
                    </div>
                  </div>

                  {/* Readiness Progress Bar */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      <span style={{ color: C.textB }}>Intake Completeness</span>
                      <span style={{ color: C.primaryDk }}>{completeness}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${completeness}%`,
                        height: '100%',
                        background: C.grad,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: C.textM, lineHeight: 1.5, margin: 0 }}>
                    {completeness < 50
                      ? '💡 Add a clear project title and business problem description so the AI Consultant can target its analysis.'
                      : completeness < 80
                      ? '⚡ Great start! Attaching an SOP or specifying your preferred cloud stack will deepen the architecture accuracy.'
                      : '✓ Excellent context provided! Ready to generate high-fidelity discovery questions and initial architecture.'}
                  </p>
                </div>

                {/* Architectural Preferences Panel */}
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 20,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}>
                  <h3 style={{ fontSize: 14.5, fontWeight: 800, color: C.textH, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Icon d={CLOUD_ICON} size={16} color={C.primary} />
                    Solution & Cloud Guardrails
                  </h3>

                  {/* Cloud Ecosystem */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textB, marginBottom: 6 }}>
                      Target Cloud Ecosystem
                    </label>
                    <select
                      value={selectedCloud}
                      onChange={e => setSelectedCloud(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        color: C.textH,
                        background: C.surface,
                        outline: 'none',
                      }}
                    >
                      <option value="Azure (Microsoft Ecosystem)">Azure (Microsoft Ecosystem - Preferred)</option>
                      <option value="AWS (Amazon Web Services)">AWS (Amazon Web Services)</option>
                      <option value="Google Cloud Platform (GCP)">Google Cloud Platform (GCP)</option>
                      <option value="Hybrid Cloud / On-Premises">Hybrid Cloud / On-Premises</option>
                      <option value="Multi-Cloud Architecture">Multi-Cloud Architecture</option>
                    </select>
                  </div>

                  {/* Transformation Focus */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textB, marginBottom: 6 }}>
                      Transformation Archetype
                    </label>
                    <select
                      value={selectedFocus}
                      onChange={e => setSelectedFocus(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        color: C.textH,
                        background: C.surface,
                        outline: 'none',
                      }}
                    >
                      <option value="AI Solution & Process Automation">AI Solution & Process Automation</option>
                      <option value="AI Agent & Copilot (RAG)">AI Agent & Copilot (RAG)</option>
                      <option value="Legacy Cloud Modernization">Legacy Cloud Modernization</option>
                      <option value="Database & API Integration">Database & API Integration</option>
                      <option value="Enterprise Web & Mobile App">Enterprise Web & Mobile App</option>
                    </select>
                  </div>

                  {/* Target Delivery Timeline */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textB, marginBottom: 6 }}>
                      Delivery Timeline Horizon
                    </label>
                    <select
                      value={targetTimeline}
                      onChange={e => setTargetTimeline(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        color: C.textH,
                        background: C.surface,
                        outline: 'none',
                      }}
                    >
                      <option value="Fast-Track POC (2–4 Weeks)">Fast-Track POC (2–4 Weeks)</option>
                      <option value="Production MVP (8–12 Weeks)">Production MVP (8–12 Weeks)</option>
                      <option value="Full Enterprise Rollout (4–6 Months)">Full Enterprise Rollout (4–6 Months)</option>
                    </select>
                  </div>
                </div>

                {/* Error Banner */}
                {errorNotice && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: '#991b1b',
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}>
                    ⚠️ {errorNotice}
                  </div>
                )}

                {/* Submission CTA Card */}
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 20,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: submitting ? C.borderMed : C.grad,
                      color: '#fff',
                      border: 'none',
                      padding: '14px 20px',
                      borderRadius: 11,
                      fontWeight: 700,
                      fontSize: 14.5,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    {submitting ? (
                      <>
                        <div style={{
                          width: 16,
                          height: 16,
                          border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'spinFast 0.8s linear infinite',
                        }} />
                        <span>Processing Intake...</span>
                      </>
                    ) : (
                      <>
                        <Icon d={SPARK_ICON} size={16} color="#fff" />
                        <span>Launch AI Discovery →</span>
                      </>
                    )}
                  </button>

                  {submitting && (
                    <p style={{ margin: 0, fontSize: 12, color: C.textM, textAlign: 'center', fontWeight: 500 }}>
                      {progressMsg}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11.5, color: C.textSub }}>
                    <Icon d={CHECK_ICON} size={13} color={C.success} />
                    <span>Advisory recommendations generated by Chaos2Commit AI</span>
                  </div>
                </div>

              </div>

            </div>
          </form>

        </div>
      </main>

      {/* Responsive Style Overrides */}
      <style>{`
        @keyframes spinFast {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 1040px) {
          .templates-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .input-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .input-main {
            margin-left: 0 !important;
            padding: 82px 18px 48px !important;
          }
        }
        @media (max-width: 640px) {
          .templates-grid { grid-template-columns: 1fr !important; }
          .title-industry-grid { grid-template-columns: 1fr !important; }
          .input-main { padding: 76px 12px 36px !important; }
        }
      `}</style>
    </div>
  );
}
