import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSystemPrompt,
  compactState,
  getCanonicalBeat,
  mergeGeneratedBeat,
} from './storyEngine.js';

const app = express();
const port = Number(process.env.PORT || 8787);
const model = process.env.FIREWORKS_MODEL || 'accounts/fireworks/models/deepseek-v4-flash';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

app.use(cors());
app.use(express.json({ limit: '80kb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    provider: 'fireworks',
    mode: hasFireworksKey() ? 'fireworks' : 'offline',
    model,
  });
});

app.post('/api/story', async (req, res) => {
  const action = typeof req.body?.action === 'string' ? req.body.action.slice(0, 80) : '';
  const state = compactState(req.body?.state ?? {});
  const canonical = getCanonicalBeat(action, state);

  prepareSse(res);

  try {
    if (!hasFireworksKey()) {
      await streamFallback(res, canonical);
      return;
    }

    await streamFireworks(res, action, state, canonical);
  } catch (error) {
    console.error('[story] Fireworks request failed:', error);
    sendEvent(res, 'warning', {
      message: 'Fireworks was unavailable, so the local story director took over this beat.',
    });
    await streamFallback(res, canonical);
  }
});

const distDir = path.join(rootDir, 'dist');
app.use(express.static(distDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distDir, 'index.html'), (error) => {
    if (error) next();
  });
});

app.listen(port, () => {
  console.log(`Lumenwake server listening on http://localhost:${port}`);
  console.log(`Story mode: ${hasFireworksKey() ? `Fireworks live (${model})` : 'offline fallback'}`);
});

function hasFireworksKey() {
  return Boolean(
    process.env.FIREWORKS_API_KEY &&
      process.env.FIREWORKS_API_KEY !== 'your_key_here' &&
      process.env.FIREWORKS_OFFLINE !== 'true',
  );
}

function prepareSse(res) {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
}

function sendEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function streamFallback(res, canonical) {
  sendEvent(res, 'meta', { mode: 'offline' });
  const words = canonical.narration.split(/(\s+)/);
  for (const word of words) {
    sendEvent(res, 'token', { text: word });
    await sleep(12);
  }
  const beat = mergeGeneratedBeat(canonical, {});
  sendEvent(res, 'story', beat);
  sendEvent(res, 'done', { ok: true });
  res.end();
}

async function streamFireworks(res, action, state, canonical) {
  sendEvent(res, 'meta', { mode: 'fireworks', model });

  const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.FIREWORKS_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.82,
      max_tokens: 520,
      messages: [
        { role: 'system', content: buildSystemPrompt(canonical) },
        {
          role: 'user',
          content: JSON.stringify({ action, playerState: state }),
        },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text();
    throw new Error(`Fireworks ${response.status}: ${detail.slice(0, 300)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let networkBuffer = '';
  let fullText = '';
  let emittedStoryLength = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    networkBuffer += decoder.decode(value, { stream: true });

    const lines = networkBuffer.split('\n');
    networkBuffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      let json;
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }

      const token = json?.choices?.[0]?.delta?.content;
      if (typeof token !== 'string' || !token) continue;
      fullText += token;

      const streamed = extractPartialStory(fullText);
      if (streamed.length > emittedStoryLength) {
        sendEvent(res, 'token', { text: streamed.slice(emittedStoryLength) });
        emittedStoryLength = streamed.length;
      }
    }
  }

  const generated = parseProtocol(fullText);
  const beat = mergeGeneratedBeat(canonical, generated);
  sendEvent(res, 'story', beat);
  sendEvent(res, 'done', { ok: true });
  res.end();
}

function extractPartialStory(text) {
  const startTag = '<story>';
  const start = text.indexOf(startTag);
  if (start === -1) return '';
  const bodyStart = start + startTag.length;
  const end = text.indexOf('</story>', bodyStart);
  return text.slice(bodyStart, end === -1 ? undefined : end);
}

function parseProtocol(text) {
  const story = text.match(/<story>([\s\S]*?)<\/story>/i)?.[1]?.trim();
  const rawState = text.match(/<state>([\s\S]*?)<\/state>/i)?.[1]?.trim();
  let state = {};
  if (rawState) {
    try {
      state = JSON.parse(rawState);
    } catch {
      state = {};
    }
  }
  return { ...state, narration: story };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
