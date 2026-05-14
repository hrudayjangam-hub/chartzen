const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');
const path = require('path');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'chartgen_secret_key_2026';

app.use(express.json());
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..')));

// ─── Config endpoint (provides API key to frontend) ───
app.get('/api/config', (req, res) => {
  res.json({
    openrouterKey: process.env.OPENROUTER_API_KEY || ''
  });
});

// --- Authentication Middleware ---
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- AUTH API ---
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (db.findUserByEmail(email)) return res.status(400).json({ error: 'User already exists' });
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = db.createUser({ id: Date.now().toString(), name, email, password: hashedPassword, createdAt: Date.now() });
  const token = jwt.sign({ id: user.id }, SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.findUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id }, SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// --- SESSIONS API ---
app.get('/api/sessions', authenticate, (req, res) => {
  res.json(db.findSessionsByUser(req.user.id));
});

app.post('/api/sessions', authenticate, (req, res) => {
  const session = db.createSession({ ...req.body, id: Date.now().toString(), userId: req.user.id, createdAt: Date.now() });
  res.json(session);
});

app.patch('/api/sessions/:id', authenticate, (req, res) => {
  res.json(db.updateSession(req.params.id, req.body));
});

app.delete('/api/sessions/:id', authenticate, (req, res) => {
  db.deleteSession(req.params.id);
  res.json({ success: true });
});

// --- TASKS API ---
app.get('/api/tasks', authenticate, (req, res) => {
  res.json(db.findTasksByUser(req.user.id));
});

app.post('/api/tasks', authenticate, (req, res) => {
  const task = db.createTask({ ...req.body, id: Date.now().toString(), userId: req.user.id, createdAt: Date.now() });
  res.json(task);
});

app.patch('/api/tasks/:id', authenticate, (req, res) => {
  res.json(db.updateTask(req.params.id, req.body));
});

app.delete('/api/tasks/:id', authenticate, (req, res) => {
  db.deleteTask(req.params.id);
  res.json({ success: true });
});

// --- AI PROXY API (OpenRouter) ---
app.post('/api/ai/chat', authenticate, async (req, res) => {
  const { prompt, history, apiKey, model } = req.body;
  try {
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    const messages = [{ role: 'system', content: 'You are ChartGen Smart AI Assistant.' }];
    if (history) history.forEach(m => messages.push({ role: m.role, content: m.content }));
    if (prompt) messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-4o',
        messages,
        max_tokens: 2048,
        temperature: 0.8
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Phase 5: Real-time Collaboration (Socket.io) ---
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  socket.on('join-workspace', (workspaceId) => {
    socket.join(workspaceId);
    console.log(`👤 User joined workspace: ${workspaceId}`);
  });

  socket.on('task-update', (data) => {
    // Broadcast to others in the same workspace
    socket.to(data.workspaceId).emit('task-remote-update', data);
  });

  socket.on('chat-message', (data) => {
    socket.to(data.workspaceId).emit('chat-remote-message', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.workspaceId).emit('user-typing', data);
  });

  socket.on('disconnect', () => {
    console.log('🔥 User disconnected:', socket.id);
  });
});

// ─── SPA fallback: serve index.html for unknown routes ───
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

server.listen(PORT, () => console.log(`🚀 ChartGen Backend + Realtime running on port ${PORT}`));
