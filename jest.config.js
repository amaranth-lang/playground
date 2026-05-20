/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  extensionsToTreatAsEsm: ['.ts'],
  preset: 'ts-jest/presets/default-esm',
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        "useESM": true,
        "tsconfig": {
          "module": "esnext",
          "target": "es2020",
          "esModuleInterop": true,
          "allowSyntheticDefaultImports": true,
          "strict": false,
          "moduleResolution": "node"
        }
      }
    ]
  },
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  "bail": 1,
  "modulePathIgnorePatterns": ["<rootDir>/node_modules", "<rootDir>/dist"],
  "resetMocks": true,
  "testPathIgnorePatterns": ["/node_modules/", "/__mocks__/"]
};