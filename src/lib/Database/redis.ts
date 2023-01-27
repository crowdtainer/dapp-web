import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import Redis from 'ioredis';

let db: Redis;
let logShown: boolean;

export function getDatabase(): Redis | undefined {
    if (!logShown) {
        console.log(`getDatabase: Redis @ '${env.REDIS_CONNECTION_STRING ? env.REDIS_CONNECTION_STRING : `127.0.0.1:6379`}'`);
        logShown = true;
    }
    if (!building) {
        if (db === undefined) {
            db = env.REDIS_CONNECTION_STRING ? new Redis(`${env.REDIS_CONNECTION_STRING}`) : new Redis();
        }
    }
    return db;
}