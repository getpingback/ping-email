"use strict";

import * as fs from "fs";
import * as path from "path";

import { PingEmail } from "../src/ping-email";

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      cells.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  cells.push(current);
  return cells;
}

function escapeCsvField(field: string): string {
  if (/[",\r\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function rowToLine(cells: string[]): string {
  return cells.map(escapeCsvField).join(",");
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Spaces out when workers may *start* a new check: reduces burst traffic to MX hosts (lower IP block risk).
 * Serializes scheduling only; many checks still run concurrently once started.
 */
function createStartPacer(minIntervalMs: number, jitterMaxMs: number): () => Promise<void> {
  if (minIntervalMs <= 0 && jitterMaxMs <= 0) {
    return async () => undefined;
  }
  let tail = Promise.resolve();
  return async () => {
    const run = tail.then(async () => {
      const j = jitterMaxMs > 0 ? Math.floor(Math.random() * (jitterMaxMs + 1)) : 0;
      await sleep(minIntervalMs + j);
    });
    tail = run.catch(() => undefined);
    await run;
  };
}

function usage(): void {
  const base = path.basename(process.argv[1] ?? "filter-valid-csv-emails.ts");
  console.error(`Usage: npx ts-node scripts/${base} [--input PATH] [--output PATH] [--concurrency N] [--delay-ms N] [--pace-ms N] [--jitter-ms N] [--ignore-smtp] [--limit N] [--debug]

Reads a CSV with an "email" column (default: first column), verifies with PingEmail, and writes a new CSV
with only rows where verification returns valid=true.

Default mode: full SMTP (RCPT TO) to infer mailbox existence — slower than domain-only.

Anti-block pacing (SMTP defaults): modest concurrency plus a minimum gap (+ random jitter) between *starts*
of new checks. Tune --pace-ms / --concurrency if you still see greylisting/throttling/blocking.

Options:
  --input PATH       Input CSV (default: list.csv in project root)
  --output PATH      Output CSV (default: list-valid-emails.csv)
  --concurrency N    Parallel workers (SMTP default: 8; with --ignore-smtp default: 25)
  --pace-ms N        Minimum ms between scheduling each new check (SMTP default: 140; ignored with --ignore-smtp unless set)
  --jitter-ms N      Random extra ms in [0, N] added to pace (SMTP default: 100; spreads connection spikes)
  --delay-ms N       Extra pause after each completed ping per worker (default: 0)
  --ignore-smtp      Skip SMTP; syntax + disposable + domain/MX only (much faster, no mailbox proof)
  --full-smtp        No-op (SMTP is already the default); kept for compatibility
  --limit N          Only process first N data rows after header (testing)
  --debug            PingEmail verbose logs`);
  process.exit(1);
}

async function mapPoolLimit<T>(
  items: T[],
  concurrency: number,
  delayMs: number,
  paceNextStart: () => Promise<void>,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  async function worker(): Promise<void> {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      await paceNextStart();
      await fn(items[i], i);
      if (delayMs > 0) await sleep(delayMs);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) usage();

  const opts: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--ignore-smtp") opts.ignoreSMTP = true;
    else if (a === "--full-smtp") opts.fullSMTP = true;
    else if (a === "--debug") opts.debug = true;
    else if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      if (val && !val.startsWith("--")) {
        opts[key] = val;
        i++;
      }
    }
  }

  const root = path.resolve(__dirname, "..");
  const inputPath = path.resolve(typeof opts.input === "string" ? opts.input : path.join(root, "list.csv"));
  const outputPath = path.resolve(typeof opts.output === "string" ? opts.output : path.join(root, "list-valid-emails.csv"));
  const limit = opts.limit ? parseInt(String(opts.limit), 10) : NaN;
  /** Prefer mailbox check; --ignore-smtp skips SMTP; --full-smtp wins over --ignore-smtp if both given. */
  const ignoreSMTPVerify = opts.ignoreSMTP === true && opts.fullSMTP !== true;
  const debug = opts.debug === true;

  const fastMode = ignoreSMTPVerify;
  const concurrencyOpt = opts.concurrency !== undefined ? parseInt(String(opts.concurrency), 10) : NaN;
  const concurrency = Math.max(
    1,
    Number.isFinite(concurrencyOpt) && concurrencyOpt > 0
      ? concurrencyOpt
      : fastMode
        ? 25
        : 8,
  );

  const delayMsRaw = opts["delay-ms"] !== undefined ? parseInt(String(opts["delay-ms"]), 10) : 0;
  const delayMs = Math.max(0, Number.isFinite(delayMsRaw) ? delayMsRaw : 0);

  const paceOpt = opts["pace-ms"] !== undefined ? parseInt(String(opts["pace-ms"]), 10) : NaN;
  const jitterOpt = opts["jitter-ms"] !== undefined ? parseInt(String(opts["jitter-ms"]), 10) : NaN;

  const paceMs = Math.max(
    0,
    Number.isFinite(paceOpt) ? paceOpt : fastMode ? 0 : 140,
  );
  const jitterMs = Math.max(
    0,
    Number.isFinite(jitterOpt) ? jitterOpt : fastMode ? 0 : 100,
  );

  const paceNextStart = createStartPacer(paceMs, jitterMs);

  const text = fs.readFileSync(inputPath, "utf-8");
  const lines = text.split(/\r?\n/).filter((line: string) => line.length > 0);

  if (lines.length === 0) {
    console.error(`Empty CSV: ${inputPath}`);
    process.exit(2);
  }

  const headers = parseCsvLine(lines[0]);
  const emailIdx = headers.findIndex(h => h.trim().toLowerCase() === "email");
  const colIdx = emailIdx >= 0 ? emailIdx : 0;

  let rawRows: string[][] = [];
  for (let lineNum = 1; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    if (line.trim() === "") continue;
    rawRows.push(parseCsvLine(line));
  }

  if (!Number.isNaN(limit) && limit > 0) {
    rawRows = rawRows.slice(0, limit);
  }

  const pingEmail = new PingEmail({
    ignoreSMTPVerify,
    debug,
    timeout: 12000,
    attempts: 3,
  });

  const keptOrdered: Array<string[] | undefined> = new Array(rawRows.length);

  console.error(
    `Verifying ${rawRows.length} rows from ${inputPath} (${ignoreSMTPVerify ? "domain-only (no SMTP)" : "full SMTP (mailbox check)"}; concurrency=${concurrency}, pace-ms=${paceMs}, jitter-ms=${jitterMs}, delay-ms=${delayMs})`,
  );

  let done = 0;
  let validCount = 0;
  await mapPoolLimit(rawRows, concurrency, delayMs, paceNextStart, async (cells, index) => {
    const rawEmail = (cells[colIdx] ?? "").trim();
    const res = await pingEmail.ping(rawEmail);
    if (res.valid) {
      keptOrdered[index] = cells;
      validCount++;
    }
    done++;
    if (done % 100 === 0 || done === rawRows.length) {
      console.error(`Progress: ${done}/${rawRows.length} (${validCount} valid so far)`);
    }
  });

  const validCells = keptOrdered.filter((row): row is string[] => row !== undefined);

  const outLines = [rowToLine(headers), ...validCells.map(rowToLine)];
  fs.writeFileSync(outputPath, outLines.join("\n") + "\n", "utf-8");
  console.error(`Done. Wrote ${validCells.length} valid rows to ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
