![ping-email Cover](https://res.cloudinary.com/pingback/image/upload/v1709848522/assets/general/cover_e4tjvr.png)

<div align="center"><strong>ping-email</strong></div>
<div align="center">Node.js SMTP Email Verification Library</div>

## Install

```bash
npm install ping-email
# or
yarn add ping-email
```

## Setup

```js
import { PingEmail } from "ping-email";
const pingEmail = new PingEmail({
  port: 25, // Default SMTP port
  fqdn: "mail.example.org", // Fully Qualified Domain Name of your SMTP server
  sender: "name@example.org", // Email address to use as the sender in SMTP checks,
  timeout: 10000, // Time in milliseconds to wait for a response from the SMTP server
  attempts: 3, // Number of attempts to verify the email address
});
```

## Usage

### Verifying an Email Address

To verify an email address using PingEmail, call the ping method with the target email address:

```js
const { email, valid, message } = await pingEmail.ping("test@example.com");

if (valid) {
  console.log("Email is valid:", email);
} else {
  console.error("Verification failed:", message);
}
```

### Ping Response

The ping method returns an object with the following properties:

- `email`: The email address being verified.
- `valid`: A boolean indicating the overall validity of the email based on syntax, domain, and SMTP checks.
- `success`: A boolean indicating if the verification process executed without encountering system-level errors (e.g., network issues).
- `message`: A string providing detailed feedback about the verification outcome. This message can be one of the following, as defined in `PingResponseMessages`:
  - `"Valid email"`: The email address is valid.
  - `"Invalid email"`: The email address is invalid.
  - `"Valid domain"`: The domain of the email address is valid.
  - `"Invalid domain"`: The domain of the email address is invalid.
  - `"Email is required"`: No email address was provided for verification.
  - `"No MX records found"`: The domain does not have MX records, indicating it cannot receive emails.
  - `"Invalid email syntax"`: The email address provided does not meet the syntactical standards for email addresses.
  - `"SMTP connection error"`: There was an error connecting to the SMTP server for verification.
  - `"Disposable email is not allowed"`: The email address belongs to a disposable email provider.
  - `"Domain verification failed"`: The domain verification process failed.
  - `"Unable to verify email"`: The email verification process failed for an unknown reason.
  - `"Connection timeout"`: The connection to the SMTP server timed out.
  - `"Exceeded attempts"`: The maximum number of attempts to verify the email address was exceeded.
  - `"Valid email (ignored SMTP verification)"`: The email address is valid, but the SMTP verification process was skipped.

These messages provide clear insights into the verification process, helping you understand the specific reason for an email's validation outcome.

### Error Handling

When integrating PingEmail into your applications, pay special attention to the success and message properties in the ping method response. They are key to identifying and handling different scenarios, such as invalid email syntax, domain issues, or SMTP server connectivity problems. Logging these details can be helpful for debugging purposes or improving user feedback in your application interface.

### Options

You can customize **PingEmail** by providing different options when you instantiate it. The available options are:

- `port`: The port number to connect to the SMTP server `(default: 25)`.
- `attempts`: The number of attempts to verify the email address `(default: 3)`.
- `fqdn`: The Fully Qualified Domain Name of your SMTP server `(default: "mail.example.org")`.
- `sender`: The email address used as the sender in SMTP checks `(default: "name@example.org")`.
- `timeout`: The time in milliseconds to wait for a response from the SMTP server `(default: 10000)`.
- `ignoreSMTPVerify`: A boolean indicating whether to skip the SMTP verification process `(default: false)`.
- `debug`: A boolean indicating whether to enable debug mode, which logs detailed information about the verification process `(default: false)`.

This allows you to tailor the library to your specific requirements, ensuring compatibility with your email verification workflow.

### Example

Here's a complete example demonstrating how to verify an email address:

```js
import { PingEmail } from "ping-email";

const pingEmail = new PingEmail({
  port: 587,
  fqdn: "smtp.example.org",
  sender: "verify@example.org",
  timeout: 15000,
  attempts: 5,
});

const { email, valid, success, message } = await pingEmail.ping("user@example.com");
```

## Understanding Email Verification

### What is SMTP?

Simple Mail Transfer Protocol (SMTP) is the standard protocol for sending emails across the Internet. It defines the rules for how email messages are transmitted between mail servers, and how users' email clients submit outgoing emails to their outgoing mail server.

### Why Validate Email Addresses?

Validating email addresses is crucial for several reasons:

- **Reduce Bounce Rates**: Ensuring that emails are sent to valid addresses prevents emails from being bounced back.
- **Improve Delivery Rates**: By filtering out invalid addresses, email campaigns can achieve higher delivery rates.
- **Enhance Security**: Verification helps prevent fraud and enhances the security of email communication by ensuring that emails are sent to intended recipients.
- **Save Resources**: By avoiding sending emails to non-existent or disposable addresses, businesses can save on server resources and focus on genuine users.

### Understanding Key Terms

- **Port**: In the context of SMTP, a port is a numerical designation that specifies a specific gateway for network communication. Common SMTP ports include 25 (default SMTP), 587 (for encrypted SMTP), and 465 (SMTPS).

- **FQDN (Fully Qualified Domain Name)**: This refers to the complete domain name of an Internet resource. In SMTP settings, it specifies the domain name of the SMTP server that is used to send emails. For example, `smtp.example.com`.

- **Sender**: The email address that appears in the 'From' field of an email. In email verification, it's used to simulate the sending process without actually sending an email, helping to verify the validity of the recipient's address.

Understanding these concepts is crucial for effectively utilizing `ping-email` and comprehending the mechanics of email verification and delivery.

---

## Authors

- Pedro Ladeira ([@pedrooladeira](https://twitter.com/pedrooladeira))
- Daniel Bastos ([@dannnnnnnn\_\_\_](https://twitter.com/dannnnnnnn___))

---

## Credits

This library, `ping-email`, was inspired by the [`email-verify`](https://github.com/EmailVerify/email-verify) project. We extend our sincere gratitude to the creators and contributors of `email-verify` for their innovative work in the field of email verification.

---

## Community

### Newsroom

We are always posting about our latest news and updates on our Newsroom. Check it out!

[Visit Pingback Newsroom](https://pingback.com/newsroom)

### Twitter

To receive updates about our Engineering team, follow along on Twitter.

[Follow Pingback on Twitter](https://twitter.com/pingbackoficial)

---

## License

Licensed under the MIT License, Copyright © 2024-present [Pingback](https://pingback.com/).

See [LICENSE](./LICENSE) for more information.
