import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // TTS Proxy Route: High-fidelity natural Korean audio for Hangul learning
  app.get('/api/tts', async (req, res) => {
    try {
      const text = String(req.query.text || '').trim();
      if (!text) {
        return res.status(400).send('Text query param is required');
      }

      // Fetch pristine human Korean pronunciation
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encodeURIComponent(text)}`;
      const response = await fetch(ttsUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        return res.status(response.status).send('TTS upstream response failed');
      }

      const arrayBuffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable'); // Cache audio for 7 days
      res.send(Buffer.from(arrayBuffer));
    } catch (err) {
      console.error('TTS endpoint error:', err);
      res.status(500).send('Internal Server Error in TTS proxy');
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hangul Applet server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
