import { PingResponseMessages } from "./interfaces/ping-email.interface";
import { PingEmail } from "./ping-email";

describe("PingEmail", () => {
  describe("constructor", () => {
    it("should create a new instance of PingEmail", () => {
      const pingEmail = new PingEmail();
      expect(pingEmail).toBeInstanceOf(PingEmail);
    });

    it("should create a new instance of PingEmail with options", () => {
      const options = {
        port: 25,
        debug: true,
        timeout: 10000,
        sender: "a@a.com",
        fqdn: "a.com",
        attempts: 3,
      };

      const pingEmail = new PingEmail(options);
      expect(pingEmail).toBeInstanceOf(PingEmail);
    });
  });

  describe("ping", () => {
    const validEmail = "pmladeira36@gmail.com";
    const invalidEmail = "p@gmail.com";
    const invalidDomain = "p@jzbcsajkbakas.com";
    const invalidSyntaxEmail = "p@gmail";
    const disposableEmail = "p@tempemail.com";

    it("should return an error when email is not provided", async () => {
      const pingEmail = new PingEmail();
      const response = await pingEmail.ping("");
      expect(response.valid).toBe(false);
      expect(response.success).toBe(true);
      expect(response.message).toBe(PingResponseMessages.EMAIL_REQUIRED);
    });

    it("should return an error when email syntax is invalid", async () => {
      const pingEmail = new PingEmail();
      const response = await pingEmail.ping(invalidSyntaxEmail);
      expect(response.valid).toBe(false);
      expect(response.success).toBe(true);
      expect(response.message).toBe(PingResponseMessages.INVALID_SYNTAX);
    });

    it("should return an error when email domain is disposable", async () => {
      const pingEmail = new PingEmail();
      const response = await pingEmail.ping(disposableEmail);

      expect(response.valid).toBe(false);
      expect(response.success).toBe(true);
      expect(response.message).toBe(PingResponseMessages.DISPOSABLE_EMAIL);
    });

    it("should return an error when email domain is invalid", async () => {
      const pingEmail = new PingEmail();
      const response = await pingEmail.ping(invalidDomain);

      expect(response.valid).toBe(false);
      expect(response.success).toBe(true);
      expect(response.message).toBe(PingResponseMessages.DOMAIN_VERIFICATION_FAILED);
    });

    it("should return a success when email is valid", async () => {
      const pingEmail = new PingEmail();
      const response = await pingEmail.ping(validEmail);

      expect(response.valid).toBe(true);
      expect(response.success).toBe(true);
      expect(response.message).toBe(PingResponseMessages.VALID);
    });

    it("should return an error when email is invalid", async () => {
      const pingEmail = new PingEmail();
      const response = await pingEmail.ping(invalidEmail);

      expect(response.valid).toBe(false);
      expect(response.success).toBe(true);
      expect(response.message).toBe(PingResponseMessages.INVALID);
    });

    it("should ignore SMTP verification when ignoreSMTPVerify is true", async () => {
      const pingEmail = new PingEmail({ ignoreSMTPVerify: true });
      const response = await pingEmail.ping(validEmail);

      expect(response.valid).toBe(true);
      expect(response.success).toBe(true);
      expect(response.message).toBe(PingResponseMessages.VALID_IGNORED_SMTP);
    });
  });
});
