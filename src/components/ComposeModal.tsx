import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Layers,
  Eye,
  Code,
  FileText,
  CheckCircle2,
  Edit3,
  Wand2,
  Mail,
  Calendar,
  Clock,
  Bot,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { EmailTemplate } from '../types';
import { api } from '../services/api';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSentSuccess: () => void;
  initialTemplate?: EmailTemplate | null;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSentSuccess,
  initialTemplate,
  initialTo = '',
  initialSubject = '',
  initialBody = ''
}) => {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [bodyContent, setBodyContent] = useState(initialBody);
  const [recipientName, setRecipientName] = useState('Valued Recipient');
  const [senderName, setSenderName] = useState('Me');
  const [ctaText, setCtaText] = useState('View Details');
  const [ctaLink, setCtaLink] = useState('#');

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('plain');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  // HTML & View State
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  
  // AI Template Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiEnhancing, setIsAiEnhancing] = useState(false);
  const [showAiPromptBox, setShowAiPromptBox] = useState(false);

  // AI Writer Assistant State
  const [showAiWriter, setShowAiWriter] = useState(false);
  const [aiWritePrompt, setAiWritePrompt] = useState('');
  const [aiWriteTone, setAiWriteTone] = useState<string>('Professional');
  const [isAiWriting, setIsAiWriting] = useState(false);

  // Schedule Mail State
  const [isScheduleMode, setIsScheduleMode] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });

  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      if (initialTo) setTo(initialTo);
      if (initialSubject) setSubject(initialSubject);
      if (initialBody) setBodyContent(initialBody);
      if (initialTemplate) {
        setSelectedTemplateId(initialTemplate.id);
        setSelectedTemplate(initialTemplate);
        setIsHtmlMode(true);
      }
    }
  }, [isOpen, initialTemplate, initialTo, initialSubject, initialBody]);

  const loadTemplates = async () => {
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    if (id === 'plain') {
      setSelectedTemplate(null);
      setIsHtmlMode(false);
    } else {
      const tpl = templates.find(t => t.id === id);
      if (tpl) {
        setSelectedTemplate(tpl);
        setIsHtmlMode(true);
        if (tpl.subjectTemplate && !subject) {
          setSubject(tpl.subjectTemplate.replace('{{subject}}', ''));
        }
      }
    }
  };

  // Re-render HTML whenever template or variables change
  useEffect(() => {
    if (isHtmlMode && selectedTemplate) {
      let rendered = selectedTemplate.htmlContent
        .replace(/\{\{\s*recipientName\s*\}\}/g, recipientName || 'Valued Recipient')
        .replace(/\{\{\s*subject\s*\}\}/g, subject || 'No Subject')
        .replace(/\{\{\s*bodyContent\s*\}\}/g, (bodyContent || '').replace(/\n/g, '<br/>'))
        .replace(/\{\{\s*ctaText\s*\}\}/g, ctaText || 'View Details')
        .replace(/\{\{\s*ctaLink\s*\}\}/g, ctaLink || '#')
        .replace(/\{\{\s*senderName\s*\}\}/g, senderName || 'Me');

      setRenderedHtml(rendered);
    } else {
      setRenderedHtml(bodyContent);
    }
  }, [isHtmlMode, selectedTemplate, recipientName, subject, bodyContent, ctaText, ctaLink, senderName]);

  // AI HTML Template Design Generator
  const handleAiEnhanceEmail = async () => {
    if (!aiPrompt.trim() && !bodyContent.trim()) {
      alert('Please enter text or an AI instruction prompt to enhance.');
      return;
    }
    setIsAiEnhancing(true);
    try {
      const promptToUse = aiPrompt.trim()
        ? `Create a rich HTML email for subject "${subject || 'Update'}" based on: "${aiPrompt}"`
        : `Design a high quality HTML email template for: "${bodyContent}"`;

      const generatedHtml = await api.generateAiTemplate(promptToUse);
      setIsHtmlMode(true);
      
      const customTpl: EmailTemplate = {
        id: `tpl-ai-${Date.now()}`,
        name: 'AI Generated Custom Template',
        description: 'Dynamically designed by AI',
        category: 'custom',
        subjectTemplate: '{{subject}}',
        htmlContent: generatedHtml,
        isBuiltIn: false
      };

      setSelectedTemplate(customTpl);
      setSelectedTemplateId('custom-ai');
      setShowAiPromptBox(false);
      setViewMode('preview');
    } catch (err: any) {
      alert('AI Email generation failed: ' + (err.message || err));
    } finally {
      setIsAiEnhancing(false);
    }
  };

  // AI Write Mail Copy Assistant
  const handleAiWriteEmail = async (overridePrompt?: string) => {
    const promptToRun = overridePrompt || aiWritePrompt;
    if (!promptToRun.trim()) {
      alert('Please enter what you would like AI to write about.');
      return;
    }

    setIsAiWriting(true);
    try {
      const result = await api.aiWriteEmail({
        prompt: promptToRun,
        to,
        subject,
        tone: aiWriteTone,
        body: bodyContent
      });

      if (result.subject && !subject) {
        setSubject(result.subject);
      }
      if (result.body) {
        setBodyContent(result.body);
      }
      setShowAiWriter(false);
    } catch (err: any) {
      alert('AI Email Writer failed: ' + (err.message || err));
    } finally {
      setIsAiWriting(false);
    }
  };

  // Helper for Schedule Presets
  const setQuickSchedule = (type: 'tomorrow-morning' | 'in-2-hours' | 'monday-morning') => {
    const now = new Date();
    if (type === 'tomorrow-morning') {
      now.setDate(now.getDate() + 1);
      now.setHours(9, 0, 0, 0);
    } else if (type === 'in-2-hours') {
      now.setHours(now.getHours() + 2);
    } else if (type === 'monday-morning') {
      const day = now.getDay();
      const daysUntilMonday = day === 0 ? 1 : 8 - day;
      now.setDate(now.getDate() + daysUntilMonday);
      now.setHours(9, 0, 0, 0);
    }
    setScheduledDateTime(now.toISOString().slice(0, 16));
  };

  const handleSendOrScheduleEmail = async () => {
    if (!to.trim()) {
      alert('Please specify a recipient email address.');
      return;
    }

    setIsSending(true);
    try {
      const finalBody = isHtmlMode && renderedHtml ? renderedHtml : bodyContent;

      if (isScheduleMode) {
        if (!scheduledDateTime) {
          alert('Please specify a valid schedule date and time.');
          setIsSending(false);
          return;
        }

        const dateObj = new Date(scheduledDateTime);
        await api.scheduleEmail({
          to,
          subject: subject || '(No Subject)',
          body: finalBody,
          scheduledAt: dateObj.toISOString()
        });

        alert(`⏰ Email successfully scheduled for ${dateObj.toLocaleString()} and saved to your connected Gmail account!`);
      } else {
        await api.sendEmail({
          to,
          subject: subject || '(No Subject)',
          body: finalBody,
          isHtml: isHtmlMode
        });

        alert(`Email successfully dispatched to ${to}!`);
      }

      onSentSuccess();
      onClose();
    } catch (err: any) {
      alert('Operation failed: ' + (err.message || err));
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 text-indigo-400 p-2 rounded-xl border border-indigo-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Compose Email & AI Assistant
              </h2>
              <p className="text-xs text-slate-400">Write, AI enhance, schedule delivery, and sync with your connected Gmail account</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3">
            {/* Template Selector */}
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-slate-300">Template:</span>
              <select
                value={selectedTemplateId}
                onChange={e => handleTemplateChange(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 font-medium text-xs focus:ring-1 focus:ring-indigo-500"
              >
                <option value="plain">📄 Plain Text Message</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    ✨ {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Writer Assistant Toggle Button */}
            <button
              onClick={() => {
                setShowAiWriter(!showAiWriter);
                if (showAiPromptBox) setShowAiPromptBox(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all border ${
                showAiWriter
                  ? 'bg-purple-600 text-white border-purple-500 shadow-lg'
                  : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border-purple-500/30'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>✨ AI Write Email</span>
            </button>

            {/* AI Generator Button */}
            <button
              onClick={() => {
                setShowAiPromptBox(!showAiPromptBox);
                if (showAiWriter) setShowAiWriter(false);
              }}
              className="px-3 py-1.5 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg font-semibold flex items-center gap-1.5 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>✨ AI HTML Design</span>
            </button>

            {/* View Toggle */}
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                  viewMode === 'edit'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                  viewMode === 'preview'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> HTML Preview
              </button>
            </div>
          </div>
        </div>

        {/* AI Writer Drawer Overlay */}
        {showAiWriter && (
          <div className="p-4 bg-purple-950/40 border-b border-purple-500/30 space-y-3 shrink-0 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI Write Email Copy Assistant</span>
              </div>
              <button
                onClick={() => setShowAiWriter(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={aiWritePrompt}
                onChange={e => setAiWritePrompt(e.target.value)}
                placeholder="Describe what to write (e.g., Polite follow up regarding Q3 project extension)..."
                className="flex-1 bg-slate-900 border border-purple-500/40 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-purple-500"
              />

              {/* Tone Selection */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-300 font-semibold">Tone:</span>
                <select
                  value={aiWriteTone}
                  onChange={e => setAiWriteTone(e.target.value)}
                  className="bg-slate-900 border border-purple-500/40 text-white rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-purple-500"
                >
                  <option value="Professional">Professional 👔</option>
                  <option value="Friendly">Friendly 😊</option>
                  <option value="Persuasive">Persuasive 🚀</option>
                  <option value="Short & Direct">Short & Direct ⚡</option>
                  <option value="Formal">Formal 📜</option>
                </select>

                <button
                  onClick={() => handleAiWriteEmail()}
                  disabled={isAiWriting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAiWriting ? 'Writing...' : 'Write Email'}</span>
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="text-slate-400">Quick Prompts:</span>
              <button
                onClick={() => handleAiWriteEmail('Write a polite follow up email asking for project status update')}
                className="px-2.5 py-1 bg-purple-900/40 hover:bg-purple-800/50 text-purple-200 border border-purple-500/30 rounded-lg transition-colors"
              >
                📌 Polite Follow-up
              </button>
              <button
                onClick={() => handleAiWriteEmail('Write a thank you email after a productive business meeting')}
                className="px-2.5 py-1 bg-purple-900/40 hover:bg-purple-800/50 text-purple-200 border border-purple-500/30 rounded-lg transition-colors"
              >
                🤝 Meeting Thank You
              </button>
              <button
                onClick={() => handleAiWriteEmail('Write an email requesting a deadline extension with valid reasoning')}
                className="px-2.5 py-1 bg-purple-900/40 hover:bg-purple-800/50 text-purple-200 border border-purple-500/30 rounded-lg transition-colors"
              >
                ⏳ Extension Request
              </button>
            </div>
          </div>
        )}

        {/* AI HTML Design Box Overlay */}
        {showAiPromptBox && (
          <div className="px-6 py-3 bg-slate-950 border-b border-indigo-500/30 flex items-center gap-3 shrink-0">
            <input
              type="text"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Describe what kind of HTML email template AI should create (e.g., Urgent project status update with table)..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleAiEnhanceEmail}
              disabled={isAiEnhancing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAiEnhancing ? 'Generating...' : 'Generate Design'}</span>
            </button>
          </div>
        )}

        {/* Main Form & Preview Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {/* Recipient & Subject Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                To (Recipient Email)
              </label>
              <input
                type="email"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Enter subject..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Template Data Placeholders (If HTML Template is selected) */}
          {isHtmlMode && selectedTemplate && (
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-indigo-500/20 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block">
                Template Data Fields:
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Recipient Name</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Sender Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Call to Action Text</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={e => setCtaText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Button Link URL</label>
                  <input
                    type="text"
                    value={ctaLink}
                    onChange={e => setCtaLink(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Editor vs Preview Mode */}
          {viewMode === 'edit' ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Message Body
                </label>
                <button
                  type="button"
                  onClick={() => setShowAiWriter(!showAiWriter)}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Help Me Write with AI</span>
                </button>
              </div>
              <textarea
                value={bodyContent}
                onChange={e => setBodyContent(e.target.value)}
                rows={10}
                placeholder="Write your email body content here or use '✨ AI Write Email' to generate..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Live Rendered HTML Email Preview
              </span>
              <div className="h-[360px] bg-white rounded-xl overflow-hidden border border-slate-800 shadow-xl">
                <iframe
                  title="Compose HTML Preview"
                  srcDoc={renderedHtml || bodyContent}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}

          {/* Schedule Mail Control Card (If enabled) */}
          {isScheduleMode && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  <span>Schedule Email Delivery</span>
                </div>
                <span className="text-[11px] text-slate-400">Will post draft to your connected Gmail account</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:w-auto flex-1">
                  <label className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase">
                    Select Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={e => setScheduledDateTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 pt-3 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => setQuickSchedule('tomorrow-morning')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs rounded-lg border border-slate-700"
                  >
                    Tomorrow 9 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickSchedule('in-2-hours')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs rounded-lg border border-slate-700"
                  >
                    In 2 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickSchedule('monday-morning')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs rounded-lg border border-slate-700"
                  >
                    Monday 9 AM
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Dispatch Bar */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mode Toggle: Send Now vs Schedule */}
            <div className="bg-slate-900 p-0.5 rounded-xl border border-slate-800 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setIsScheduleMode(false)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  !isScheduleMode ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Send Now
              </button>
              <button
                type="button"
                onClick={() => setIsScheduleMode(true)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  isScheduleMode ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Mail</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs sm:text-sm rounded-xl border border-slate-700 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSendOrScheduleEmail}
              disabled={isSending}
              className={`px-5 py-2 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 text-white ${
                isScheduleMode
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {isScheduleMode ? (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>{isSending ? 'Scheduling...' : 'Schedule Email'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Sending Email...' : 'Send Email'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

