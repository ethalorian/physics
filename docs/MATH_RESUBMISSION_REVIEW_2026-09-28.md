# Math resubmission review — 2026-09-28

The teacher drawer required a typed reply even after choosing Ready for a fresh independent check. That left Send reply and next step disabled after checking a correction.

The drawer now provides Acknowledge & continue. Choosing a fresh independent check supplies a visible default reply; teachers can personalize it. Practice and help require specific instructions, with the missing requirement stated beside the action. The current correction or help request appears first; the original submission remains available below the previous feedback. A retry clears the previous save-error message.

Acknowledgment uses the existing roster-scoped revision endpoint and does not create a new fluency rating. Existing ratings and XP behavior are unchanged. The route test fixture now mocks the existing XP-status dependency, which previously stopped unrelated route tests before they reached revision checks.

Verification: 18 math route checks; full TypeScript and scoped ESLint; style/brand checks; browser testing with synthetic students. Covered restored blank-note fresh-check draft, default reply, required help instructions, failed-save retry, same-student next response, normal rating, next-student gate, final queue completion, correction-first rendering, and no console errors. Verified two acknowledgment writes and only one rating write for the separate independent task. No live student reviews were submitted during testing.
