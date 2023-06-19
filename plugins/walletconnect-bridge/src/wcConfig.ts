const env = process.env.NODE_ENV || 'development'
const debug: boolean = env !== 'production'
const port = Number(process.env.PORT) || (env === 'production' ? 5000 : 5001)
const host = process.env.HOST || `::`

const redis = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  prefix: process.env.REDIS_PREFIX || 'walletconnect-bridge'
}

export type WCConfig = {
  env: typeof env,
  debug: boolean,
  port: number,
  host: string,
  redis: { url: string, prefix: string }
};

export const wcConfig: WCConfig = {
  env: env,
  debug: debug,
  port,
  host,
  redis
}
