import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import { motion } from 'motion/react';
import { PageIntroHeader } from '../components/MotionPrimitives';
import { SuSAretFullIntro } from '../components/SuSAretFullIntro';
import { SuSOrb } from '../components/SuSOobeAssistant';
import type { PageRoute, SuSChatMessage } from '../types/olympiad';

interface SuSPageProps {
  onNavigate: (page: PageRoute) => void;
}

const STARTER_PROMPTS = [
  'What are the 2026 exam dates and registration closing deadlines for all Olympiads?',
  'Explain IXMO marking scheme and where negative marking applies.',
  'How does the ₹100 / ₹500 bundle pricing work for Question Banks and 8-Year PYPs?',
  'When will Admit Cards and Sample Papers be available?',
  'Tell me about ARET launching in September 2026 starting at ₹1,299.',
];

const INITIAL_ASSISTANT_MESSAGE: SuSChatMessage = {
  id: 'sus-welcome',
  role: 'assistant',
  content:
    'Welcome to SuS — Systematic User Help-Service for the X Olympiad Foundation. Ask me about 2026 Olympiad dates, eligibility, syllabus & negative marking rules, ₹100/₹500 shop bundles, Admit Card updates, or the September 2026 ARET launch.',
  timestamp: 'Online',
};

export function SuSPage({ onNavigate }: SuSPageProps) {
  const [messages, setMessages] = useState<SuSChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    setErrorMsg(null);
    const userMsg: SuSChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const historyForApi = messages
      .filter((m) => m.id !== 'sus-welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/sus/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Unable to get a response from SuS right now.');
      }

      const botMsg: SuSChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to connect to SuS Help-Service.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <section className="bg-[#06080D] py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-[#00F0FF] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to Home</span>
        </button>

        <PageIntroHeader
          kicker="Systematic User Help-Service"
          title="SuS Help-Service"
          subtitle="Interactive support for Olympiad schedules, syllabus coverage, marking rules, Question Bank bundles, Admit Card updates, and the September 2026 ARET engine."
          rightSlot={
            <button
              type="button"
              onClick={() => onNavigate('aret')}
              className="inline-flex items-center gap-2 rounded-lg border border-[#B8FF00]/45 bg-[#B8FF00]/10 px-4 py-2.5 text-xs font-semibold text-[#B8FF00] hover:bg-[#B8FF00] hover:text-[#05080F] transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Preview ARET (Sept 2026)</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          }
        />

        {/* Full Interactive SuS & ARET Flying Intro */}
        <div className="mt-6">
          <SuSAretFullIntro focus="sus" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Quick Topics & Capabilities */}
          <aside className="lg:col-span-4 space-y-5">
            <div className="rounded-xl border border-white/10 bg-[#0D111A] p-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#00F0FF]">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                <span>Suggested Queries</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Select any topic below to ask SuS immediately:
              </p>

              <div className="mt-4 space-y-2">
                {STARTER_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void sendMessage(q)}
                    className="w-full rounded-lg border border-white/10 bg-[#121723] px-3.5 py-2.5 text-left text-xs leading-relaxed text-slate-200 hover:border-[#00F0FF]/55 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0D111A] p-6 text-xs text-slate-300 space-y-2.5">
              <h2 className="font-display text-sm font-semibold text-white">
                Direct Foundation Escalation
              </h2>
              <p className="leading-relaxed">
                For order modifications or registration ID corrections, submitted forms are answered by our Ghaziabad coordinator team within 24 working hours.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('registration')}
                  className="rounded-md border border-white/15 px-3 py-1.5 font-semibold text-[#00F0FF] hover:border-[#00F0FF] cursor-pointer"
                >
                  Open Registration
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('news')}
                  className="rounded-md border border-white/15 px-3 py-1.5 font-semibold text-slate-200 hover:border-[#00F0FF] cursor-pointer"
                >
                  Lookup Saved Records
                </button>
              </div>
            </div>
          </aside>

          {/* Right Multi-Turn Chat Console */}
          <div className="lg:col-span-8 flex flex-col rounded-xl border border-white/10 bg-[#0D111A] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#101622] px-6 py-4">
              <div className="flex items-center gap-3">
                <SuSOrb mood={isLoading ? 'tip' : 'welcome'} size={36} />
                <div>
                  <h2 className="font-display text-sm font-semibold text-white">
                    SuS · Systematic User Help-Service
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Official X Olympiad Foundation Assistant
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMessages([INITIAL_ASSISTANT_MESSAGE]);
                  setErrorMsg(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-[#00F0FF] hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Chat</span>
              </button>
            </div>

            <div
              ref={scrollRef}
              aria-live="polite"
              className="h-[420px] overflow-y-auto px-6 py-5 space-y-4 bg-[#080B12]"
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#00F0FF]/40 bg-[#00F0FF]/10 text-[#00F0FF]">
                        <Bot className="h-4 w-4" aria-hidden="true" />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] rounded-xl border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'border-[#00F0FF]/50 bg-[#00F0FF]/12 text-white'
                          : 'border-white/10 bg-[#0D111A] text-slate-200'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-4 text-[10px] font-mono text-slate-400">
                        <span>{isUser ? 'You' : 'SuS Help-Service'}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p>{msg.content}</p>
                    </div>

                    {isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-[#121723] text-slate-200">
                        <User className="h-4 w-4" aria-hidden="true" />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#00F0FF]/40 bg-[#00F0FF]/10 text-[#00F0FF]">
                    <Bot className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0D111A] px-4 py-3 text-xs font-mono text-[#00F0FF]">
                    SuS is analyzing your Foundation query...
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="border-t border-rose-500/30 bg-rose-950/40 px-6 py-2.5 text-xs text-rose-200"
              >
                {errorMsg}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="border-t border-white/10 bg-[#0D111A] p-4 flex items-center gap-3"
            >
              <label htmlFor="sus-chat-input" className="sr-only">
                Ask SuS a question
              </label>
              <input
                id="sus-chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about exam dates, negative marking, bundles, admit cards, or ARET..."
                className="flex-1 rounded-lg border border-white/15 bg-[#06080D] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF]"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="neon-cta inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Ask SuS</span>
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
