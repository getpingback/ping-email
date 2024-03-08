"use strict";

import { Emails } from "./emails/emails";
import {
  PingEmailParam,
  PingEmailOptions,
  PingCallbackParam,
  CallbackDataMessages,
} from "./interfaces/ping-email.interface";

class PingEmail {
  private readonly emails: Emails;

  constructor(
    readonly options: PingEmailOptions = {
      port: 25,
      fqdn: "mail.example.org",
      sender: "name@example.org",
    }
  ) {
    this.emails = new Emails(this.options);
  }

  async ping(
    email: PingEmailParam,
    callback: PingCallbackParam
  ): Promise<void> {
    if (!email) {
      return callback({
        email,
        valid: false,
        success: false,
        message: CallbackDataMessages.EMAIL_REQUIRED,
      });
    }

    const isSyntaxValid = this.emails.verifySyntax(email);
    if (!isSyntaxValid) {
      return callback({
        email,
        valid: false,
        success: false,
        message: CallbackDataMessages.INVALID_SYNTAX,
      });
    }

    const isDisposable = this.emails.verifyDisposableDomain(email);
    if (isDisposable) {
      return callback({
        email,
        valid: false,
        success: false,
        message: CallbackDataMessages.DISPOSABLE_EMAIL,
      });
    }

    const {
      smtp,
      foundMx,
      valid: isDomainValid,
      message: domainMessage,
    } = await this.emails.verifyDomain(email);
    if (!isDomainValid) {
      return callback({
        email,
        valid: false,
        success: false,
        message: domainMessage,
      });
    }

    if (isDomainValid && foundMx && smtp) {
      await this.emails.verifySMTP(email, smtp, callback);
    }
  }
}

export { PingEmail };
