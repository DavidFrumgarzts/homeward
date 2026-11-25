// Loads a file from shared/test-vectors/ (format in its README.md): the same cases Android and iOS run.
import { readFileSync } from "node:fs";

export const shared = (path) => JSON.parse(readFileSync(new URL(`../../shared/${path}`, import.meta.url), "utf8"));
export const vectors = (name) => shared(`test-vectors/${name}`).cases;
