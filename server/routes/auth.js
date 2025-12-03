import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { query } from '../db/index.js';

const router = express.Router();
const SALT_ROUNDS = 10;

// Helper to convert PostgreSQL array format to JS array
const parseRoles = (pgRoles) => {
  if (!pgRoles) return [];
  if (Array.isArray(pgRoles)) return pgRoles;
  // Convert {ADMIN,DOT} format to ["ADMIN","DOT"]
  return pgRoles.replace(/[{}]/g, '').split(',').filter(r => r);
};

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await query(
      'SELECT id, email, fullname, roles, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    
    // Se tiver password_hash, validar
    if (user.password_hash) {
      if (!password) {
        return res.status(401).json({ error: 'Password is required' });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }
    // Se não tiver password_hash, permitir login sem password (modo demo/desenvolvimento)
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        name: user.fullname,
        roles: parseRoles(user.roles)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const result = await query(
      'SELECT id, email, fullname, roles FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      ...user,
      roles: parseRoles(user.roles)
    });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Forgot password - generate reset token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Verificar se o usuário existe
    const userResult = await query(
      'SELECT id, email, fullname FROM users WHERE email = $1',
      [email]
    );

    // Sempre retornar sucesso (segurança - não revelar se email existe)
    if (userResult.rows.length === 0) {
      return res.json({ message: 'If the email exists, a reset link will be sent' });
    }

    const user = userResult.rows[0];
    
    // Gerar token aleatório
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    // Criar tabela se não existir (migration inline para simplificar)
    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Invalidar tokens anteriores do usuário
    await query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [user.id]
    );

    // Inserir novo token
    await query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, resetToken, expiresAt]
    );

    // TODO: Enviar email com o link de reset
    // Por agora, apenas log no console (em produção usar nodemailer, SendGrid, etc)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 PASSWORD RESET REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User:', user.fullname);
    console.log('Email:', user.email);
    console.log('Reset Link:', resetLink);
    console.log('Expires:', expiresAt.toLocaleString('pt-PT'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.json({ 
      message: 'If the email exists, a reset link will be sent',
      // Em desenvolvimento, retornar o link (remover em produção)
      ...(process.env.NODE_ENV === 'development' && { resetLink })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Verify reset token
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const result = await query(
      `SELECT id, user_id, expires_at, used 
       FROM password_reset_tokens 
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const resetToken = result.rows[0];

    if (resetToken.used) {
      return res.status(400).json({ error: 'Token already used' });
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token expired' });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verificar token
    const tokenResult = await query(
      `SELECT id, user_id, expires_at, used 
       FROM password_reset_tokens 
       WHERE token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const resetToken = tokenResult.rows[0];

    if (resetToken.used) {
      return res.status(400).json({ error: 'Token already used' });
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token expired' });
    }

    // Hash da password usando bcrypt
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Atualizar password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, resetToken.user_id]
    );

    // Marcar token como usado
    await query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
      [resetToken.id]
    );

    console.log(`✅ Password reset successful for user ID: ${resetToken.user_id}`);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
