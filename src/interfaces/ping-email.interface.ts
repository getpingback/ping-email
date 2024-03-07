export enum CallbackDataMessages {
  VALID = "Valid email",
  INVALID = "Invalid email",
  VALID_DOMAIN = "Valid domain",
  INVALID_DOMAIN = "Invalid domain",
  EMAIL_REQUIRED = "Email is required",
  NO_MX_RECORDS = "No MX records found",
  INVALID_SYNTAX = "Invalid email syntax",
  DISPOSABLE_EMAIL = "Disposable email is not allowed",
  DOMAIN_VERIFICATION_FAILED = "Domain verification failed",
  SMTP_CONNECTION_ERROR = "SMTP connection error",
}

export interface PingEmailConstructorOptions {
  port?: number;
  fqdn?: string;
  sender?: string;
}

export interface PingEmailOptions {
  port: number;
  fqdn: string;
  sender: string;
}

export interface PingEmailCallbackData {
  email: string;
  valid: boolean;
  success: boolean;
  message: CallbackDataMessages;
}

export type PingEmailParam = string;
export type PingCallbackParam = (data: PingEmailCallbackData) => void;
