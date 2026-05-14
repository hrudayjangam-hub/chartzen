const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

// ─── Initialize Database (Load or Create) ───
function init() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = { users: [], sessions: [], tasks: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

const db = {
  // --- Generic Persistence ---
  save: (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)),

  // --- Users ---
  findUserByEmail: (email) => {
    const data = init();
    return data.users.find(u => u.email === email);
  },
  createUser: (user) => {
    const data = init();
    data.users.push(user);
    db.save(data);
    return user;
  },

  // --- Sessions ---
  findSessionsByUser: (userId) => {
    const data = init();
    return data.sessions.filter(s => s.userId === userId).sort((a,b) => b.createdAt - a.createdAt);
  },
  createSession: (session) => {
    const data = init();
    data.sessions.push(session);
    db.save(data);
    return session;
  },
  updateSession: (id, update) => {
    const data = init();
    const idx = data.sessions.findIndex(s => s.id === id);
    if (idx !== -1) {
      data.sessions[idx] = { ...data.sessions[idx], ...update };
      db.save(data);
    }
    return data.sessions[idx];
  },
  deleteSession: (id) => {
    const data = init();
    data.sessions = data.sessions.filter(s => s.id !== id);
    db.save(data);
  },

  // --- Tasks ---
  findTasksByUser: (userId) => {
    const data = init();
    return data.tasks.filter(t => t.userId === userId);
  },
  createTask: (task) => {
    const data = init();
    data.tasks.push(task);
    db.save(data);
    return task;
  },
  updateTask: (id, update) => {
    const data = init();
    const idx = data.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      data.tasks[idx] = { ...data.tasks[idx], ...update };
      db.save(data);
    }
    return data.tasks[idx];
  },
  deleteTask: (id) => {
    const data = init();
    data.tasks = data.tasks.filter(t => t.id !== id);
    db.save(data);
  }
};

module.exports = db;
