# Presentation responsiveness

The iPad saves commands through the existing authenticated API. A database trigger emits a data-free Realtime notification after commit. The Mac immediately reads the small, owner-authorized session endpoint and applies the slide on the next React effect. Notifications are hints only: their payload is never interpreted as a command. The channel carries no lesson, roster, response, or private-note data. Supabase may attach a generated message ID.

The durable session is the source of truth. A monotonically increasing command_revision prevents older HTTP responses from undoing a newer command. The same connection is shared by hooks on each device, resubscribes after connection loss, and closes on unmount. Polling and online/visibility refresh recover missed messages. Reads coalesce while a request is pending. When connected and no poll is open, the full session poll slows to five seconds. Open poll totals retain their 1.5-second refresh cadence. A lost live connection immediately resumes polling.

Slide/blackout/timer commands retain all class/publication/track checks, but skip transfer-task hydration. Projected blocks still hydrate their content for screen pagination. Graphs retain the one-screen rule. Decks stay in a separate window (P-2); evidence/mastery paths are unchanged (P-5, M-1).

Configuration uses the same NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY as the app. No new key, service-role exposure, custom user JWT, or cross-project integration setting is needed. The two presentation_realtime migrations must be applied before the application deploy; an unavailable channel falls back to polling.

Verification:
- node scripts/test-presentation-tools-api.cjs
- SNAPPY=1 node scripts/test-presentation-tools-browser.cjs
- LAPTOP_HANDOFF=1 node scripts/test-presentation-tools-browser.cjs

The responsiveness fixture includes a 100ms command-write delay and separate iPad/projector browser contexts. Its measurements are controlled test timings, not a guarantee for classroom Wi-Fi. Validate the deployed site on the classroom devices after deployment.
