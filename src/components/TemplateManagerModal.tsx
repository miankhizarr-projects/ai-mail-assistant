import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Layout,
  Code,
  Eye,
  Plus,
  Save,
  Trash2,
  Check,
  Wand2,
  Copy,
  Layers
} from 'lucide-react';
import { EmailTemplate } from '../types';
import { api } from '../services/api';

interface TemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplateForCompose?: (template: EmailTemplate) => void;
}

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplateForCompose
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'gallery' | 'editor' | 'ai'>('gallery');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  // Editor states
  const [editorName, setEditorName] = useState('');
  const [editorDesc, setEditorDesc] = useState('');
  const [editorCategory, setEditorCategory] = useState<'business' | 'invitation' | 'newsletter' | 'follow-up' | 'custom'>('custom');
  const [editorSubject, setEditorSubject] = useState('{{subject}}');
  const [editorHtml, setEditorHtml] = useState('');
  const [previewTab, setPreviewTab] = useState<'preview' | 'code'>('preview');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI Generator states
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGeneratedHtml, setAiGeneratedHtml] = useState<string | null>(null);

  // Load templates on open
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const data = await api.getTemplates();
      setTemplates(data);
      if (data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleEditExisting = (tpl: EmailTemplate) => {
    setSelectedTemplate(tpl);
    setEditorName(`${tpl.name} (Copy)`);
    setEditorDesc(tpl.description || '');
    setEditorCategory(tpl.category);
    setEditorSubject(tpl.subjectTemplate || '{{subject}}');
    setEditorHtml(tpl.htmlContent);
    setActiveTab('editor');
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setEditorName('New HTML Email Template');
    setEditorDesc('Custom styled HTML email design');
    setEditorCategory('custom');
    setEditorSubject('{{subject}}');
    setEditorHtml(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .header { color: #2563eb; margin-top: 0; }
    .btn { display: inline-block; background: #2563eb; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h2 class="header">{{subject}}</h2>
    <p>Dear {{recipientName}},</p>
    <div>{{bodyContent}}</div>
    <a href="{{ctaLink}}" class="btn">{{ctaText}}</a>
    <p style="margin-top: 24px;">Warm regards,<br><strong>{{senderName}}</strong></p>
  </div>
</body>
</html>`);
    setActiveTab('editor');
  };

  const handleSaveTemplate = async () => {
    if (!editorName.trim() || !editorHtml.trim()) {
      alert('Please fill in Template Name and HTML code');
      return;
    }
    setIsSaving(true);
    try {
      const saved = await api.saveTemplate({
        id: selectedTemplate?.isBuiltIn ? undefined : selectedTemplate?.id,
        name: editorName,
        description: editorDesc,
        category: editorCategory,
        subjectTemplate: editorSubject,
        htmlContent: editorHtml
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadTemplates();
      setSelectedTemplate(saved);
    } catch (err: any) {
      alert('Error saving template: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this custom template?')) return;
    try {
      await api.deleteTemplate(id);
      await loadTemplates();
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
    } catch (err: any) {
      alert('Could not delete template: ' + (err.message || err));
    }
  };

  const handleGenerateAiTemplate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAi(true);
    try {
      const html = await api.generateAiTemplate(aiPrompt);
      setAiGeneratedHtml(html);
      setEditorName(`AI Template - ${aiPrompt.slice(0, 25)}`);
      setEditorDesc(`AI generated design based on prompt: "${aiPrompt}"`);
      setEditorCategory('custom');
      setEditorHtml(html);
    } catch (err: any) {
      alert('AI template generation failed: ' + (err.message || err));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const insertVariable = (varName: string) => {
    setEditorHtml(prev => prev + ` {{${varName}}}`);
  };

  if (!isOpen) return null;

  const categories = ['all', 'business', 'invitation', 'newsletter', 'follow-up', 'custom'];
  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 text-indigo-400 p-2 rounded-xl border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                HTML Email Templates System
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
                  AI Generator & Editor
                </span>
              </h2>
              <p className="text-xs text-slate-400">Manage, design, and generate rich responsive HTML email templates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNew}
              className="hidden sm:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Template</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-900 px-6 pt-3 border-b border-slate-800/80 flex items-center gap-2 text-xs font-medium shrink-0">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2.5 rounded-t-xl border-b-2 font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'gallery'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Template Gallery ({templates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2.5 rounded-t-xl border-b-2 font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>HTML Editor & Live Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2.5 rounded-t-xl border-b-2 font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>✨ AI Template Generator</span>
          </button>
        </div>

        {/* TAB 1: GALLERY */}
        {activeTab === 'gallery' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar: Filter Categories & List */}
            <div className="w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-900/60 shrink-0 overflow-y-auto">
              <div className="p-3 border-b border-slate-800">
                <div className="flex flex-wrap gap-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 space-y-2 flex-1">
                {filteredTemplates.map(tpl => {
                  const isSelected = selectedTemplate?.id === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg'
                          : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-xs sm:text-sm text-white truncate max-w-[180px]">
                          {tpl.name}
                        </h4>
                        <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-md uppercase font-mono shrink-0">
                          {tpl.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {tpl.description}
                      </p>
                      
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                        <span>{tpl.isBuiltIn ? 'Built-in' : 'Custom'}</span>
                        <div className="flex items-center gap-1">
                          {!tpl.isBuiltIn && (
                            <button
                              onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                              className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/50"
                              title="Delete Template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Main Preview Area */}
            <div className="flex-1 bg-slate-950 p-6 flex flex-col overflow-y-auto">
              {selectedTemplate ? (
                <div className="h-full flex flex-col space-y-4">
                  <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {selectedTemplate.name}
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                          {selectedTemplate.category}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">{selectedTemplate.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditExisting(selectedTemplate)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        <Code className="w-3.5 h-3.5" /> Edit / Customize
                      </button>

                      {onSelectTemplateForCompose && (
                        <button
                          onClick={() => {
                            onSelectTemplateForCompose(selectedTemplate);
                            onClose();
                          }}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Use in Email
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rendered iframe preview */}
                  <div className="flex-1 min-h-[400px] bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative">
                    <iframe
                      title="Template Preview"
                      srcDoc={selectedTemplate.htmlContent
                        .replace(/\{\{\s*recipientName\s*\}\}/g, 'Sarah Jenkins')
                        .replace(/\{\{\s*subject\s*\}\}/g, selectedTemplate.name)
                        .replace(/\{\{\s*bodyContent\s*\}\}/g, 'Here is an example preview body paragraph generated for this HTML email template. It looks clean, structured, and fully responsive across email clients.')
                        .replace(/\{\{\s*ctaText\s*\}\}/g, 'Confirm & Proceed')
                        .replace(/\{\{\s*ctaLink\s*\}\}/g, '#')
                        .replace(/\{\{\s*senderName\s*\}\}/g, 'Alex Morgan')}
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
                  Select a template to view details and live preview
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EDITOR */}
        {activeTab === 'editor' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Column: Form Controls & HTML Code */}
            <div className="w-full md:w-1/2 p-5 border-r border-slate-800 bg-slate-900/80 flex flex-col space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={editorName}
                    onChange={e => setEditorName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Weekly Product Update"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                    Category
                  </label>
                  <select
                    value={editorCategory}
                    onChange={e => setEditorCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 capitalize"
                  >
                    <option value="business">Business</option>
                    <option value="invitation">Invitation</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editorDesc}
                  onChange={e => setEditorDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500"
                  placeholder="Short description of this design..."
                />
              </div>

              {/* Variable Quick Inserts */}
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  Insert Variables:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['recipientName', 'subject', 'bodyContent', 'ctaText', 'ctaLink', 'senderName'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-mono hover:bg-indigo-900 transition-colors"
                    >
                      +{`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Textarea */}
              <div className="flex-1 flex flex-col min-h-[220px]">
                <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                  HTML Source Code
                </label>
                <textarea
                  value={editorHtml}
                  onChange={e => setEditorHtml(e.target.value)}
                  className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs font-mono leading-relaxed focus:ring-1 focus:ring-indigo-500 resize-none"
                  spellCheck={false}
                />
              </div>

              {/* Save & Apply Bar */}
              <div className="flex items-center justify-between pt-2">
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Template Saved!
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleSaveTemplate}
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Template'}</span>
                  </button>

                  {onSelectTemplateForCompose && (
                    <button
                      onClick={() => {
                        onSelectTemplateForCompose({
                          id: selectedTemplate?.id || 'tpl-custom',
                          name: editorName || 'Custom Template',
                          description: editorDesc,
                          category: editorCategory,
                          subjectTemplate: editorSubject,
                          htmlContent: editorHtml
                        });
                        onClose();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Use in Compose</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Live Rendered Output */}
            <div className="w-full md:w-1/2 bg-slate-950 p-4 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" /> Live HTML Sandbox
                </span>
              </div>
              <div className="flex-1 bg-white rounded-xl overflow-hidden border border-slate-800 shadow-xl">
                <iframe
                  title="Editor Preview"
                  srcDoc={editorHtml
                    .replace(/\{\{\s*recipientName\s*\}\}/g, 'John Doe')
                    .replace(/\{\{\s*subject\s*\}\}/g, editorName || 'Sample Subject')
                    .replace(/\{\{\s*bodyContent\s*\}\}/g, 'This is a sample live preview of how your HTML email template will look inside the recipient inbox.')
                    .replace(/\{\{\s*ctaText\s*\}\}/g, 'Click Here')
                    .replace(/\{\{\s*ctaLink\s*\}\}/g, '#')
                    .replace(/\{\{\s*senderName\s*\}\}/g, 'Support Team')}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI GENERATOR */}
        {activeTab === 'ai' && (
          <div className="flex-1 p-6 bg-slate-950 overflow-y-auto space-y-6">
            <div className="max-w-2xl mx-auto bg-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Wand2 className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">✨ AI HTML Email Generator</h3>
                  <p className="text-xs text-slate-400">
                    Describe any email design style, layout, or color palette to generate custom responsive HTML code
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Describe Your Desired Email Template
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  rows={4}
                  placeholder="e.g., Create a modern dark-mode invoice template with gold highlights, itemized list table, total price breakdown, and pay invoice button..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Sample Quick Prompts */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block uppercase">Quick Inspiration Prompts:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Sleek modern startup launch announcement with gradient hero banner',
                    'Elegant webinar invitation card with speaker details and RSVP button',
                    'Vibrant summer discount campaign with promo code box and CTA button'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAiPrompt(preset)}
                      className="text-left text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg border border-slate-700 transition-colors"
                    >
                      "{preset}"
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateAiTemplate}
                disabled={isGeneratingAi || !aiPrompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingAi ? 'AI Generating HTML Template...' : 'Generate HTML Email Template'}</span>
              </button>
            </div>

            {/* AI Generated Result Preview */}
            {aiGeneratedHtml && (
              <div className="max-w-4xl mx-auto bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Generated HTML Template Preview
                  </span>

                  <button
                    onClick={() => setActiveTab('editor')}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition-all"
                  >
                    Open in HTML Editor
                  </button>
                </div>

                <div className="h-[380px] bg-white rounded-xl overflow-hidden border border-slate-800">
                  <iframe
                    title="AI Generated Preview"
                    srcDoc={aiGeneratedHtml
                      .replace(/\{\{\s*recipientName\s*\}\}/g, 'Valued Client')
                      .replace(/\{\{\s*subject\s*\}\}/g, 'Special Update')
                      .replace(/\{\{\s*bodyContent\s*\}\}/g, 'Here is your custom AI generated email content properly formatted in high quality responsive HTML.')
                      .replace(/\{\{\s*ctaText\s*\}\}/g, 'Take Action')
                      .replace(/\{\{\s*ctaLink\s*\}\}/g, '#')
                      .replace(/\{\{\s*senderName\s*\}\}/g, 'AI Assistant Team')}
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
