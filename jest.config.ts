import { JestConfigWithTsJest } from "ts-jest/";

const config: JestConfigWithTsJest = {
  verbose: true,
  clearMocks: true,
  preset: "ts-jest",
  restoreMocks: true,
  prettierPath: null,
  testEnvironment: "node",
};

export default config;
