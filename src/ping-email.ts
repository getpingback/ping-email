"use strict";

import { Log } from "./log/log";
import { Emails } from "./emails/emails";
import {
  PingResponse,
  PingEmailOptions,
  PingResponseMessages,
} from "./interfaces/ping-email.interface";

class PingEmail {
  private readonly log: Log;
  private readonly emails: Emails;

  constructor(
    readonly options: PingEmailOptions = {
      port: 25,
      fqdn: "mail.example.org",
      sender: "name@example.org",
      debug: false,
    }
  ) {
    this.log = new Log(this.options.debug);
    this.emails = new Emails(this.options);
  }

  async ping(email: string): Promise<PingResponse> {
    this.log.info(`Pinging email: ${email}`);

    if (!email) {
      return {
        email,
        valid: false,
        success: false,
        message: PingResponseMessages.EMAIL_REQUIRED,
      };
    }

    this.log.info(`Verifying syntax of email: ${email}`);
    const isSyntaxValid = this.emails.verifySyntax(email);
    if (!isSyntaxValid) {
      return {
        email,
        valid: false,
        success: false,
        message: PingResponseMessages.INVALID_SYNTAX,
      };
    }

    this.log.info(`Verifying disposable domain of email: ${email}`);
    const isDisposable = this.emails.verifyDisposableDomain(email);
    if (isDisposable) {
      return {
        email,
        valid: false,
        success: false,
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
        success: false,
        message: domainMessage,
      };
    }

    this.log.info(`Verifying SMTP of email: ${email}`);
    if (isDomainValid && foundMx && smtp) {
      const { valid, success, message } = await this.emails.verifySMTP(
        smtp,
        email
      );

      if (success && valid) {
        this.log.info(`Email is valid: ${email}`);

        return {
          email,
          valid,
          success,
          message,
        };
      } else {
        this.log.error(`Email is invalid: ${email}`);

        return {
          email,
          valid,
          success,
          message,
        };
      }
    }

    return {
      email,
      valid: false,
      success: false,
      message: PingResponseMessages.SMTP_CONNECTION_ERROR,
    };
  }
}

export { PingEmail };
