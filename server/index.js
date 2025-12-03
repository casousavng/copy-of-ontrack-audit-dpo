import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import storesRoutes from './routes/stores.js';
import auditsRoutes from './routes/audits.js';
import visitsRoutes from './routes/visits.js';
import actionsRoutes from './routes/actions.js';
import scoresRoutes from './routes/scores.js';
import commentsRoutes from './routes/comments.js';
import checklistsRoutes from './routes/checklists.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/audits', auditsRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/checklists', checklistsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
