# Public spectator engine

`engine.cjs` is the previously extracted public Triangle Arena spectator core,
copied without semantic changes from the research archive. Source application:
https://triangle-arena.vercel.zone/e/code-talks-2026 . Extracted on 2026-11-05.
It contains the replay engine and geometry, not the server-side bot helper SDK.
Minified internal names and the original scoring/phase/power-up logic are retained.

`../instrument-engine.cjs` adds read-only observation callbacks at checked anchors.
The analyzer never changes moves, scores, ownership or random inputs. Every
published replay analysis is gated on reproducing all three scores and ranking.
Unexpected engine drift causes rejection, not approximate published metrics.

Engine and analyzer SHA-256 fingerprints are embedded in each metric report.
The archived source is used for replay reconstruction only. No claim of original
authorship or ownership of this upstream game engine is made.
