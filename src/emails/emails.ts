import { resolveMx } from "dns";
import { promisify } from "util";
import { createConnection } from "net";
import disposable from "disposable-email";

import {
  PingEmailOptions,
  PingResponseMessages,
} from "../interfaces/ping-email.interface";
import {
  VerifyDomainResponse,
  VerifySMTPResponse,
} from "../interfaces/emails.interface";
import { Log } from "../log/log";

const resolveMxPromise = promisify(resolveMx);

class Emails {
  private readonly log: Log;

  constructor(readonly options: PingEmailOptions) {
    this.options = options;
    this.log = new Log(this.options.debug);
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
          message: PingResponseMessages.VALID_DOMAIN,
        };
      } else {
        return {
          valid: false,
          foundMx: false,
          message: PingResponseMessages.NO_MX_RECORDS,
        };
      }
    } catch (err) {
      return {
        valid: false,
        foundMx: false,
        message: PingResponseMessages.DOMAIN_VERIFICATION_FAILED,
      };
    }
  }

  async verifySMTP(email: string, smtp: string): Promise<VerifySMTPResponse> {
    return new Promise<VerifySMTPResponse>((resolve) => {
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
          this.log.info(`SMTP Response: ${response}`);

          switch (stage) {
            case 0:
              if (response.indexOf("220") > -1 && !ended) {
                banner = response;
                const cmd = `EHLO ${this.options.fqdn}\r\n`;

                this.log.info(`SMTP Command: ${cmd}`);

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
                this.log.info(`SMTP Command: ${cmd}`);

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

                this.log.info(`SMTP Command: ${cmd}`);

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

                this.log.info(`SMTP Command: ${cmd}`);

                connection.write(cmd);
              }
              break;
            case 4:
              connection.end();
          }
        }
      });

      connection.once("connect", () => {
        this.log.info(`Connection to SMTP server established`);
      });

      connection.once("error", (err) => {
        this.log.error(`Error connecting to SMTP server: ${err}`);

        resolve({
          valid: false,
          success: false,
          message: PingResponseMessages.SMTP_CONNECTION_ERROR,
        });
      });

      connection.once("end", () => {
        this.log.info(`Connection to SMTP server ended`);

        if (success) {
          resolve({
            valid: true,
            success: true,
            message: PingResponseMessages.VALID,
          });
        } else {
          resolve({
            valid: false,
            success: false,
            message: PingResponseMessages.INVALID,
          });
        }
      });
    });
  }
}

export { Emails };
