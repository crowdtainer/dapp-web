import Redis from 'ioredis';

const connectionString = process.env['REDIS_CONNECTION'];

export default connectionString ? new Redis(connectionString) : new Redis();