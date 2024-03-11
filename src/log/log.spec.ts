import { Log } from "./log";

describe("Log", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log");
    consoleSpy.mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("in debug mode", () => {
    const debugMode = true;
    let logger: Log;

    beforeEach(() => {
      logger = new Log(debugMode);
    });

    it("should log info messages", () => {
      const message = "Test info message";
      logger.info(message);

      expect(consoleSpy).toHaveBeenCalledWith(
        `[ping-email - INFO]:  ${message}`
      );
    });

    it("should log error messages", () => {
      const message = "Test error message";
      logger.error(message);

      expect(consoleSpy).toHaveBeenCalledWith(
        `[ping-email - ERROR]: ${message}`
      );
    });
  });

  describe("in non-debug mode", () => {
    const debugMode = false;
    let logger: Log;

    beforeEach(() => {
      logger = new Log(debugMode);
    });

    it("should not log info messages", () => {
      logger.info("Test info message");
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should not log error messages", () => {
      logger.error("Test error message");
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
