import Redis from 'ioredis';

import { REDIS_CONNECTION } from '$env/static/private';

export default REDIS_CONNECTION ? new Redis(REDIS_CONNECTION) : new Redis();
