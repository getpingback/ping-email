import { resolveMx } from "dns";
import { promisify } from "util";
import { createConnection } from "net";
import disposable from "disposable-email";

import { VerifyDomainResponse } from "../interfaces/emails.interface";
import {
  PingEmailOptions,
  CallbackDataMessages,
  PingCallbackParam,
} from "../interfaces/ping-email.interface";

const resolveMxPromise = promisify(resolveMx);

class Emails {
  constructor(readonly options: PingEmailOptions) {
    this.options = options;
  }

  verifySyntax(email: string): boolean {
    const regex: RegExp =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email.toLowerCase());
  }

  verifyDisposableDomain(email: string): boolean {
    return !disposable.validate(email);
  }

  async verifyDomain(email: string): Promise<VerifyDomainResponse> {
    const domain: string = email.split("@")[1].toLocaleLowerCase();

    try {
      const addresses = await resolveMxPromise(domain);
      if (addresses && addresses.length > 0) {
        let priority = 10000;
        let lowestPriorityIndex = 0;

        addresses.forEach((address, index) => {
          if (address.priority < priority) {
            priority = address.priority;
            lowestPriorityIndex = index;
          }
        });

        const smtp = addresses[lowestPriorityIndex].exchange;

        return {
          smtp,
          valid: true,
          foundMx: true,
          message: CallbackDataMessages.VALID_DOMAIN,
        };
      } else {
        return {
          valid: false,
          foundMx: false,
          message: CallbackDataMessages.NO_MX_RECORDS,
        };
      }
    } catch (err) {
      return {
        valid: false,
        foundMx: false,
        message: CallbackDataMessages.DOMAIN_VERIFICATION_FAILED,
      };
    }
  }

  async verifySMTP(
    email: string,
    smtp: string,
    callback: PingCallbackParam
  ): Promise<void> {
    let stage = 0;
    let banner = "";
    let response = "";
    let ended = false;
    let success = false;
    let tryagain = false;
    let completed = false;

    const connection = createConnection(this.options.port, smtp);

    connection.on("data", (data) => {
      response += data.toString();
      completed = response.slice(-1) === "\n";

      if (completed) {
        console.log(`[ping-email]: 📨 SMTP Response: ${response}`);

        switch (stage) {
          case 0:
            if (response.indexOf("220") > -1 && !ended) {
              banner = response;
              const cmd = `EHLO ${this.options.fqdn}\r\n`;
              console.log(`[ping-email]: 📨 SMTP Command: ${cmd}`);
              connection.write(cmd, () => {
                stage++;
                response = "";
              });
            } else {
              if (
                response.indexOf("421") > -1 ||
                response.indexOf("450") > -1 ||
                response.indexOf("451") > -1
              )
                tryagain = true;
              connection.end();
            }
            break;
          case 1:
            if (response.indexOf("250") > -1 && !ended) {
              const cmd = `MAIL FROM:<${this.options.sender}>\r\n`;
              console.log(`[ping-email]: 📨 SMTP Command: ${cmd}`);

              connection.write(cmd, () => {
                stage++;
                response = "";
              });
            } else {
              connection.end();
            }
            break;
          case 2:
            if (response.indexOf("250") > -1 && !ended) {
              const cmd = `RCPT TO:<${email}>\r\n`;
              console.log(`[ping-email]: 📨 SMTP Command: ${cmd}`);

              connection.write(cmd, () => {
                stage++;
                response = "";
              });
            } else {
              connection.end();
            }
            break;
          case 3:
            if (
              response.indexOf("250") > -1 ||
              ("405" && response.indexOf("405") > -1)
            ) {
              success = true;
            }
            stage++;
            response = "";

            // close the connection cleanly.
            if (!ended) {
              const cmd = "QUIT\r\n";
              console.log(`[ping-email]: 📨 SMTP Command: ${cmd}`);
              connection.write(cmd);
            }
            break;
          case 4:
            connection.end();
        }
      }
    });

    connection.once("connect", () => {
      console.log("[ping-email]: 🔗 Connection to SMTP server established");
    });

    connection.once("error", (err) => {
      console.log("[ping-email]: ❌ Error connecting to SMTP server");
      console.log("[ping-email]: ❌ Error: ", err);

      callback({
        email,
        valid: false,
        success: false,
        message: CallbackDataMessages.SMTP_CONNECTION_ERROR,
      });
    });

    connection.once("end", () => {
      console.log("[ping-email]: 🏁 Connection to SMTP server ended");

      if (success) {
        callback({
          email,
          valid: true,
          success: true,
          message: CallbackDataMessages.VALID,
        });
      } else {
        callback({
          email,
          valid: false,
          success: false,
          message: CallbackDataMessages.INVALID,
        });
      }
    });
  }
}

export { Emails };
