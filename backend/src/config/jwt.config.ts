import { registerAs } from '@nestjs/config';

/**
 * Configurações JWT carregadas do .env.
 */
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default-dev-secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
}));
