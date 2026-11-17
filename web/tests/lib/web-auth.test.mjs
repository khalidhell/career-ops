import assert from "node:assert/strict";
import { test } from "node:test";
import { checkBasicAuth } from "../../src/lib/web-auth.mjs";

const username = "careerops";
const password = "a-unique-password-with-32-chars";
const basic = (user, pass) => `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;

test("local development remains open when no credentials are configured", () => {
  assert.equal(checkBasicAuth({ production: false }), "ok");
});

test("production fails closed when credentials are missing", () => {
  assert.equal(checkBasicAuth({ production: true }), "misconfigured");
});

test("production rejects passwords shorter than 16 characters", () => {
  assert.equal(
    checkBasicAuth({ production: true, username, password: "too-short" }),
    "misconfigured",
  );
});

test("a valid Basic credential is accepted", () => {
  assert.equal(
    checkBasicAuth({ production: true, username, password, authorization: basic(username, password) }),
    "ok",
  );
});

test("missing, malformed, and incorrect credentials are rejected", () => {
  for (const authorization of [undefined, "Bearer token", "Basic !!!", basic("other", password), basic(username, "wrong")]) {
    assert.equal(
      checkBasicAuth({ production: true, username, password, authorization }),
      "unauthorized",
    );
  }
});

test("passwords may contain colons", () => {
  const passwordWithColon = "first:second:third:fourth";
  assert.equal(
    checkBasicAuth({
      production: true,
      username,
      password: passwordWithColon,
      authorization: basic(username, passwordWithColon),
    }),
    "ok",
  );
});
