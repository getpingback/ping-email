class Log {
  private debug: boolean;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  info(message: string): void {
    if (this.debug) console.log(`[ping-email - INFO]:  ${message}`);
  }

  error(message: string): void {
    if (this.debug) console.log(`[ping-email - ERROR]: ${message}`);
  }
}

export { Log };
