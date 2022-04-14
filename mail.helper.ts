import { expect } from "@playwright/test";
import { get_messages } from "gmail-tester";
import { resolve } from "path";
const cheerio = require("cheerio");

export const mailHelper = {
    async messageChecker(fromEmail: string, toEmail: string, subject: string) {
        const email = await get_messages(
            resolve(__dirname, "credentials.json"),
            resolve(__dirname, "token.json"),
            {
                from: fromEmail,
                to: toEmail,
                subject: subject,
                include_body: true,
                after: new Date(Date.now() - (1000 * 60) / 2),
            }
        );
        return email;
    },

    async readEmail(page, senderEmail: string, receiverEmail: string, subject: string): Promise<string> {
        let emails = await mailHelper.messageChecker(senderEmail, receiverEmail, subject);
        let startTime = Date.now();
        while (emails.length === 0 && Date.now() - startTime < 20000) {
            console.log(`Polling mail from: ${senderEmail}...`);
            await page.waitForTimeout(5000);
            emails = await mailHelper.messageChecker(
                senderEmail,
                receiverEmail,
                subject
            );
        }
        expect(emails.length).toBeGreaterThanOrEqual(1); //ensure new mail arrived
        expect(emails[0].subject).toContain(subject.substr(0, 50)); //assert subject
        return emails[0].body.html;
    },

    async getBodyText(html: any) {
        const $ = cheerio.load(html);
        $("body").find("br").replaceWith(" ");
        return $("body").text();
    },

    async getVerificationCode(text: any) {
        console.log("Getting the verification code from the email...");
        return parseInt(text.replace(/[^0-9\.]/g, ""), 10);
    },

    async extractVerificationCode(emailBodyHtml: any): Promise<number> {
        const actualMessage = await this.getBodyText(emailBodyHtml); //get text from body
        return await this.getVerificationCode(actualMessage);
    },

    async getPasswordResetLink(html: any,) {
        const $ = cheerio.load(html);
        let link = $('a:contains("click here")'); //"click here" link
        return link.attr("href")
    },


};
