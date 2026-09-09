import { test } from "node:test";
import assert from "node:assert/strict";
import {
  summarizeEvidence,
  validateEvidenceDecisions,
} from "./evidence-rating";
test("calculates an equal-weight mean and rounds only the final result", () => {
  const values = validateEvidenceDecisions(
    [
      { key: "a", level: 2 },
      { key: "b", level: 3 },
    ],
    ["a", "b"],
  );
  assert.deepEqual(summarizeEvidence(values), {
    count: 2,
    mean: 2.5,
    level: 3,
  });
  assert.equal(
    summarizeEvidence([
      { key: "a", level: 1 },
      { key: "b", level: 1 },
      { key: "c", level: 2 },
    ]).level,
    1,
  );
});
test("requires all evidence, rejects duplication and stale identities", () => {
  assert.throws(() =>
    validateEvidenceDecisions([{ key: "a", level: 3 }], ["a", "b"]),
  );
  assert.throws(() =>
    validateEvidenceDecisions(
      [
        { key: "a", level: 2 },
        { key: "a", level: 3 },
      ],
      ["a", "b"],
    ),
  );
  assert.throws(() =>
    validateEvidenceDecisions([{ key: "old", level: 3 }], ["new"]),
  );
  assert.throws(() =>
    validateEvidenceDecisions([{ key: "a", level: "3" }], ["a"]),
  );
});
test("exclusions require reasons and never lower the mean; missing evidence is not level one", () => {
  const values = validateEvidenceDecisions(
    [
      {
        key: "a",
        level: null,
        reason: "Group work does not establish individual mastery.",
      },
      { key: "b", level: 3 },
    ],
    ["a", "b"],
  );
  assert.deepEqual(summarizeEvidence(values), { count: 1, mean: 3, level: 3 });
  assert.throws(() =>
    validateEvidenceDecisions([{ key: "a", level: null }], ["a"]),
  );
  assert.throws(() =>
    validateEvidenceDecisions(
      [{ key: "a", level: null, reason: "Missing" }],
      ["a"],
    ),
  );
  assert.deepEqual(summarizeEvidence([]), {
    count: 0,
    mean: null,
    level: null,
  });
});
