# Realistic routes on every journey, then publish

Today the curved, road-following routes only cover part of the atlas. 22 of the 81 journey
segments still draw as straight lines — most of Jesus' ministry route, most of Joshua's
campaigns, the Jerusalem passion-week walk, and one leg of Paul's third journey.

## What changes

1. **Finish the route corridors** — every remaining segment gets curated waypoints along the
   real ancient roads, so no journey draws a straight line any more:

   - **Jesus' ministry (9 segments):** Nazareth to the Jordan, the wilderness, Cana,
     Capernaum, Sychar, Caesarea Philippi, down the Jordan valley to Jericho, Bethany and up
     to Jerusalem — following the Galilee ridge roads, the lake shore and the Jordan valley
     road rather than cutting across hills.
   - **Joshua's conquest (5 segments):** Ai to Shechem, Shechem to Gibeon, Makkedah, the march
     north to Hazor and back to Shiloh — along the central ridge route and the Jezreel plain.
   - **Passion week in Jerusalem (7 segments):** the Mount of Olives, the temple, the pools,
     the upper room, Gethsemane, Golgotha and the Emmaus road — walked along the city's
     gates and valleys rather than through the walls.
   - **Paul's third journey:** Antioch to Ephesus overland through the Cilician Gates and the
     Anatolian road, not across the sea.

2. **Distances update automatically** — each journey's kilometre figure is already measured
   along the drawn route, so the totals will shift to the realistic travelled distance.

3. **New version** — bump to **2.8.0** with a "What's new" entry covering today's work:
   realistic travel routes on every journey, Spanish (Reina-Valera 1909) with automatic
   device-language start, language deep links, the unified map experience from the Bible
   reader, and the map pin fix for regions and mountains.

4. **Publish** — release the update so both returning and first-time visitors get it; the
   in-app "What's new" prompt shows returning readers what changed.

## Technical notes

- Add the missing keys to `CORRIDORS` in `src/lib/atlas/corridors.ts`; existing smoothing,
  reverse-direction reuse and `segmentDistanceKm` need no change.
- Very short intra-Jerusalem walks keep a light bend only where the terrain forces it
  (Kidron valley, city gates) so the passion-week map stays readable at close zoom.
- Extend `src/lib/atlas/corridors.test.ts` with a coverage test asserting every journey
  segment resolves to a curated corridor, plus sanity bounds on Exodus, Jesus and Joshua
  totals.
- Bump `APP_VERSION` in `src/lib/version.ts` and add the 2.8.0 entry to the release notes.
- Run typecheck and the full test suite, then publish.
