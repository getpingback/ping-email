import { Emails } from "./emails";
import {
  PingEmailOptions,
  PingResponseMessages,
} from "../interfaces/ping-email.interface";

const mockOptions = {
  port: 25,
  fqdn: "mail.example.org",
  sender: "name@example.org",
  timeout: 10000,
  debug: false,
  attempts: 3,
} as PingEmailOptions;

const emails = new Emails(mockOptions);

describe("Emails", () => {
  const validEmail = "pmladeira36@gmail.com";
  const invalidEmail = "p@jzbcsajkbakas.com";
  const invalidSyntaxEmail = "p@gmail";
  const disposableEmail = "p@tempemail.com";

  describe("verifySyntax", () => {
    it("should return true if email syntax is valid", () => {
      const result = emails.verifySyntax(validEmail);
      expect(result).toBe(true);
    });

    it("should return false if email syntax is invalid", () => {
      const result = emails.verifySyntax(invalidSyntaxEmail);
      expect(result).toBe(false);
    });
  });

  describe("verifyDisposableDomain", () => {
    it("should return false if email domain is not disposable", () => {
      const result = emails.verifyDisposableDomain(validEmail);
      expect(result).toBe(false);
    });

    it("should return true if email domain is disposable", () => {
      const result = emails.verifyDisposableDomain(disposableEmail);
      expect(result).toBe(true);
    });
  });

  describe("verifyDomain", () => {
    it("should return VALID_DOMAIN if domain is valid", async () => {
      const result = await emails.verifyDomain(validEmail);

      const expected = {
        smtp: "gmail-smtp-in.l.google.com",
        valid: true,
        foundMx: true,
        message: PingResponseMessages.VALID_DOMAIN,
      };

      expect(result).toEqual(expected);
    });

    it("should return DOMAIN_VERIFICATION_FAILED if domain is invalid", async () => {
      const result = await emails.verifyDomain(invalidEmail);

      const expected = {
        valid: false,
        foundMx: false,
        message: PingResponseMessages.DOMAIN_VERIFICATION_FAILED,
      };

      expect(result).toEqual(expected);
    });
  });

  describe("verifySMTP", () => {
    const smtp = "gmail-smtp-in.l.google.com";

    it("should return valid response if SMTP is valid", async () => {
      const result = await emails.verifySMTP(validEmail, smtp);

      const expected = {
        valid: true,
        tryAgain: false,
        success: true,
        message: PingResponseMessages.VALID,
      };

      expect(result).toEqual(expected);
    });

    it("should return invalid response if SMTP is invalid", async () => {
      const result = await emails.verifySMTP(disposableEmail, smtp);

      const expected = {
        valid: false,
        tryAgain: false,
        success: true,
        message: PingResponseMessages.INVALID,
      };

      expect(result).toEqual(expected);
    });
  });
});
