
import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: ["**/node_modules/", "dist/"],
  plugins: ["typescript", "import"],
  categories: {
    correctness: "error"
  },
  rules: {},
  env: {
    builtin: true
  }
});
