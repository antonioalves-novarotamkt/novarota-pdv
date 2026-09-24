export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value || defaultValue!;
}

export const ENV = {
  DATABASE_URL: getEnv('DATABASE_URL'),
  JWT_SECRET: getEnv('JWT_SECRET'),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: parseInt(getEnv('PORT', '3000'), 10),
  CORS_ORIGIN: getEnv('CORS_ORIGIN', 'http://localhost:5173'),
  // Public URL of the frontend, used in links sent by email. Falls back to the first CORS origin.
  APP_URL: getEnv('APP_URL', '') || getEnv('CORS_ORIGIN', 'http://localhost:5173').split(',')[0].trim(),
  EMAIL_SERVER_HOST: getEnv('EMAIL_SERVER_HOST', ''),
  EMAIL_SERVER_PORT: parseInt(getEnv('EMAIL_SERVER_PORT', '465'), 10),
  EMAIL_SERVER_USER: getEnv('EMAIL_SERVER_USER', ''),
  EMAIL_SERVER_PASSWORD: getEnv('EMAIL_SERVER_PASSWORD', ''),
  EMAIL_FROM: getEnv('EMAIL_FROM', ''),
};
