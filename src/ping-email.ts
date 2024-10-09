"use strict";

import { Log } from "./log/log";
import { Emails } from "./emails/emails";
import { PingResponse, PingEmailOptions, PingResponseMessages, PingEmailConstructorOptions } from "./interfaces/ping-email.interface";

class PingEmail {
  private readonly log: Log;
  private readonly emails: Emails;
  private readonly options: PingEmailOptions;

  constructor(options?: PingEmailConstructorOptions) {
    this.options = {
      port: options?.port || 25,
      debug: options?.debug || false,
      timeout: options?.timeout || 10000,
      sender: options?.sender || "name@example.org",
      fqdn: options?.fqdn || "mail.example.org",
      attempts: options?.attempts || 3,
      ignoreSMTPVerify: options?.ignoreSMTPVerify || false,
    };

    this.log = new Log(this.options.debug);
    this.emails = new Emails(this.options);
  }

  async ping(email: string): Promise<PingResponse> {
    this.log.info(`Pinging email: ${email}`);

    if (!email) {
      return {
        email,
        valid: false,
        success: true,
        message: PingResponseMessages.EMAIL_REQUIRED,
      };
    }

    this.log.info(`Verifying syntax of email: ${email}`);
    const isSyntaxValid = this.emails.verifySyntax(email);
    if (!isSyntaxValid) {
      return {
        email,
        valid: false,
        success: true,
        message: PingResponseMessages.INVALID_SYNTAX,
      };
    }

    this.log.info(`Verifying disposable domain of email: ${email}`);
    const isDisposable = this.emails.verifyDisposableDomain(email);
    if (isDisposable) {
      return {
        email,
        valid: false,
        success: true,
        message: PingResponseMessages.DISPOSABLE_EMAIL,
      };
    }

    this.log.info(`Verifying domain of email: ${email}`);
    const { smtp, foundMx, valid: isDomainValid, message: domainMessage } = await this.emails.verifyDomain(email);
    if (!isDomainValid) {
      return {
        email,
        valid: false,
        success: true,
        message: domainMessage,
      };
    }

    if (this.options.ignoreSMTPVerify && foundMx && smtp) {
      this.log.info(`Ignoring SMTP verification of email: ${email}`);
      return {
        email,
        valid: true,
        success: true,
        message: PingResponseMessages.VALID_IGNORED_SMTP,
      };
    }

    this.log.info(`Verifying SMTP of email: ${email}`);
    if (isDomainValid && foundMx && smtp) {
      for (let i = 0; i < this.options.attempts; i++) {
        this.log.info(`Attempt ${i + 1} of ${this.options.attempts}`);

        const { valid, success, message, tryAgain } = await this.emails.verifySMTP(email, smtp);

        if (success) {
          return {
            email,
            valid,
            success,
            message,
          };
        }

        if (!tryAgain) {
          return {
            email,
            valid,
            success,
            message,
          };
        }
      }

      this.log.info(`Attempts exceeded for email: ${email}`);
      return {
        email,
        valid: false,
        success: false,
        message: PingResponseMessages.ATTEMPTS_EXCEEDED,
      };
    }

    return {
      email,
      valid: false,
      success: false,
      message: PingResponseMessages.UNABLE_TO_VERIFY,
    };
  }

  async pingBatch(emails: string[], batchSize: number = 50): Promise<PingResponse[]> {
    this.log.info(`Starting batch verification of ${emails.length} emails`);

    if (emails.length > batchSize) {
      this.log.error(`The number of emails exceeds the maximum batch size. Limiting to ${batchSize} emails.`);
      emails = emails.slice(0, batchSize);
    }

    const pingPromises = emails.map(email => this.ping(email));

    try {
      const results = await Promise.all(pingPromises);
      this.log.info(`Batch verification completed for ${results.length} emails`);
      return results;
    } catch (error) {
      this.log.error(`Error during batch verification: ${error}`);
      throw error;
    }
  }
}

export { PingEmail };
