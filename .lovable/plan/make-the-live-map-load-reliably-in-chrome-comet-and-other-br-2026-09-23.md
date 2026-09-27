# Make the live map load reliably in Chrome, Comet and other browsers

## What I checked
- The map key is valid and accepted from mybibleatlas.com, www, bibleatlas.lovable.app, the preview and localhost (style and terrain tiles all return OK). So this is not a key or domain restriction.
- In a test Chrome browser, both the preview and the live site load the live map with no fallback.
- One real defect shows in every load: one of our own map layers has an invalid size rule ("zoom" expression in `circle-radius` used the wrong way). Mapbox reports it as an error on every load and the layer is dropped.

So the switch on your browsers comes from one of the remaining fallback triggers, most likely:
1. **Load too slow** — we give up if the map has not fully loaded within 10 seconds, even while it is still downloading (common on slower Wi-Fi, first visit, or with the style error adding work).
2. **3D graphics unavailable** — if the browser has hardware acceleration off or blocks WebGL (Comet and some Chrome setups do), the live map cannot draw at all.
3. **Blocked requests** — a privacy/ad blocker stopping map requests.

## Fix
1. **Fix the broken layer rule** so the map loads cleanly with no errors.
2. **Smarter load timeout**: keep waiting while map data is still arriving; only fall back after 10 s of no progress (hard cap ~30 s) instead of a fixed 10 s.
3. **Check 3D graphics support up front**: if the browser can't draw the live map, go straight to the offline atlas with a clear reason ("Your browser has graphics acceleration turned off") instead of trying and failing.
4. **Show why and allow retry**: the note becomes "Live map unavailable — <short reason>" with a **Try live map again** button. Retry clears the session flag and remounts the live map at the same journey stop and distance.
5. **Keep reason visible for support**: the reason is always stored (not just in debug mode), so you can tell me exactly what it says.

Unchanged: journeys, routes, playback continuity, offline atlas design, map styles, key.

## Verification
- Typecheck and tests; unit tests for the new timeout and graphics-support rules.
- Test browser: normal load (no fallback, no layer error), throttled Slow 3G (still loads live), WebGL disabled (instant offline with reason), blocked map requests (offline with reason, retry works).
- Patch release (2.17.3) with a release note. After publishing, please reload in Comet/Chrome; if it still falls back, the note will now tell us the exact reason.
