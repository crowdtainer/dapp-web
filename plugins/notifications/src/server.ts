'use strict';

import 'dotenv/config';

var terminateProcess: boolean;
let numberOfSuccessfulySentEmails = 0;

import { Result, Ok } from '@sniptt/monads';

import Redis from "ioredis";
import { getDatabase } from './database.js';

import {
    checkPreconditions, INTERVAL_IN_MS, SMTP_SERVER,
    SMTP_PORT, SMTP_SECURE, SMTP_USER,
    SMTP_PASSWORD, EMAIL_FROM, EMAIL_SUBJECT,
    EMAIL_TEXT, EMAIL_HTML
} from './preconditions.js';

import { createTransport } from 'nodemailer';

type EmailsSent = { emails: string[] };
type Error = { details: number };

async function performMailWork() {

    const db = getDatabase();

    const emailCodes = await getMailWork(db);
    if (emailCodes.size == 0) {
        return;
    }

    const mailerResult = await dispatchEmails(emailCodes, async function onSent(id: string) {
        await db.lrem('mailWork', 0, id);
    });

    if (mailerResult.isErr()) {
        console.log(`Failed to send emails: ${mailerResult.unwrapErr().details}`);
    }

    const emailsSent = mailerResult.unwrap().emails;
    if (emailsSent.length > 0) {
        console.log(`Emails sent to: ${emailsSent}`);
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
        console.log(`Found: ${mailWork[i]}`);
        let otp = await db.get('userCode:' + mailWork[i]);
        if (otp) {
            emailCodes.set(mailWork[i], otp);
        }
    }

    return emailCodes;
}

async function dispatchEmails(emailCodes: Map<string, string>, onSent: (id: string) => void): Promise<Result<EmailsSent, Error>> {
    let emailsSentTo = new Array<string>();

    // create reusable transporter object using the default SMTP transport
    let transporter = createTransport({
        host: SMTP_SERVER,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD
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
            console.log(`Email sent to ${destination}`);
            onSent(email);
            emailsSentTo.push(email);
        }).catch((error) => {
            console.log(error);
        })
    }

    return Ok({ emails: emailsSentTo });
}

async function foreverLoop() {
    if (!checkPreconditions()) {
        terminateProcess = true;
    }

    console.log("Mailer worker started.");

    while (!terminateProcess) {
        await performMailWork();
        await delay(INTERVAL_IN_MS);
    }

    console.log("Mailer worker stopped.");
    process.exit();
}

function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

await foreverLoop();