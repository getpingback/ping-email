![ping-email Cover](https://res.cloudinary.com/pingback/image/upload/v1709844172/assets/general/ping-email-cover_qaivm8.png)

<div align="center"><strong>ping-email</strong></div>
<div align="center">Node.js SMTP Email Verification Library</div>
<br />
<div align="center">
<a href="https://pingback.com/">Pingback</a>
</div>

**An open-source Node.js library for SMTP Email Verification. Powered by [Pingback](https://pingback.com/).**

## Install

```bash
npm install ping-email
# or
yarn add ping-email
```

## Setup

```js
import { PingEmail } from "ping-email";
const pingEmail = new PingEmail();
```

## Usage

Ping an email address:

```js
const result = await pingEmail.ping("example@email.com", (data) => {
  console.log(data);
});
```

---

## Authors

- Pedro Ladeira ([@pedrooladeira](https://twitter.com/pedrooladeira))
- Daniel Bastos ([@dannnnnnnn___](https://twitter.com/dannnnnnnn___))

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
