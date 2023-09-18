module.exports = {
  extends: [
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  plugins: [
    "import",
    "unused-imports"
  ],
  ignorePatterns: [
    "packages/**/dist/**",
    "examples/**/dist/**",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "unused-imports/no-unused-imports": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "import/order": [
      2,
      {
        alphabetize: {
          order: "asc"
        }
      }
    ],
    "import/no-default-export": "error"
  },
  overrides: [
    {
      files: [
        "./examples/with-next/**",
        "./examples/*/vite.config.*"
      ],
    },
    {
      files: [
        "./**/**.{js,jsx,ts,tsx}"
      ],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "import/no-default-export": "off"
      }
    }
  ]
};
