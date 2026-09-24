import { Router, Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service.js';
import {
  requestPasswordReset,
  resetPassword,
  PasswordResetError,
  MIN_PASSWORD_LENGTH,
} from '../services/password-reset.service.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Preencha nome, email e senha.' });
    }
    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ error: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` });
    }

    const result = await registerUser({ email, password, name });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Informe email e senha.' });
    }

    const result = await loginUser({ email, password });
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  const email = typeof req.body.email === 'string' ? req.body.email : '';
  if (!email.trim()) {
    return res.status(400).json({ error: 'Informe seu email.' });
  }
  try {
    await requestPasswordReset(email);
  } catch (error) {
    console.error('Password reset request failed:', error);
  }
  // Same response whether or not the email exists, so this can't be used to discover accounts.
  res.json({
    message: 'Se este email estiver cadastrado, você vai receber um link para criar uma nova senha.',
  });
});

router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (typeof token !== 'string' || typeof password !== 'string' || !token) {
    return res.status(400).json({ error: 'Link inválido.' });
  }
  try {
    await resetPassword(token, password);
    res.json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    if (error instanceof PasswordResetError) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Password reset failed:', error);
    res.status(500).json({ error: 'Não foi possível alterar a senha. Tente novamente.' });
  }
});

export default router;
