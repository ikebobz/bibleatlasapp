# People section: Pharaoh, richer profiles, and a gap-filling audit

## What I found in the current People system

- People profiles are hand-written entries in one file (`src/lib/entities/copy.ts`), keyed by slug. There are 68 people today. Anything with a written entry is published and indexed; other names the reader recognises still render a page but stay out of search engines.
- A second list (the reader's name index) decides which names get highlighted while reading. It holds far more names (roughly 250 people) than have profiles.
- A person page today shows: summary, role/era, every King James verse with that name, a "where it appears" chart, and side panels for journeys, timeline moments and connections. Those side panels are matched automatically by name.
- There is **no Pharaoh** anywhere — not in profiles and not in the reader's highlighted-name list. So Pharaoh is invisible in People, in search, and while reading Exodus.
- Person pages have **no related people, no related places, and no map link** (only place pages link to the map). This is the biggest structural gap behind the "Person → Bible → Place → Map → Journey" experience the brief asks for.
- No duplicate People system exists, and no duplicate records: aliases (Abram → Abraham) already collapse into one page.

## What I'll build

### 1. A slightly richer person profile (same system, more fields)

Add optional fields to the existing person entry shape — nothing breaks for the 68 existing profiles:

- key passages (a few named references)
- Bible books where the figure appears
- related people and related places (linking to existing profile pages)
- an optional map place, so a person page can open the canonical interactive map
- an optional "what's certain vs. traditional vs. debated" note

The person page gains matching sections, styled exactly like the existing place-page cards, and a "See it on the interactive map" action that reuses the existing map (no new map code).

### 2. Pharaoh, modelled as a title rather than one man

Five entries, each honest about what Scripture actually names:

1. **Pharaoh** — the title itself: what it meant, why the Bible usually leaves him unnamed, and links to the specific ones below.
2. **Pharaoh of Joseph** — Genesis 39–50: dreams, famine, Goshen. Unnamed in Scripture; historical identification is disputed and will be labelled as such.
3. **Pharaoh of the Exodus** — Exodus 1–15: the plagues, the hardened heart, the Red Sea. Unnamed in Scripture; the popular Rameses II identification will be presented as a scholarly proposal, not a fact.
4. **Shishak** — named in 1 Kings 14 / 2 Chronicles 12; matches an Egyptian king known outside the Bible.
5. **Pharaoh Neco** — named in 2 Kings 23; killed Josiah at Megiddo.

Plus **Hophra** if the verse coverage supports a useful page. Pharaoh also joins the reader's highlighted-name list, so tapping "Pharaoh" in Exodus opens context, and it becomes searchable and deep-linkable like every other person.

Pharaoh connects outward to Joseph, Moses, Aaron, Joseph's brothers; to Egypt, Goshen, the Nile, the Red Sea; and to the Exodus journey and timeline entries already in the app.

### 3. Filling the real gaps

Audited against the reader's name list, these major figures are highlighted while reading but have **no profile**: Lot, Ishmael, Leah, Rachel, Melchizedek, Jethro, Eli, Joab, Abner, Abigail, Michal, Uriah, Hosea, Amos, Micah, Zechariah, Haggai, Malachi, Zerubbabel, Cyrus, Nebuchadnezzar, Darius, Belshazzar, Mordecai, Haman, Shadrach/Meshach/Abednego, Elizabeth, Zacchaeus, Lazarus, Martha, Nicodemus, Joseph of Arimathea, Caiaphas, Barabbas, Andrew, James, Matthew, Philip, Judas Iscariot, Silas, Titus, Luke, Mark, Apollos, Felix, Agrippa, Gamaliel, Phoebe, Naaman, Jehu, Athaliah, Jezebel's circle, Balaam, Korah, Delilah, Jael, Barak, Jephthah.

I'll write full profiles for roughly 45 of the highest-value names above (patriarchs and matriarchs, the remaining writing prophets, the named kings and emperors, the twelve, the major women, and the figures with strong geographic relevance), rather than stubbing out every name. The rest stay as they are today — readable pages, kept out of the indexed set — and I'll report them as remaining gaps.

### 4. Discovery

Pharaoh and every new profile automatically appear in the People index page, the sitemap, the people search, and the reader's highlighting, because all of those read from the same source. Nothing about translation-aware search or caching changes.

## Technical notes

- Files touched: `src/lib/entities/copy.ts` (new fields + new entries), `src/lib/entities/registry.ts` (carry the new fields through), `src/components/entities/EntityDetail.tsx` (related people/places/passages sections, person map link), `src/lib/atlas/gazetteer.ts` (add Pharaoh and any missing names), plus a small addition to the map lookup so a person can point at a place id.
- Verse listings keep using the existing concordance search; entries like "Pharaoh of the Exodus" will carry an explicit search term ("Pharaoh") so verse lists still populate, with a note on the page that the list covers all Pharaoh references.
- No new map implementation, no new data store, no route changes beyond existing `/people/$slug`.
- Verification: typecheck, the full test suite, and a browser pass over `/people`, `/people/pharaoh`, `/people/pharaoh-of-the-exodus`, an existing profile (Moses), person → map → back, and the reader highlighting Pharaoh in Exodus 5 — at phone, tablet and desktop widths.
