class Log {
  private debug: boolean;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  info(message: string): void {
    if (this.debug)
      console.log("\x1b[34m", `[ping-email - INFO]:  ${message}`);
  }

  error(message: string): void {
    if (this.debug)
      console.log("\x1b[31m", `[ping-email - ERROR]: ${message}`);
  }
}

export { Log };
