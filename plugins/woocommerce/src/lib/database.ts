import Redis from 'ioredis';
import { type Option, Some, None } from "@sniptt/monads";

let db: Redis;
let logShown: boolean;

export type PreConditionsNotMetError = { details: string };

export function dbPreconditiosFail(): Option<PreConditionsNotMetError> {
    if (process.env.REDIS_CONNECTION_STRING === undefined) {
        return Some({ details: "Missing 'REDIS_CONNECTION_STRING' environment variable." });
    }
    return None;
}

export function getDatabase(): Redis {
    if (!logShown) {
        console.log(`getDatabase: Redis @ '${process.env.REDIS_CONNECTION_STRING}`);
        logShown = true;
    }
    if (db === undefined) {
        db = new Redis(`${process.env.REDIS_CONNECTION_STRING}`);
    }
    return db;
}