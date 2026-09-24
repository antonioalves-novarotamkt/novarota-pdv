import nodemailer from 'nodemailer';
import { ENV } from './env.js';

const isConfigured = Boolean(ENV.EMAIL_SERVER_HOST && ENV.EMAIL_FROM);

const transport = isConfigured
  ? nodemailer.createTransport({
      host: ENV.EMAIL_SERVER_HOST,
      port: ENV.EMAIL_SERVER_PORT,
      secure: ENV.EMAIL_SERVER_PORT === 465,
      auth: { user: ENV.EMAIL_SERVER_USER, pass: ENV.EMAIL_SERVER_PASSWORD },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    })
  : null;

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  if (!transport) {
    if (ENV.NODE_ENV === 'production') {
      console.warn('Password reset requested but email is not configured (EMAIL_SERVER_HOST / EMAIL_FROM).');
    } else {
      console.log(`[dev] Email not configured. Password reset link for ${to}: ${resetUrl}`);
    }
    return;
  }

  await transport.sendMail({
    from: ENV.EMAIL_FROM,
    to,
    subject: 'Redefinição de senha — Cardápio NovaRota',
    text: `Olá, ${name}!\n\nPara criar uma nova senha, acesse: ${resetUrl}\n\nO link expira em 1 hora. Se você não pediu isso, ignore este email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Redefinir sua senha</h2>
        <p style="color: #475569;">Olá, ${escapeHtml(name)}! Recebemos um pedido para redefinir a senha da sua conta no Cardápio NovaRota.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #ea580c; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Criar nova senha
          </a>
        </p>
        <p style="color: #94a3b8; font-size: 13px;">O link expira em 1 hora e só pode ser usado uma vez. Se você não pediu isso, pode ignorar este email.</p>
      </div>
    `,
  });
}
