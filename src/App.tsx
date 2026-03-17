import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { Download, Upload, Settings, ChevronRight, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { i18n, Lang } from './i18n';
import { generateSkill, generateUseCases, executeSkill, generateFollowUps, extractTextFromPdfLLM } from './services/gemini';

const STUDIO_MODELS = [
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview"
];

const THEMES = [
  { id: 'default', name: 'Default Modern' },
  { id: 'van-gogh', name: 'Vincent van Gogh' },
  { id: 'monet', name: 'Claude Monet' },
  { id: 'picasso', name: 'Pablo Picasso' },
  { id: 'dali', name: 'Salvador Dali' },
  { id: 'da-vinci', name: 'Leonardo da Vinci' },
  { id: 'munch', name: 'Edvard Munch' },
  { id: 'klimt', name: 'Gustav Klimt' },
  { id: 'hokusai', name: 'Katsushika Hokusai' },
  { id: 'mondrian', name: 'Piet Mondrian' },
  { id: 'okeeffe', name: 'Georgia O\'Keeffe' }
];

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [painterStyle, setPainterStyle] = useState('default');
  
  const [step, setStep] = useState(1);
  const [skillDesc, setSkillDesc] = useState('');
  const [skillMd, setSkillMd] = useState('');
  const [useCases, setUseCases] = useState('');
  
  const [docText, setDocText] = useState('');
  const [pdfBase64, setPdfBase64] = useState('');
  
  const [selectedModel, setSelectedModel] = useState(STUDIO_MODELS[0]);
  const [task, setTask] = useState('Analyze this document according to the skill guidelines.');
  const [result, setResult] = useState('');
  const [followUps, setFollowUps] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = i18n[lang];

  useEffect(() => {
    document.documentElement.className = themeMode;
    document.documentElement.setAttribute('data-theme', painterStyle);
  }, [themeMode, painterStyle]);

  const handleGenerateSkill = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await generateSkill(skillDesc);
      setSkillMd(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateUseCases = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await generateUseCases(skillMd);
      setUseCases(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    try {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          setPdfBase64(event.target?.result as string);
          try {
            const text = await extractTextFromPdfLLM(base64);
            setDocText(text);
          } catch (err: any) {
            setError('OCR Failed: ' + err.message);
          } finally {
            setLoading(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const text = await file.text();
        setDocText(text);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await executeSkill(selectedModel, skillMd, docText, task);
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUps = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await generateFollowUps(result);
      setFollowUps(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadSkill = () => {
    const blob = new Blob([skillMd], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SKILL.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const steps = [t.step1, t.step2, t.step3, t.step4, t.step5];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-secondary)]">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-[var(--color-accent)]">🚀</span> {t.title}
        </h1>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Settings size={16} />
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as Lang)}
              className="bg-transparent border border-[var(--color-border)] rounded px-2 py-1"
            >
              <option value="en">English</option>
              <option value="zh">繁體中文</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={themeMode} 
              onChange={(e) => setThemeMode(e.target.value as 'light' | 'dark')}
              className="bg-transparent border border-[var(--color-border)] rounded px-2 py-1"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={painterStyle} 
              onChange={(e) => setPainterStyle(e.target.value)}
              className="bg-transparent border border-[var(--color-border)] rounded px-2 py-1"
            >
              {THEMES.map(theme => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-6 gap-8">
        
        {/* Sidebar Stepper */}
        <div className="w-full md:w-64 shrink-0">
          <div className="sticky top-6">
            <h2 className="text-lg font-semibold mb-4">{t.currentPhase}</h2>
            <div className="space-y-4">
              {steps.map((s, i) => {
                const stepNum = i + 1;
                const isActive = step === stepNum;
                const isPast = step > stepNum;
                return (
                  <div key={s} className={`flex items-center gap-3 ${isActive ? 'text-[var(--color-accent)] font-medium' : isPast ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] opacity-50'}`}>
                    {isPast ? <CheckCircle2 size={20} className="text-[var(--color-accent)]" /> : <Circle size={20} fill={isActive ? 'currentColor' : 'none'} />}
                    <span>{s}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1 */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold mb-6">{t.phase1Title}</h2>
                <div className="space-y-4">
                  <textarea
                    value={skillDesc}
                    onChange={(e) => setSkillDesc(e.target.value)}
                    placeholder={t.whatShouldSkillDo}
                    className="w-full h-32 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                  <button 
                    onClick={handleGenerateSkill}
                    disabled={loading || !skillDesc}
                    className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {t.generateSkillBtn}
                  </button>

                  {skillMd && (
                    <div className="mt-8 space-y-4">
                      <h3 className="text-lg font-medium">{t.editGeneratedSkill}</h3>
                      <textarea
                        value={skillMd}
                        onChange={(e) => setSkillMd(e.target.value)}
                        className="w-full h-64 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      />
                      <div className="flex gap-4">
                        <button onClick={downloadSkill} className="px-4 py-2 border border-[var(--color-border)] rounded-xl flex items-center gap-2 hover:bg-[var(--color-bg-secondary)]">
                          <Download size={16} /> {t.downloadSkill}
                        </button>
                        <button onClick={() => setStep(2)} className="px-6 py-2 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-xl font-medium flex items-center gap-2 ml-auto">
                          {t.proceedToUseCases}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold mb-6">{t.phase2Title}</h2>
                <button 
                  onClick={handleGenerateUseCases}
                  disabled={loading}
                  className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2 mb-6"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {t.generateUseCasesBtn}
                </button>

                {useCases && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                      <div className="markdown-body">
                        <Markdown>{useCases}</Markdown>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => setStep(3)} className="px-6 py-2 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-xl font-medium flex items-center gap-2">
                        {t.proceedToDoc}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold mb-6">{t.phase3Title}</h2>
                
                <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center mb-6">
                  <input type="file" id="file-upload" className="hidden" accept=".pdf,.txt,.md" onChange={handleFileUpload} />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                    <Upload size={32} className="text-[var(--color-text-secondary)]" />
                    <span className="font-medium">{t.uploadDoc}</span>
                  </label>
                  {loading && <div className="mt-4 flex items-center justify-center gap-2 text-[var(--color-accent)]"><Loader2 size={16} className="animate-spin" /> {t.extractProcess}</div>}
                </div>

                {pdfBase64 && (
                  <div className="mb-6">
                    <div className="p-3 bg-blue-50 text-blue-700 rounded-lg mb-4 text-sm font-medium border border-blue-200">
                      {t.pdfDetected}
                    </div>
                    <iframe src={pdfBase64} className="w-full h-96 rounded-xl border border-[var(--color-border)]" />
                  </div>
                )}

                {docText && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">{t.extractedContent}</h3>
                      <textarea
                        value={docText}
                        onChange={(e) => setDocText(e.target.value)}
                        className="w-full h-48 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => setStep(4)} className="px-6 py-2 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-xl font-medium flex items-center gap-2">
                        {t.proceedToExecute}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold mb-6">{t.phase4Title}</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.selectModel}</label>
                    <select 
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    >
                      {STUDIO_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{t.whatShouldAgentDo}</label>
                    <input 
                      type="text"
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>

                  <details className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <summary className="font-medium cursor-pointer">{t.viewActiveSkill}</summary>
                    <pre className="mt-4 p-4 bg-[var(--color-bg-primary)] rounded-lg overflow-x-auto text-xs font-mono">
                      {skillMd}
                    </pre>
                  </details>

                  <button 
                    onClick={handleExecute}
                    disabled={loading}
                    className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2 w-full md:w-auto"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {t.executeSkillBtn}
                  </button>

                  {result && (
                    <div className="mt-8 space-y-6">
                      <h3 className="text-xl font-bold">{t.result}</h3>
                      <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                        <div className="markdown-body">
                          <Markdown>{result}</Markdown>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button onClick={() => setStep(5)} className="px-6 py-2 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-xl font-medium flex items-center gap-2">
                          {t.generateFollowUpsBtn}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 5 */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold mb-6">{t.phase5Title}</h2>
                
                {!followUps ? (
                  <button 
                    onClick={handleFollowUps}
                    disabled={loading}
                    className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {t.generateFollowUpsBtn}
                  </button>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                      <div className="markdown-body">
                        <Markdown>{followUps}</Markdown>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <button 
                        onClick={() => {
                          setStep(1);
                          setSkillDesc('');
                          setSkillMd('');
                          setUseCases('');
                          setDocText('');
                          setPdfBase64('');
                          setResult('');
                          setFollowUps('');
                        }} 
                        className="px-6 py-2 border border-[var(--color-border)] rounded-xl font-medium hover:bg-[var(--color-bg-secondary)]"
                      >
                        {t.resetStudio}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
