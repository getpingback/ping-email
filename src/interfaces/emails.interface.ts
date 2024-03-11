import { PingResponseMessages } from "./ping-email.interface";

export interface VerifyDomainResponse {
  smtp?: string;
  valid: boolean;
  foundMx: boolean;
  message: PingResponseMessages;
}

export interface VerifySMTPResponse {
  valid: boolean;
  success: boolean;
  tryAgain: boolean;
  message: PingResponseMessages;
}
