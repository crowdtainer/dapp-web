'use strict';

import 'dotenv/config';

var terminateProcess: boolean;
let numberOfSuccessfulySentEmails = 0;

import { Result, Ok, Err } from '@sniptt/monads';

import Redis from "ioredis";
import { getDatabase } from './database.js';

import {
    checkPreconditions, INTERVAL_IN_MS, SMTP_SERVER,
    SMTP_PORT, SMTP_SECURE, SMTP_USER,
    SMTP_PASSWORD, EMAIL_FROM, EMAIL_SUBJECT,
    EMAIL_TEXT, EMAIL_HTML, HEALTH_CHECK_URL, ALIVE_PING_INTERVAL_IN_SECONDS
} from './preconditions.js';

import { createTransport } from 'nodemailer';
import { HealthReport, LogType } from 'healthreports';

let healthReporter: HealthReport;

type EmailsSent = { emails: string[] };
type Error = { details: string };

if (HEALTH_CHECK_URL) {
    healthReporter = new HealthReport(new URL(HEALTH_CHECK_URL), ALIVE_PING_INTERVAL_IN_SECONDS);
    console.log(`Alive ping signal enabled, pinging each ${ALIVE_PING_INTERVAL_IN_SECONDS} second(s).`);
} else {
    console.log(`Warning: Alive ping signal disabled!`);
}

async function performMailWork(db: Redis) {

    if (healthReporter) healthReporter.sendAliveSignal();

    const emailCodes = await getMailWork(db);
    if (emailCodes.size == 0) {
        return;
    }

    const mailerResult = await dispatchEmails(emailCodes, async function onSent(id: string) {
        await db.lrem('mailWork', 0, id);
    });

    if (!mailerResult.isErr()) {
        const emailsSent = mailerResult.unwrap().emails;
        if (emailsSent.length > 0) {
            if (process.env.NODE_ENV == "development") {
                console.log(`Emails sent to: ${emailsSent}`);
            }
            if (healthReporter) healthReporter.postExternalLog(`Sent ${emailsSent.length} email(s).`, LogType.Information);
        }
    } else {
        console.log(`Failed to send emails: ${mailerResult.unwrapErr().details}`);
        if (healthReporter) healthReporter.postExternalLog(mailerResult.unwrapErr().details.toString(), LogType.Error);
    }

    numberOfSuccessfulySentEmails += mailerResult.unwrap().emails.length;
    console.log(`Total e-mails sent: ${numberOfSuccessfulySentEmails}.`);
}

function signalHandler() {
    console.log('Termination signal received, stopping..');
    terminateProcess = true;
}

process.on('SIGINT', signalHandler);
process.on('SIGTERM', signalHandler);
process.on('SIGQUIT', signalHandler);

async function getMailWork(db: Redis): Promise<Map<string, string>> {

    const mailWork = await db.lrange("mailWork", 0, -1);

    const emailCodes = new Map<string, string>();

    for (let i = 0; i < mailWork.length; i++) {
        if (process.env.NODE_ENV == "development") {
            console.log(`Found: ${mailWork[i]}`);
        }
        let otp = await db.get('userCode:' + mailWork[i]);
        if (otp) {
            emailCodes.set(mailWork[i], otp);
        }
    }
    if (mailWork.length > 0) {
        console.log(`Work items detected: ${mailWork.length}`);
    }

    return emailCodes;
}

async function dispatchEmails(emailCodes: Map<string, string>, onSent: (id: string) => void): Promise<Result<EmailsSent, Error>> {
    let emailsSentTo = new Array<string>();

    try {
        // create reusable transporter object using the default SMTP transport
        let transporter = createTransport({
            host: SMTP_SERVER,
            port: SMTP_PORT,
            secure: SMTP_SECURE,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASSWORD
            },
            tls: {
                ciphers: 'SSLv3'
            }
        });

        for (const [email, code] of emailCodes) {
            const textBody = EMAIL_TEXT?.replace("%{otp_code}", code);
            const htmlBody = EMAIL_HTML?.replace("%{otp_code}", code);

            const mailOptions = {
                from: EMAIL_FROM,
                to: email,
                subject: EMAIL_SUBJECT,
                text: textBody,
                html: htmlBody
            };

            const sendMailAsync = new Promise<string>((resolve, reject) => {
                transporter.sendMail(mailOptions, function (error, _info) {
                    (error) ? reject(error) : resolve(mailOptions.to);
                })
            });

            await sendMailAsync.then((destination) => {
                if (process.env.NODE_ENV == "development") {
                    console.log(`Email sent to ${destination}`);
                }
                onSent(email);
                emailsSentTo.push(email);
            }).catch((error) => {
                console.log(error);
                return Err({ details: JSON.stringify(error) });
            })
        }
    } catch (error) {
        return Err({ details: JSON.stringify(error) });
    }

    return Ok({ emails: emailsSentTo });
}

async function foreverLoop() {
    if (!checkPreconditions()) {
        terminateProcess = true;
    }

    const processStartedMessage = `Mailer worker started @ ${new Date().toISOString()}`;
    console.log(processStartedMessage);
    if (healthReporter) await healthReporter.postExternalLog(processStartedMessage, LogType.Information);

    const db = getDatabase();

    while (!terminateProcess) {
        try {
            await performMailWork(db);
        } catch (error) {
            let errorMessage = String(error);
            console.log(errorMessage);
            if (healthReporter) await healthReporter.postExternalLog(errorMessage, LogType.Error);
            terminateProcess = true;
        }
        await delay(INTERVAL_IN_MS);
    }

    console.log('Mailer worker stopping..');
    await db.quit();
    if (healthReporter) await healthReporter.postExternalLog('Mailer worker stopped.', LogType.Error);
    console.log('Mailer worker stopped.');
    process.exit(0);
}

function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

await foreverLoop();