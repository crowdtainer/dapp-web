// Internal
import { captchaEnabled } from '../Data/projects.json';
import { error, type RequestHandler } from "@sveltejs/kit";
import { getDatabase } from "$lib/Database/redis.js";
import { randomInt } from "crypto";

// External
import svgCaptcha from 'svg-captcha';

let codeExpireTimeInSeconds = 600;

export type CaptchaResponse = {
    id: number;
    svg: string
}

export const POST: RequestHandler = async ({ }) => {

    if (!captchaEnabled) {
        throw error(400, "Captcha not enabled for this project.");
    }

    let redis = getDatabase();
    if (redis === undefined) {
        throw error(500, `Db connection error.`);
    }

    let randomNumber = randomInt(9999999999);
    let captchaIdsKey = 'captchaId:v1:' + randomNumber;

    let captcha = svgCaptcha.create({ size: 5, ignoreChars: '0o1i', noise: 2, color: false })

    try {
        await redis.set(captchaIdsKey, captcha.text, 'EX', codeExpireTimeInSeconds);
    } catch (_error) {
        console.dir(_error);
        throw error(500, "Database failure.");
    }

    let captchaChallenge: CaptchaResponse = { id: randomNumber, svg: captcha.data };

    return new Response(JSON.stringify(captchaChallenge));
}