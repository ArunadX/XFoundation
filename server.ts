import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  findRecordsByEmail,
  getRecordsSummary,
  saveAretSession,
  saveInquiry,
  saveOrder,
  saveRegistration,
} from './src/server/recordsStore.ts';
import {
  buildFallbackAretAnalysis,
  buildFallbackAretQuestions,
  buildSuSFallbackReply,
} from './src/utils/olympiadLogic.ts';
import type {
  AretDifficulty,
  AretEvaluationResult,
  AretGeneratedQuestion,
  AretQuestionStyle,
  AretTopic,
  LeadInquiryRecord,
  OrderRecord,
  RegistrationRecord,
} from './src/types/olympiad.ts';

const PORT = 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const SUS_SYSTEM_INSTRUCTION = `You are SuS (Systematic User Help-Service), the official academic and admissions help assistant for the X Olympiad Foundation (established 2018 in Ghaziabad, Uttar Pradesh, India).

Keep answers clear, concise, accurate, and directly grounded in these verified Foundation facts:
- Tracks & Exam Dates (2026 Cycle):
  * IXMO (International X Mathematics Olympiad): Classes 5-12, Fee ₹250, Registration closes 27 Nov 2026, Exam 20 Dec 2026. 50 questions / 100 marks (1 Hr 20 Min). Sections: Logic (10q × 1m, -1 negative), Mathematics (20q × 1.5m, -1 negative), Advanced Mathematics (10q × 2m, no negative), HOTS (10q × 4m, no negative).
  * IXSO (International X Science Olympiad): Classes 5-12, Fee ₹250, Registration closes 26 Nov 2026, Exam 19 Dec 2026. 50 questions / 100 marks. Negative marking (-1) strictly in Science section (20q × 1m).
  * IXEO (International X English Olympiad): Classes 5-12, Fee ₹200, Registration closes 26 Nov 2026, Exam 30 Nov 2026. Topic syllabus pending announcement; negative marking in Vocabulary Comprehension & Reading.
  * IXCO (International X Cyber Olympiad): Classes 5-12, Fee ₹250, Registration closes 27 Nov 2026, Exam 02 Dec 2026. Topic syllabus pending announcement; -1 negative marking in Software & OS Knowledge.
  * IXCompetO (International X Competitive Olympiad): Strictly Grades 10 to 12 only, Fee ₹300, Registration closes 05 Dec 2026, Exam 27 Dec 2026.
- Admit Cards & Sample Papers:
  * Admit cards are currently unavailable and will be announced soon (opening from the 10 Nov schedule window).
  * Official sample papers across tracks will be shared soon (candidates can try previews on the Home page right now).
- Study Material Shop (All prices in INR ₹):
  * Chapter-wise Question Banks (without preview): ₹100 for 1 bank, ₹100 for a bundle of 2 banks, ₹500 for a bundle of 10 banks.
  * IXEO and IXCO Question Banks are currently unavailable.
  * Last 8 Years Previous Year Paper (PYP) Bundles: ₹499 for 1 bundle, ₹500 for any 2 bundles.
  * Promo codes at Checkout: FREEMATERIAL (100% free on all Question Banks & PYP Bundles), OLYMPIAD15 (15% off), SCHOLAR10 (10% off), XOF10 (10% off).
  * Registration Coupon Code: FREEXOLYMPIAD (100% free registration fee waiver).
  * Submitted registrations and shop orders receive an email response within 24 working hours.
- ARET (Automated Responsive Educational Tool):
  * Entirely new launch scheduled for September 2026, starting at ₹1,299.
  * Available in two modes: a 1-Try Preview on the ARET page, plus the multi-page Full ARET Suite (supporting 20 to 30 questions per generation, full multi-year IXMO PYP simulators, and deep analytics) unlocked exclusively with access code ARETCODESAMPLE.

If asked something outside X Olympiad Foundation scope, gently steer back or answer clearly without inventing unverified exam dates or fees. Avoid markdown headings/tables clutter; use crisp short paragraphs or plain bullet points.`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Database records endpoints
  app.get('/api/records', async (req, res) => {
    try {
      const email = typeof req.query.email === 'string' ? req.query.email : '';
      if (email.trim()) {
        const matched = await findRecordsByEmail(email);
        return res.json(matched);
      }
      const summary = await getRecordsSummary();
      return res.json(summary);
    } catch (error) {
      console.error('Failed to read records:', error);
      return res.status(500).json({ error: 'Unable to retrieve records right now.' });
    }
  });

  app.post('/api/registrations', async (req, res) => {
    try {
      const body = req.body as Partial<RegistrationRecord>;
      if (!body || !body.registrationId || !body.email || !body.name) {
        return res.status(400).json({ error: 'Missing required registration fields.' });
      }
      const saved = await saveRegistration(body as RegistrationRecord);
      return res.status(201).json({ ok: true, record: saved });
    } catch (error) {
      console.error('Failed to save registration:', error);
      return res.status(500).json({ error: 'Unable to store registration right now.' });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const body = req.body as Partial<OrderRecord>;
      if (!body || !body.orderId || !body.email || !body.name || !Array.isArray(body.items)) {
        return res.status(400).json({ error: 'Missing required order fields.' });
      }
      const saved = await saveOrder(body as OrderRecord);
      return res.status(201).json({ ok: true, order: saved });
    } catch (error) {
      console.error('Failed to save order:', error);
      return res.status(500).json({ error: 'Unable to store order right now.' });
    }
  });

  app.post('/api/inquiries', async (req, res) => {
    try {
      const body = req.body as Partial<LeadInquiryRecord>;
      if (!body || !body.email || !body.name) {
        return res.status(400).json({ error: 'Name and valid email are required.' });
      }
      const record: LeadInquiryRecord = {
        inquiryId: body.inquiryId || `INQ-2026-${1000 + (Date.now() % 9000)}`,
        createdAt:
          body.createdAt ||
          new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        name: String(body.name).trim(),
        email: String(body.email).trim(),
        city: String(body.city || 'Not specified').trim(),
        interest: String(body.interest || 'General Foundation Inquiry').trim(),
        notes: String(body.notes || '').trim(),
      };
      const saved = await saveInquiry(record);
      return res.status(201).json({ ok: true, inquiry: saved });
    } catch (error) {
      console.error('Failed to save inquiry:', error);
      return res.status(500).json({ error: 'Unable to store inquiry right now.' });
    }
  });


  // SuS (Systematic User Help-Service) Gemini Chat Endpoint
  app.post('/api/sus/chat', async (req, res) => {
    const { message, history } = req.body as {
      message?: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Please enter a question for SuS.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ reply: buildSuSFallbackReply(message), source: 'foundation-kb' });
    }

    const formattedHistory = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.content === 'string' &&
              m.content.trim().length > 0
          )
          .slice(-12)
          .map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }))
      : [];

    const candidateModels = [
      { model: 'gemini-4-hydrogen', timeoutMs: 12000 },
      { model: 'gemini-3.1-flash-lite', timeoutMs: 10000 },
    ] as const;
    for (const { model: modelName, timeoutMs } of candidateModels) {
      try {
        const chat = ai.chats.create({
          model: modelName,
          history: formattedHistory,
          config: {
            systemInstruction: SUS_SYSTEM_INSTRUCTION,
            ...(modelName === 'gemini-4-hydrogen'
              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
              : {}),
          },
        });

        const response = await withTimeout(
          chat.sendMessage({ message: message.trim() }),
          timeoutMs,
          `SuS ${modelName}`
        );
        const reply = (response.text ?? '').trim();
        if (reply) {
          return res.json({ reply, source: modelName });
        }
      } catch {
        // Quietly fail over to next model or Foundation KB without emitting error noise
      }
    }

    return res.json({
      reply: buildSuSFallbackReply(message),
      source: 'foundation-kb',
    });
  });

  // ARET (Automated Responsive Educational Tool) — SuS Custom Question Generator
  app.post('/api/aret/generate', async (req, res) => {
    const {
      topic = 'Mixed IXMO',
      difficulty = 'Olympiad Standard',
      style = 'Single-Choice MCQ',
      count = 3,
      weakTopics = [],
      email = '',
      evaluation,
    } = req.body as {
      topic?: AretTopic;
      difficulty?: AretDifficulty;
      style?: AretQuestionStyle;
      count?: number;
      weakTopics?: string[];
      email?: string;
      evaluation?: AretEvaluationResult;
    };

    const safeCount = Math.min(30, Math.max(2, Number(count) || 3));

    if (evaluation) {
      await saveAretSession({
        sessionId: `ARET-${Date.now()}`,
        createdAt: new Date().toISOString(),
        email: String(email || '').trim(),
        evaluation,
        customTopic: topic,
        customDifficulty: difficulty,
        customStyle: style,
      }).catch(() => {
        // Non-blocking persistence
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        questions: buildFallbackAretQuestions({
          topic,
          difficulty,
          style,
          count: safeCount,
          weakTopics,
        }),
        source: 'deterministic',
      });
    }

    const prompt = `Generate exactly ${safeCount} original IXMO (International X Mathematics Olympiad, Grades 5-12) practice questions calibrated for ARET (Automated Responsive Educational Tool).
Candidate Configuration:
- Topic Focus: ${topic}
- Difficulty Tier: ${difficulty}
- Question Style: ${style}
- Weak Topics Detected from IXMO PYP: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'Balanced across all topics'}

Rules:
- Generate ALL ${safeCount} distinct questions cleanly without duplicating prompts.
- Each question must be mathematically rigorous, unambiguous, and solvable without external figures.
- Provide exactly 4 options per question and a 0-based correctIndex (0, 1, 2, or 3).
- If Question Style is "Statement I & II Logic", populate statements with two numbered mathematical statements ["I. ...", "II. ..."] and ask which statements hold.
- Keep prompt, options, and explanation concise and clear in plain text (Unicode symbols like ^, sqrt, π, ∠ are fine).`;

    const generateModels =
      safeCount >= 15
        ? ([
            { model: 'gemini-3.1-flash-lite', timeoutMs: 22000 },
            { model: 'gemini-4-hydrogen', timeoutMs: 25000 },
          ] as const)
        : ([
            { model: 'gemini-4-hydrogen', timeoutMs: 14000 },
            { model: 'gemini-3.1-flash-lite', timeoutMs: 12000 },
          ] as const);

    for (const { model: modelName, timeoutMs } of generateModels) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              ...(modelName === 'gemini-4-hydrogen'
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {}),
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    statements: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    adaptiveReason: { type: Type.STRING },
                  },
                  required: [
                    'topic',
                    'prompt',
                    'options',
                    'correctIndex',
                    'explanation',
                    'adaptiveReason',
                  ],
                },
              },
            },
          }),
          timeoutMs,
          `ARET generate ${modelName}`
        );

        const raw = (response.text ?? '[]').trim();
        const parsed = JSON.parse(raw) as Array<Partial<AretGeneratedQuestion>>;
        if (!Array.isArray(parsed) || parsed.length === 0) {
          continue;
        }

        const normalized: AretGeneratedQuestion[] = parsed
          .slice(0, safeCount)
          .map((q, idx) => ({
            id: `sus-ai-${Date.now()}-${idx + 1}`,
            topic: q.topic || topic,
            difficulty,
            style,
            prompt: q.prompt || 'Solve the IXMO challenge below.',
            statements:
              Array.isArray(q.statements) && q.statements.length > 0
                ? q.statements
                : undefined,
            options:
              Array.isArray(q.options) && q.options.length === 4
                ? q.options
                : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctIndex:
              typeof q.correctIndex === 'number' &&
              q.correctIndex >= 0 &&
              q.correctIndex <= 3
                ? q.correctIndex
                : 0,
            explanation: q.explanation || 'Verify step-by-step algebraic bounds.',
            adaptiveReason:
              q.adaptiveReason || `Generated by SuS for ${topic} (${difficulty}).`,
          }));

        if (normalized.length < safeCount) {
          const pad = buildFallbackAretQuestions({
            topic,
            difficulty,
            style,
            count: safeCount,
            weakTopics,
          });
          for (const extra of pad) {
            if (normalized.length >= safeCount) break;
            if (!normalized.some((x) => x.prompt === extra.prompt)) {
              normalized.push({
                ...extra,
                id: `sus-ai-${Date.now()}-${normalized.length + 1}`,
              });
            }
          }
        }

        return res.json({ questions: normalized, source: 'gemini' });
      } catch {
        // Quiet failover to secondary model or deterministic question bank
      }
    }

    return res.json({
      questions: buildFallbackAretQuestions({
        topic,
        difficulty,
        style,
        count: safeCount,
        weakTopics,
      }),
      source: 'deterministic',
    });
  });

  // ARET In-Depth Performance Analysis via SuS
  app.post('/api/aret/analyze', async (req, res) => {
    const { evaluation, customAccuracyPct, customTopic, customDifficulty } = req.body as {
      evaluation?: AretEvaluationResult;
      customAccuracyPct?: number;
      customTopic?: string;
      customDifficulty?: string;
    };

    if (!evaluation) {
      return res.status(400).json({ error: 'Evaluation summary is required.' });
    }

    const fallbackResponse = buildFallbackAretAnalysis({
      evaluation,
      customAccuracyPct,
      customTopic,
      customDifficulty,
    });

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(fallbackResponse);
    }

    const prompt = `Provide an in-depth ARET (Automated Responsive Educational Tool) diagnostic analysis for an IXMO Olympiad candidate.
Metrics:
- IXMO PYP Net Score: ${evaluation.netScore} / ${evaluation.maxScore} (${evaluation.accuracyPct}% accuracy)
- Negative Marking Penalty Lost: -${evaluation.negativePenalty} marks (Risk Index: ${evaluation.riskIndex})
- Weak Topics: ${evaluation.weakTopics.join(', ') || 'None'}
- Topic Breakdown: ${JSON.stringify(evaluation.topicBreakdown)}
- SuS Custom Drill (${customTopic || 'Mixed'}, ${customDifficulty || 'Standard'}): ${typeof customAccuracyPct === 'number' ? `${customAccuracyPct}%` : 'Not attempted yet'}

Return JSON with:
- readinessBadge: short 2-4 word academic tier label
- aiNarrative: crisp 2-3 sentence diagnostic interpretation mentioning specific weak topics and scoring behavior
- studyPlan: array of exactly 3 actionable next-step recommendations`;

    const analyzeModels = [
      { model: 'gemini-4-hydrogen', timeoutMs: 15000 },
      { model: 'gemini-3.1-flash-lite', timeoutMs: 10000 },
    ] as const;

    for (const { model: modelName, timeoutMs } of analyzeModels) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              ...(modelName === 'gemini-4-hydrogen'
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {}),
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  readinessBadge: { type: Type.STRING },
                  aiNarrative: { type: Type.STRING },
                  studyPlan: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['readinessBadge', 'aiNarrative', 'studyPlan'],
              },
            },
          }),
          timeoutMs,
          `ARET analyze ${modelName}`
        );

        const parsed = JSON.parse((response.text ?? '{}').trim()) as {
          readinessBadge?: string;
          aiNarrative?: string;
          studyPlan?: string[];
        };

        return res.json({
          readinessBadge: parsed.readinessBadge || fallbackResponse.readinessBadge,
          aiNarrative: parsed.aiNarrative || fallbackResponse.aiNarrative,
          studyPlan:
            Array.isArray(parsed.studyPlan) && parsed.studyPlan.length > 0
              ? parsed.studyPlan.slice(0, 4)
              : fallbackResponse.studyPlan,
          source: 'gemini' as const,
        });
      } catch {
        // Quiet failover
      }
    }

    return res.json(fallbackResponse);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`X Olympiad Foundation server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
