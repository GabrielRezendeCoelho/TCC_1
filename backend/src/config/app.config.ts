import { registerAs } from '@nestjs/config';

/**
 * Configurações gerais da aplicação carregadas do .env.
 */
export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
}));
