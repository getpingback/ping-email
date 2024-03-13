export enum PingResponseMessages {
  VALID = "Valid email",
  VALID_IGNORED_SMTP = "Valid email (ignored SMTP verification)",
  INVALID = "Invalid email",
  VALID_DOMAIN = "Valid domain",
  INVALID_DOMAIN = "Invalid domain",
  EMAIL_REQUIRED = "Email is required",
  NO_MX_RECORDS = "No MX records found",
  INVALID_SYNTAX = "Invalid email syntax",
  SMTP_CONNECTION_ERROR = "SMTP connection error",
  DISPOSABLE_EMAIL = "Disposable email is not allowed",
  DOMAIN_VERIFICATION_FAILED = "Domain verification failed",
  UNABLE_TO_VERIFY = "Unable to verify email",
  CONNECTION_TIMEOUT = "Connection timeout",
  ATTEMPTS_EXCEEDED = "Exceeded attempts",
}

export interface PingEmailConstructorOptions {
  port?: number;
  fqdn?: string;
  sender?: string;
  debug?: boolean;
  timeout?: number;
  attempts?: number;
  ignoreSMTPVerify?: boolean;
}

export interface PingEmailOptions {
  port: number;
  fqdn: string;
  sender: string;
  debug: boolean;
  timeout: number;
  attempts: number;
  ignoreSMTPVerify: boolean;
}

export interface PingResponse {
  email: string;
  valid: boolean;
  success: boolean;
  message: PingResponseMessages;
}
