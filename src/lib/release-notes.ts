/**
 * Versioned release notes for Bible Atlas.
 *
 * Newest release first. `version` values are compared with `compareVersions`,
 * so they must stay simple dotted numbers (e.g. "1.7.0").
 */

export type ReleaseIcon =
  | "book"
  | "sparkles"
  | "map"
  | "network"
  | "box"
  | "scale"
  | "search"
  | "languages"
  | "bookType"
  | "cloudOff"
  | "highlighter"
  | "bell"
  | "stethoscope"
  | "settings"
  | "waypoints"
  | "headphones";

export type ReleaseItem = {
  icon: ReleaseIcon;
  title: string;
  description: string;
  link?: { to: string; label: string };
};

export type Release = {
  version: string;
  /** ISO date, used for display only. */
  date: string;
  title: string;
  summary: string;
  items: ReleaseItem[];
};

export const RELEASES: Release[] = [
  {
    version: "2.17.3",
    date: "2026-09-23",
    title: "A more dependable live map",
    summary: "The live map now loads on more browsers and slower connections.",
    items: [
      { icon: "map", title: "Waits while the map is still arriving", description: "On slower connections the live map keeps loading instead of switching to the offline atlas too soon." },
      { icon: "stethoscope", title: "Clear reason and a retry button", description: "If the live map can't start, you'll see why, and can tap Try live map again without losing your place." },
    ],
  },
  {
    version: "2.17.2",
    date: "2026-09-23",
    title: "Why Samaria mattered",
    summary: "Jesus’ route through Samaria can now be compared with the debated eastern alternative, with clearer framing on every screen.",
    items: [
      { icon: "waypoints", title: "Two routes, one clear story", description: "See Jesus’ direct route through Samaria beside a quieter Jordan Valley and Perea comparison, carefully labelled as historical interpretation." },
      { icon: "map", title: "A map that keeps the whole journey in view", description: "The map now responds to open cards, screen rotation and changing screen sizes without clipping important stops or either route." },
    ],
  },
  {
    version: "2.17.1",
    date: "2026-09-23",
    title: "Journeys keep playing on the live map",
    summary: "Journey playback no longer drops to the offline atlas partway through or restarts from the beginning.",
    items: [
      { icon: "map", title: "The live map stays put", description: "Slow or missing map pieces no longer switch you to the offline atlas; it only takes over when the live map genuinely can't load." },
      { icon: "waypoints", title: "No lost progress", description: "If the offline atlas does take over, the journey carries on from the same stop and distance, and it says so with a small note." },
    ],
  },
  {
    version: "2.17.0",
    date: "2026-09-23",
    title: "Journeys become stories you can follow",
    summary: "Four new journeys join a redesigned visual library, with richer stop-by-stop geography and Scripture context.",
    items: [
      { icon: "waypoints", title: "Eleven biblical journeys", description: "Explore Jesus through Samaria, the seven churches of Revelation, Israel's forty wilderness years and Jacob's transforming journey alongside all seven existing routes.", link: { to: "/journeys", label: "Explore journeys" } },
      { icon: "map", title: "A visual journey library", description: "Featured journeys, meaningful categories, preview maps, passages, people, stops and distances make it easier to choose where to begin." },
      { icon: "book", title: "More story at every stop", description: "Journey pages now explain why the geography matters and show timing, uncertainty and unlocated wilderness stations without inventing precision." },
    ],
  },
  {
    version: "2.16.1",
    date: "2026-09-23",
    title: "Always up to date, audio that keeps playing",
    summary: "Devices now move to the newest version on their own, and chapter audio no longer fails on an expired link.",
    items: [
      { icon: "sparkles", title: "Updates arrive by themselves", description: "Phones and computers switch to the latest Bible Atlas the next time you open it or change page, so nobody gets stuck on an old version. The version number now shows in Reading settings." },
      { icon: "headphones", title: "Audio that plays every time", description: "Fixed chapters such as Philemon sometimes refusing to play. Expired audio links are replaced automatically." },
    ],
  },
  {
    version: "2.16.0",
    date: "2026-09-23",
    title: "One way to find any book",
    summary: "The phone menu that duplicated the chapter picker is gone, and the picker itself learned everything it could do.",
    items: [
      { icon: "book", title: "One book list, not two", description: "On a phone or tablet the top-left menu is gone. The bar at the bottom of the page is now the single way to jump to any book or chapter." },
      { icon: "search", title: "Find a book", description: "Type in the picker to find a book, including short forms like “1 sam”, “ps” or “song of songs”." },
      { icon: "bookType", title: "Grouped by section", description: "Books are grouped under Law, History, Wisdom & Poetry, Prophets, Gospels & Acts, Letters and Apocalyptic." },
      { icon: "cloudOff", title: "Clearer offline marking", description: "Chapters that aren’t saved on your device are greyed out and say so, instead of only showing a dot when they are." },
    ],
  },
  {
    version: "2.15.0",

    date: "2026-09-22",
    title: "Easier to find, in every language",
    summary: "Bible chapters now have their own address in each language, every journey has a readable route, and family trees get their own pages.",
    items: [
      { icon: "languages", title: "Addresses for each language", description: "Yoruba, Igbo, French, German, Portuguese, Spanish, Chinese, Dutch and Russian chapters now open at their own link, such as /yo/genesis/1." },
      { icon: "map", title: "A page for each journey", description: "Paul's first, second and third journeys and the voyage to Rome each have their own map page, with every stop, verse and distance listed under the map." },
      { icon: "network", title: "Family tree pages", description: "Adam, Abraham and Joseph now have a family tree page linked from their profile." },
      { icon: "sparkles", title: "Faster map pages", description: "Map pages load with less to download, and the drawn map appears as soon as the page opens." },
    ],
  },
  {
    version: "2.14.0",
    date: "2026-09-22",
    title: "A clearer first step",
    summary: "New readers get a short welcome, and every section has a quick way back to your chapter.",
    items: [
      { icon: "sparkles", title: "Welcome for new readers", description: "A one-time card explains what Bible Atlas is and where to start — maps, what's inside, or just reading." },
      { icon: "book", title: "Back to reading from anywhere", description: "The Read link at the top of People, Places, Timeline and Concordance returns you to the chapter you were on." },
      { icon: "map", title: "Tidier pages", description: "Place and person pages no longer repeat the same map link, and the reader header stays on one line on small phones." },
    ],
  },
  {
    version: "2.13.0",
    date: "2026-09-22",
    title: "Move through Scripture faster",
    summary: "A slim chapter bar now sits at the bottom of every chapter, with a quick book and chapter picker.",
    items: [
      {
        icon: "book",
        title: "Previous, current, next",
        description:
          "Tap the arrows to step chapters — across books too — or swipe left and right on the text. Tap the chapter name to jump anywhere in two taps.",
      },
    ],
  },
  {
    version: "2.12.0",
    date: "2026-09-21",
    title: "Saved maps you can trust",
    summary:
      "Saving a map now downloads everything the map really needs, checks it can be read back, and says plainly whether it worked.",
    items: [
      {
        icon: "cloudOff",
        title: "An honest Save Map",
        description:
          "The button moves through Preparing, Downloading, Finishing, Verifying and then Saved Offline — and if anything is missing it says Download failed, with a Retry that only fetches the gaps.",
        link: { to: "/maps", label: "Open the map" },
      },
      {
        icon: "map",
        title: "Everything a map needs",
        description:
          "Labels, icons and map text are now saved alongside the map imagery, so a saved area draws properly rather than coming up blank.",
      },
      {
        icon: "settings",
        title: "Saved maps, listed",
        description:
          "A small Saved maps panel shows each saved area, its size, the day it was saved and whether it is genuinely available, with a Remove button.",
      },
    ],
  },
  {
    version: "2.11.0",
    date: "2026-09-21",
    title: "Pharaoh, and a fuller cast",
    summary:
      "The people section grew by more than fifty figures, Pharaoh included, and every profile now links out to the passages, people, places and maps around it.",
    items: [
      {
        icon: "book",
        title: "Pharaoh, handled honestly",
        description:
          "Pharaoh is a title, not one man, so there are now pages for the title itself, the king who raised Joseph, the king who faced Moses, and the named kings Shishak and Neco — each clear about what Scripture states and what is only proposed.",
        link: { to: "/people/pharaoh", label: "Read Pharaoh" },
      },
      {
        icon: "sparkles",
        title: "Fifty more people",
        description:
          "Lot, Leah, Rachel, Melchizedek, Jethro, Joab, Abigail, Naaman, Cyrus, Nebuchadnezzar, Elizabeth, Lazarus, Nicodemus, Andrew, Matthew, Luke, Mark, Apollos, Phoebe and many more now have written profiles.",
        link: { to: "/people", label: "Browse people" },
      },
      {
        icon: "map",
        title: "Person, passage, place, map",
        description:
          "Profiles now carry key passages, related people and places, and a link straight onto the interactive map — with a back control that names where you came from.",
      },
    ],
  },
  {
    version: "2.10.0",
    date: "2026-09-21",
    title: "Clearer, calmer exploration",
    summary:
      "Maps now explain their routes at a glance, while dialogs, mobile notices, page states and entity browsing are clearer and more accessible.",
    items: [
      {
        icon: "map",
        title: "A legend for every journey",
        description:
          "A compact map legend now explains travelled and upcoming routes, walking and sailing segments, stop markers, selected places and the difference between well-attested, approximate and schematic paths.",
        link: { to: "/maps", label: "Open the maps" },
      },
      {
        icon: "settings",
        title: "Better keyboard and screen-reader support",
        description:
          "Search, installation guidance, book navigation and contextual panels now manage focus more reliably, with larger controls and clearer status announcements across the app.",
      },
      {
        icon: "cloudOff",
        title: "Mobile notices that never compete",
        description:
          "Update, installation and offline-download notices now take turns and stay clear of the audio player, including on phones with safe-area insets.",
      },
      {
        icon: "book",
        title: "Cleaner browsing and page states",
        description:
          "People, places and verse results are more compact on phones, with more consistent loading, empty, offline and retry messages.",
      },
    ],
  },
  {
    version: "2.9.0",
    date: "2026-09-21",
    title: "Follow the journey",
    summary:
      "Journey maps now follow each route segment across the land and sea, with clearer historical uncertainty and smarter framing on phones.",
    items: [
      {
        icon: "waypoints",
        title: "A route you can follow",
        description:
          "Walking and sailing legs are shown as distinct, restrained paths that progress from stop to stop along plausible ancient corridors.",
        link: { to: "/maps", label: "Follow a journey" },
      },
      {
        icon: "map",
        title: "Cleaner mobile storytelling",
        description:
          "The camera now frames the complete route and each active segment around the map cards, with closer views for short journeys and wider context for long ones.",
        link: { to: "/maps", label: "Open the maps" },
      },
    ],
  },
  {
    version: "2.8.0",
    date: "2026-09-21",
    title: "Real travel routes and your own language",
    summary:
      "Every journey now follows the roads and sea lanes people actually travelled, the Bible reader and the maps share one map experience, and first-time readers start in their device's language.",
    items: [
      {
        icon: "waypoints",
        title: "Journeys follow the real roads",
        description:
          "The Exodus, Jesus' ministry, Joshua's campaigns, passion week and all of Paul's travels now curve along the historic routes instead of straight lines, with distances measured along the way.",
        link: { to: "/maps", label: "Follow a journey" },
      },
      {
        icon: "map",
        title: "One map everywhere",
        description:
          "Tap a place while reading and it opens on the full map, centred and pinned, with nearby places and a button back to the passage you came from.",
        link: { to: "/maps", label: "Open the maps" },
      },
      {
        icon: "languages",
        title: "Spanish, and your device's language",
        description:
          "Reina-Valera 1909 joins the free translations, and a first visit starts in your device's language when a Bible is available for it.",
        link: { to: "/genesis/1", label: "Start reading" },
      },
      {
        icon: "search",
        title: "Language links",
        description:
          "Share a chapter in any language by adding ?lang= to the link — for example /genesis/12?lang=es opens the Spanish Bible.",
      },
    ],
  },
  {
    version: "2.7.0",
    date: "2026-09-19",
    title: "Real geography maps",
    summary:
      "The maps now show the actual land of the Bible — mountains, valleys, coastlines and rivers — with every journey drawn end to end, and the whole map can be saved for offline use.",
    items: [
      {
        icon: "map",
        title: "Real terrain, satellite and 3D",
        description:
          "Switch between a topographic view, satellite imagery and a 3D terrain view to see the hills and valleys the stories actually crossed.",
        link: { to: "/maps", label: "Open the maps" },
      },
      {
        icon: "waypoints",
        title: "See the journey at a glance",
        description:
          "Each journey draws its route line and numbered stops the moment the map opens, so you can follow the whole path from start to finish.",
        link: { to: "/maps", label: "Follow a journey" },
      },
      {
        icon: "cloudOff",
        title: "Save the map for offline",
        description:
          "Download the biblical world once and keep exploring with no connection, just like the offline Bible downloads.",
        link: { to: "/maps", label: "Save the map" },
      },
    ],
  },
  {

    version: "2.6.0",
    date: "2026-08-22",
    title: "Audio that follows your translation",
    summary:
      "Listening now matches whatever version you're reading — full-Bible narration on the NIV, a multi-voice dramatization on the WEB, and clear badges showing which versions you can listen to.",
    items: [
      {
        icon: "headphones",
        title: "Full-Bible audio (NIV)",
        description:
          "Complete Scripture narration by David Suchet, from Genesis 1 to Revelation 22.",
        link: { to: "/genesis/1", label: "Listen to Genesis 1" },
      },
      {
        icon: "sparkles",
        title: "Dramatized audio (WEB)",
        description:
          "A multi-voice New Testament dramatization with narration, characters, and sound.",
        link: { to: "/john/3/16", label: "Listen to John 3" },
      },
      {
        icon: "languages",
        title: "Dynamic translation sync",
        description:
          "The player automatically switches to the audio that matches the translation on screen, and tells you when a version has no audio.",
      },
      {
        icon: "settings",
        title: "Audio badges in the version picker",
        description:
          "Headphone badges make it easy to spot which versions you can listen to. Playback now starts only when you press play, then keeps rolling chapter after chapter while Autoplay is on.",
      },
    ],
  },
  {
    version: "2.5.0",
    date: "2026-08-22",
    title: "Audio Bible",
    summary:
      "Listen to the New Testament as a dramatic audio Bible while you read — autoplay, speed control, and chapter-by-chapter navigation included.",
    items: [
      {
        icon: "headphones",
        title: "Drama New Testament audio",
        description:
          "A fixed audio player appears at the bottom of the screen whenever you open a New Testament chapter. It streams the dramatic World English Bible New Testament reading through API.Bible.",
        link: { to: "/john/3/16", label: "Listen to John 3:16" },
      },
      {
        icon: "settings",
        title: "Full playback controls",
        description:
          "Play and pause, skip forward or backward 15 seconds, drag the scrubber, change playback speed (1×, 1.25×, 1.5×), and mute — all without leaving the reader.",
      },
      {
        icon: "book",
        title: "Auto-advance to the next chapter",
        description:
          "When a track ends, the player automatically moves to the next chapter (e.g., John 3 → John 4). At the end of a book, it continues with chapter 1 of the next New Testament book, stopping after Revelation 22. Turn off Autoplay in the player if you prefer to stay in one place.",
      },
    ],
  },
  {
    version: "2.4.0",
    date: "2026-08-22",
    title: "New: Yoruba and Igbo Bible translations",
    summary:
      "Bible Atlas now supports Yoruba and Igbo Bible translations, making Scripture more accessible to more readers.",
    items: [
      {
        icon: "languages",
        title: "New: Yoruba and Igbo Bible translations",
        description:
          "Bible Atlas now supports Yoruba and Igbo Bible translations, making Scripture more accessible to more readers. You can switch languages directly from the Bible reader while keeping your current book, chapter, and verse.",
        link: { to: "/john/3/16", label: "Read John 3:16" },
      },
      {
        icon: "cloudOff",
        title: "Openly licensed, so they work offline too",
        description:
          "Both editions come from Biblica under a Creative Commons BY-SA 4.0 licence, so they can be saved for offline reading like the public-domain versions. The required attribution appears under each chapter and on the About page.",
      },
    ],
  },
  {
    version: "2.3.0",
    date: "2026-08-20",
    title: "More Bible translations",
    summary: "NIV and The Message join the reader, alongside 14 free translations.",
    items: [
      {
        icon: "bookType",
        title: "NIV and The Message",
        description:
          "Two licensed translations are now available in the version picker: the New International Version (2011) and The Message. Switch versions from the badge in the header and keep every map, person and connection in place.",
        link: { to: "/john/3/16", label: "Read John 3:16" },
      },

      {
        icon: "languages",
        title: "A simpler version picker",
        description:
          "The picker now lists each translation by name and abbreviation, grouped by language, so choosing a version takes one glance. Licensed versions read online only; the public-domain texts still download for offline reading.",
      },
    ],
  },
  {

    version: "2.2.0",
    date: "2026-08-14",
    title: "Concordance",
    summary: "Search any word in the Bible and see every verse it appears in.",
    items: [
      {
        icon: "search",
        title: "Word search across all 66 books",
        description:
          "The new concordance indexes the whole King James Version. Search a word and see every verse that contains it, with counts by book and testament, and filters for the Old or New Testament.",
        link: { to: "/concordance", label: "Open the concordance" },
      },
      {
        icon: "map",
        title: "Words connected to the Atlas",
        description:
          "Where a word is a person, place or journey, the results page carries the maps, timeline moments and thematic connections beside it — and every verse opens in the reader with its context panels intact.",
      },
    ],
  },
  {
    version: "2.1.0",
    date: "2026-08-07",
    title: "Direct verse selection",
    summary: "Jump straight to any verse — book, chapter and verse in seconds.",
    items: [
      {
        icon: "search",
        title: "Verse picking inside the chapter selector",
        description:
          "Verse selection now lives inside the book navigator. Open the book list, pick a book, tap a chapter and choose the exact verse — only verses that actually exist are offered.",
        link: { to: "/john/4/4", label: "Open John 4:4" },
      },
      {
        icon: "waypoints",
        title: "Permanent verse links",
        description:
          "Every verse now has its own address, like /john/4/4. Shared links open the chapter, highlight the verse and keep all the maps, people and connections in place. Existing links still work.",
      },
    ],
  },
  {
    version: "1.8.0",
    date: "2026-08-02",
    title: "Release notes",
    summary: "Bible Atlas now tells you what changed since your last visit.",
    items: [
      {
        icon: "sparkles",
        title: "Versioned release notes",
        description:
          "Every update is now recorded with a version and date. Anything released since your last visit is grouped at the top of this page so you never miss a new feature.",
      },
      {
        icon: "bell",
        title: "New-feature indicator",
        description:
          "A dot appears on the settings gear when there are updates you haven't seen, and a dismissible banner in the reader links straight to the notes.",
      },
    ],
  },
  {
    version: "1.7.0",
    date: "2026-08-02",
    title: "Daily verse, refined",
    summary: "Choose your delivery time and diagnose notification problems in-app.",
    items: [
      {
        icon: "bell",
        title: "Daily verse push notifications",
        description:
          "Get one verse a day delivered to your device. Readings follow the church calendar through Advent, Lent, Holy Week, Eastertide and Pentecost.",
      },
      {
        icon: "sparkles",
        title: "Choose your delivery time",
        description:
          "Pick the hour and minute that works for you. Delivery times are stored per device and respect your local timezone.",
      },
      {
        icon: "stethoscope",
        title: "Notification diagnostics",
        description:
          "Run an in-app diagnostic report to see your browser's permission state, service-worker health and subscription status, with clear next steps when something is blocked.",
      },
    ],
  },
  {
    version: "1.6.0",
    date: "2026-08-02",
    title: "Settings that stick",
    summary: "Bible versions, KJV by default, and preferences restored before the page paints.",
    items: [
      {
        icon: "bookType",
        title: "Bible version switcher",
        description:
          "Choose between public-domain translations: King James Version (KJV), American Standard Version (ASV), and World English Bible (WEB). KJV is the default.",
        link: { to: "/genesis/1", label: "Try it in Genesis 1" },
      },
      {
        icon: "settings",
        title: "Persistent, instant settings",
        description:
          "Text size, line spacing, theme, original-language mode, Bible version and notification time are saved immediately and restored before the page paints.",
      },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-08-01",
    title: "Read anywhere",
    summary: "Save books to your device and keep reading without a network.",
    items: [
      {
        icon: "cloudOff",
        title: "Offline reading mode",
        description:
          "Save individual books to your device and keep reading when the network disappears. Saved chapters and opened context panels remain available offline.",
      },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-08-01",
    title: "Search and original languages",
    summary: "Find any verse, and look behind the English into Hebrew and Greek.",
    items: [
      {
        icon: "search",
        title: "Search the whole Bible",
        description:
          "Search by keyword or jump straight to a reference like John 3:16. Results take you directly to the verse and highlight the matching text.",
      },
      {
        icon: "languages",
        title: "Original languages layer",
        description:
          "Tap any word while reading to see the Hebrew or Greek behind it: transliteration, pronunciation, root word, meaning range, related words and other occurrences.",
      },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-07-31",
    title: "Threads and highlights",
    summary: "Trace themes across Scripture and colour-code the verses that matter to you.",
    items: [
      {
        icon: "network",
        title: "Threads — thematic connections",
        description:
          "Discover how Scripture themes echo across the Bible. Explore links like Passover → Last Supper, Abraham and Isaac → the cross, and Melchizedek → Hebrews on an interactive graph.",
        link: { to: "/connections", label: "Explore connections" },
      },
      {
        icon: "highlighter",
        title: "Verse highlighting",
        description:
          "Tap any verse number while reading to colour-code it. Your highlights are saved on this device and gathered on a personal highlights page.",
        link: { to: "/highlights", label: "View my highlights" },
      },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-07-31",
    title: "Objects and economy",
    summary: "Explore artifacts in 3D and convert biblical weights, lengths and currency.",
    items: [
      {
        icon: "box",
        title: "Interactive 3D artifacts",
        description:
          "Objects like the Ark, Menorah, Temple veil, Roman cross, Tabernacle and scrolls are now explorable. Each includes measurements, materials, construction notes and purpose.",
      },
      {
        icon: "scale",
        title: "Biblical economy converter",
        description:
          "Tap weights, lengths and currencies such as denarius, talent, cubit or shekel to convert them into modern USD and metric equivalents.",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-07-30",
    title: "Maps with a Today layer",
    summary: "See where events happened in today's world.",
    items: [
      {
        icon: "map",
        title: "Interactive maps with a Today layer",
        description:
          "Biblical places appear as tappable references. Maps overlay modern borders and names on top of ancient geography so you can see where events happened in today's world.",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-07-30",
    title: "The whole Bible",
    summary: "All 66 books, readable with context in place.",
    items: [
      {
        icon: "book",
        title: "Complete Bible canon",
        description:
          "Bible Atlas covers all 66 books of the Protestant canon, from Genesis to Revelation. Every chapter is available to read and explore.",
      },
    ],
  },
];

/**
 * Last release that shipped before the versioned release-notes system existed.
 * Readers who used Bible Atlas before then are backdated to this version so the
 * newer entries still register as unseen.
 */
export const PRE_NOTES_VERSION = "1.7.0";

export function latestVersion(): string {
  return RELEASES[0]?.version ?? "0.0.0";
}


export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

/** Releases strictly newer than `version`. Pass null for "everything". */
export function releasesSince(version: string | null): Release[] {
  if (!version) return RELEASES;
  return RELEASES.filter((r) => compareVersions(r.version, version) > 0);
}

export function countItems(releases: Release[]): number {
  return releases.reduce((total, r) => total + r.items.length, 0);
}
