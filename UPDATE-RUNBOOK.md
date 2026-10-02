# Archive updater

## Publication contract

`data/articles.json` is the sole complete catalog. `data/daily.json` is the sole current collection record. Dated additions files are historical evidence only: neither the browser nor the build discovers new content through filenames. Preserve article slugs and existing URLs. Never silently replace an adopted illustration.

Run research once daily at the user's agreed schedule. Research and editorial judgment use the existing connected assistant; do not add paid APIs or credentials. The deterministic scripts in this repository build and validate artifacts; they do not autonomously perform research.

## Research and editorial gate

- Read EDITORIAL.md and current user instructions. The requested cadence is one update run per day. Select only a few strong candidates, with no minimum article count or field quota; zero is acceptable. Avoid redundant recent topics and overwhelming the reader with volume.
- The core goal is to stimulate the user's broad intellectual curiosity with surprising, substantial and reliable reading. Impose no domain boundaries, field quotas, mandatory mechanisms/abstraction, design transfer or usefulness-for-work criteria. Odd facts, history, practices, human stories, arts, the natural world and any other field can qualify.
- Mechanisms, counterfactuals and cross-domain analogies are optional tools when they suit the source. Do not force identical headings, a takeaway template, or a legaltech/AI connection. Distinguish editorial speculation or transfer hypotheses from the source author's claims.
- Broaden discovery entrances when recent choices cluster: do not search only the citation neighborhoods of existing AI, software, or organization articles. Archives, first-person records, museums, specialist food writing, natural history, arts, sport, and other sources are possible entrances, never a rotation or quota. Mechanisms, law, and AI remain eligible; breadth is freedom, not a topic ban. Do not impose a practical ending or a common pattern inferred from a single example.
- Search primary sources broadly; record actual candidates and why the selected source adds value. Normalize arXiv IDs/DOIs/source titles and compare existing articles, including older backlog, before selection.
- Read the full primary source. Check key claims, numbers, counterarguments, methods and scope. Clearly separate the author's claims, editorial explanation and original illustrative examples.
- Produce a substantial Japanese explanation matching existing long-form articles. Avoid padding and unexplained English/Japanese mixtures. Reading time must reflect the actual article, not an aspirational target.
- Reuse a recovered, reviewed draft where useful. Do not present unfinished drafts or invented collection totals as completed work.
- Use one adopted generated image, concrete and visually interesting in the established first-five illustration style. No simplistic SVG substitutions. Reuse the same adopted image for the article, featured/index data, OGP and Twitter image; render and visually inspect it. Keep originals; use the verified PNG or an explicitly authorized optimized derivative without regenerating a second interpretation.
- If evidence or image generation is blocked, retain a draft and report that blocker. Do not publish placeholders or call it a successful update.

## Atomic delivery

1. Read the latest main SHA and obtain a complete current snapshot. Never force-update the branch.
2. Prepare one locally reviewable change set. Use a review branch when review is required; when direct publication is explicitly authorized, do not invent a PR requirement. Update the approved article, adopted image, full catalog and daily record as one change set. Clear previous featured flags; select exactly one current featured item (or none on a zero-adoption day).
3. Run `node scripts/sync-images.cjs`, `node scripts/build-index.cjs`, `node --test tests/*.test.cjs`, `node scripts/validate.cjs`, and `node --check assets/app.js`. Rebuild again and verify no changes. Check rendered desktop/mobile pages, search, filters, favorites/read status and no-JavaScript fallback.
4. Check every new/changed image and local article link, all metadata paths and external source URLs. The full image gate must use real checked-out assets; a tree-only audit is not a full validation pass.
5. Commit all files atomically, including image bytes, using the permitted Git object APIs or a supported executor. Before creating the tree, compare every returned blob SHA with the locally calculated Git blob SHA of the complete intended bytes. Never accept truncated tool output as a complete binary. The execution output transport can clip around 1 MiB of text; bound serialized segments well below that size (for example 350,000 base64 characters using `node scripts/export-blob.cjs <path> <offset>`), concatenate the returned `content` segments in `offset` order, check each segment length and the reassembled `totalCharacters`, and require the returned Git SHA to match. If serialization is truncated, read bounded chunks and reassemble before retrying the same allowed blob operation. Stop on any unexplained SHA mismatch. Base the new commit on the verified current SHA and use non-force ref updates. If main moved, reload and reapply, then rerun checks. A 403/connector safety denial is a blocker to report, not a reason to swap routes.
6. Publish/merge only within the user's authorization. A branch or draft PR alone is not a deployed update.
7. Wait for Pages for that exact commit. Check the actual public site: latest date/title, new article URL, canonical catalog count and decoded image dimensions. Compare published content with the intended commit. Only then report published success with article/site links.

## Retry and observability

- Idempotency key: selected source's stable identifier plus publication date. A retry must not append another copy or regenerate an adopted image.
- Distinguish: researched, draft ready, validation passed, committed, deployed, public-site verified. Record real timestamps and verified SHAs, not a single optimistic 'updated' status.
- One publication writer at a time. Do not leave partial per-file writes on main.
- If GitHub accepts content but Pages fails, diagnose the exact run and retry only the failed stage; do not regenerate research/images.
- If no candidate meets the quality bar, report that result accurately and keep the latest successful publication visible. Do not advance its date as though content was added.
- Preserve existing read/favorite local-storage keys and notes behavior during infrastructure changes.

## Known migration notes

The older catalog contained only 16 articles while browser JavaScript assembled 79 using hard-coded dated feeds. The repaired catalog keeps the existing browser precedence for duplicate slugs and regenerates the static table from the same data. Existing `data/additions*.json` and `data/daily-current.json` are preserved for history, but are no longer runtime dependencies.
