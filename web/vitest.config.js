// Unit tests for the pure logic (tests/*.test.js). The browser tests in tests/e2e/ run with Playwright.
import { defineConfig } from "vitest/config";

export default defineConfig({ test: { include: ["tests/*.test.js"], environment: "node" } });
