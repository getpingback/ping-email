import { CallbackDataMessages } from "./ping-email.interface";

export interface VerifyDomainResponse {
  smtp?: string;
  valid: boolean;
  foundMx: boolean;
  message: CallbackDataMessages;
}


