module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^katex/dist/katex.min.css$": "<rootDir>/libraries/__mocks__/style-mock.js",
    "^expo-file-system$": "<rootDir>/libraries/__mocks__/expo-file-system.js",
    "^expo-document-picker$": "<rootDir>/libraries/__mocks__/expo-document-picker.js",
  },
};
