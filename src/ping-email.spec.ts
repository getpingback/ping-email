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

  describe("pingBatch", () => {
    const validEmail1 = "pmladeira36@gmail.com";
    const validEmail2 = "pmladeira36@gmail.com";
    const invalidEmail = "invalid@example.com";
    const disposableEmail = "p@tempemail.com";
    const invalidSyntaxEmail = "invalidsyntax@.com";

    it("should verify a batch of valid emails", async () => {
      const pingEmail = new PingEmail();
      const emails = [validEmail1, validEmail2];
      const results = await pingEmail.pingBatch(emails);

      expect(results).toHaveLength(2);
      results.forEach((result) => {
        expect(result.valid).toBe(true);
        expect(result.success).toBe(true);
        expect(result.message).toBe(PingResponseMessages.VALID);
      });
    });

    it("should handle a batch of mixed emails", async () => {
      const pingEmail = new PingEmail();
      const emails = [validEmail1, invalidEmail, disposableEmail, invalidSyntaxEmail];
      const results = await pingEmail.pingBatch(emails);

      expect(results).toHaveLength(4);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(false);
      expect(results[2].valid).toBe(false);
      expect(results[3].valid).toBe(false);
    });

    it("should respect the maximum batch size", async () => {
      const pingEmail = new PingEmail();
      const emails = Array(49).fill(validEmail1);
      const results = await pingEmail.pingBatch(emails);

      expect(results).toHaveLength(49);
    });

    it("should handle an empty batch", async () => {
      const pingEmail = new PingEmail();
      const results = await pingEmail.pingBatch([]);

      expect(results).toHaveLength(0);
    });

    it("should handle errors during verification", async () => {
      const pingEmail = new PingEmail();
      jest.spyOn(pingEmail, "ping").mockRejectedValueOnce(new Error("Test error"));

      const emails = [validEmail1, validEmail2];
      await expect(pingEmail.pingBatch(emails)).rejects.toThrow("Test error");
    });

    it("should ignore SMTP verification when configured", async () => {
      const pingEmail = new PingEmail({ ignoreSMTPVerify: true });
      const emails = [validEmail1, validEmail2];
      const results = await pingEmail.pingBatch(emails);

      expect(results).toHaveLength(2);
      results.forEach((result) => {
        expect(result.valid).toBe(true);
        expect(result.message).toBe(PingResponseMessages.VALID_IGNORED_SMTP);
      });
    });
  });
});
