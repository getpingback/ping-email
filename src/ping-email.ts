"use strict";

import { Log } from "./log/log";
import { Emails } from "./emails/emails";
import {
  PingResponse,
  PingEmailOptions,
  PingResponseMessages,
  PingEmailConstructorOptions,
} from "./interfaces/ping-email.interface";

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
        tryAgain: false,
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
        tryAgain: false,
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
        tryAgain: false,
        message: PingResponseMessages.DISPOSABLE_EMAIL,
      };
    }

    this.log.info(`Verifying domain of email: ${email}`);
    const {
      smtp,
      foundMx,
      valid: isDomainValid,
      message: domainMessage,
    } = await this.emails.verifyDomain(email);
    if (!isDomainValid) {
      return {
        email,
        valid: false,
        success: true,
        tryAgain: false,
        message: domainMessage,
      };
    }

    this.log.info(`Verifying SMTP of email: ${email}`);
    if (isDomainValid && foundMx && smtp) {
      const { valid, success, message, tryAgain } =
        await this.emails.verifySMTP(email, smtp);

      this.log.info(`SMTP verification of email: ${email} - ${message}`);

      return {
        email,
        valid,
        success,
        message,
        tryAgain,
      };
    }

    return {
      email,
      valid: false,
      success: false,
      tryAgain: false,
      message: PingResponseMessages.UNABLE_TO_VERIFY,
    };
  }
}

export { PingEmail };
