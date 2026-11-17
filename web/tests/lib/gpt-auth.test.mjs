import assert from "node:assert/strict";
import { test } from "node:test";
import { checkBearerApiKey } from "../../src/lib/gpt-auth.mjs";

const apiKey = "a".repeat(48);

test("production refuses a missing or short GPT API key", () => {
  assert.equal(checkBearerApiKey({ production: true }), "misconfigured");
  assert.equal(checkBearerApiKey({ production: true, apiKey: "short" }), "misconfigured");
});

test("the configured bearer key is accepted", () => {
  assert.equal(checkBearerApiKey({ production: true, apiKey, authorization: `Bearer ${apiKey}` }), "ok");
});

test("missing, wrong-scheme, and incorrect keys are rejected", () => {
  for (const authorization of [undefined, `Basic ${apiKey}`, "Bearer wrong"]) {
    assert.equal(checkBearerApiKey({ production: true, apiKey, authorization }), "unauthorized");
  }
});
