import { Emails } from "./emails";
import {
  PingEmailOptions,
  CallbackDataMessages,
} from "../interfaces/ping-email.interface";

const mockOptions = {
  port: 25,
  fqdn: "mail.example.org",
  sender: "name@example.org",
} as PingEmailOptions;

const emails = new Emails(mockOptions);

describe("Emails", () => {
  const validEmail = "p@gmail.com";
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
        message: CallbackDataMessages.VALID_DOMAIN,
      };

      expect(result).toEqual(expected);
    });

    it("should return DOMAIN_VERIFICATION_FAILED if domain is invalid", async () => {
      const result = await emails.verifyDomain(invalidEmail);

      const expected = {
        valid: false,
        foundMx: false,
        message: CallbackDataMessages.DOMAIN_VERIFICATION_FAILED,
      };

      expect(result).toEqual(expected);
    });
  });
});
