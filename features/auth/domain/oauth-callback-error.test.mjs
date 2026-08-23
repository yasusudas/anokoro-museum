import assert from "node:assert/strict";
import test from "node:test";

import { getOAuthProviderErrorKind } from "./oauth-callback-error.ts";

test("errorがない場合はプロバイダ側エラーなしとして扱う", () => {
  assert.equal(getOAuthProviderErrorKind(null), "none");
  assert.equal(getOAuthProviderErrorKind(undefined), "none");
  assert.equal(getOAuthProviderErrorKind(""), "none");
});

test("access_deniedは利用者による中断として扱う", () => {
  assert.equal(getOAuthProviderErrorKind("access_denied"), "cancelled");
});

test("その他のerrorは失敗として扱う", () => {
  assert.equal(getOAuthProviderErrorKind("server_error"), "failed");
  assert.equal(getOAuthProviderErrorKind("invalid_request"), "failed");
  assert.equal(getOAuthProviderErrorKind("<script>alert(1)</script>"), "failed");
});
