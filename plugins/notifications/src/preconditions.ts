import 'dotenv/config';

import { dbPreconditiosFail } from './database.js';

export const DEFAULT_INTERVAL_IN_MS = 5000;
export const INTERVAL_IN_MS = process.env.INTERVAL_IN_MS ? Number(process.env.INTERVAL_IN_MS) : DEFAULT_INTERVAL_IN_MS;
export const SMTP_SERVER = process.env.SMTP_SERVER;
export const SMTP_PORT = Number(process.env.SMTP_PORT);
export const SMTP_SECURE = process.env.SMTP_SECURE == "true";
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
export const EMAIL_FROM = process.env.EMAIL_FROM;
export const EMAIL_SUBJECT = process.env.EMAIL_SUBJECT;
export const EMAIL_TEXT = process.env.EMAIL_TEXT;
export const EMAIL_HTML = process.env.EMAIL_HTML;

function printMissingVariable(name: string) {
    console.log(`Failure: missing ${name} environment variable.`);
}

export function checkPreconditions(): boolean {
    if (!process.env.INTERVAL_IN_MS) {
        console.log(`Warning: INTERVAL_IN_MS environment variable not defined. Using ${DEFAULT_INTERVAL_IN_MS} ms as default.`)
    }

    let missingMandatoryEnvVar = false;

    if (!SMTP_SERVER) {
        printMissingVariable('SMTP_SERVER');
        missingMandatoryEnvVar = true;
    }

    if (!process.env.SMTP_PORT || Number(process.env.SMTP_PORT) <= 0) {
        printMissingVariable('SMTP_PORT');
        missingMandatoryEnvVar = true;
    }

    if (process.env.SMTP_SECURE === undefined || (process.env.SMTP_SECURE != "false" && process.env.SMTP_SECURE != "true")) {
        printMissingVariable('SMTP_SECURE');
        missingMandatoryEnvVar = true;
    }

    if (!SMTP_USER) {
        printMissingVariable('SMTP_USER');
        missingMandatoryEnvVar = true;
    }

    if (!SMTP_PASSWORD) {
        printMissingVariable('SMTP_PASSWORD');
        missingMandatoryEnvVar = true;
    }

    if (!EMAIL_FROM) {
        printMissingVariable('EMAIL_FROM');
        missingMandatoryEnvVar = true;
    }

    if (!EMAIL_SUBJECT) {
        printMissingVariable('EMAIL_SUBJECT');
        missingMandatoryEnvVar = true;
    }

    if (!EMAIL_TEXT) {
        printMissingVariable('EMAIL_TEXT');
        missingMandatoryEnvVar = true;
    }

    if (!EMAIL_HTML) {
        printMissingVariable('EMAIL_HTML');
        missingMandatoryEnvVar = true;
    }

    if (missingMandatoryEnvVar) {
        return false;
    }

    const dbResult = dbPreconditiosFail();
    if (dbResult.isSome()) {
        console.log(`Failure: ${dbResult.unwrap().details}`)
        return false;
    }

    return true;
}