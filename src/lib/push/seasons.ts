/**
 * Church-season readings.
 *
 * When today falls inside a season, its themed reading replaces the mirrored
 * daily reference. Every day of every season has a reading; lists cycle if a
 * season runs longer than its list.
 */

export type SeasonReading = { title: string; ref: string };

export type SeasonId = "advent" | "christmas" | "lent" | "holy-week" | "eastertide" | "pentecost";

export const SEASON_LABEL: Record<SeasonId, string> = {
  advent: "Advent",
  christmas: "Christmastide",
  lent: "Lent",
  "holy-week": "Holy Week",
  eastertide: "Eastertide",
  pentecost: "Pentecost",
};

const READINGS: Record<SeasonId, SeasonReading[]> = {
  advent: [
    { title: "A shoot from the stump", ref: "Isaiah 11:1" },
    { title: "Unto us a child is born", ref: "Isaiah 9:6" },
    { title: "The people in darkness", ref: "Isaiah 9:2" },
    { title: "Comfort my people", ref: "Isaiah 40:1" },
    { title: "Prepare the way", ref: "Isaiah 40:3" },
    { title: "O little town of Bethlehem", ref: "Micah 5:2" },
    { title: "The virgin shall conceive", ref: "Isaiah 7:14" },
    { title: "The Lord is coming", ref: "Malachi 3:1" },
    { title: "Zechariah's silence", ref: "Luke 1:13" },
    { title: "Nothing is impossible", ref: "Luke 1:37" },
    { title: "Let it be to me", ref: "Luke 1:38" },
    { title: "Mary's song", ref: "Luke 1:46" },
    { title: "The tender mercy of our God", ref: "Luke 1:78" },
    { title: "Joseph's dream", ref: "Matthew 1:20" },
    { title: "God with us", ref: "Matthew 1:23" },
    { title: "The Word was with God", ref: "John 1:1" },
    { title: "The true light", ref: "John 1:9" },
    { title: "Watch, for you know not", ref: "Mark 13:33" },
    { title: "The desire of nations", ref: "Haggai 2:7" },
    { title: "Rejoice greatly", ref: "Zechariah 9:9" },
    { title: "He will save his people", ref: "Matthew 1:21" },
    { title: "The dayspring from on high", ref: "Luke 1:79" },
    { title: "Behold, I come quickly", ref: "Revelation 22:12" },
    { title: "Even so, come", ref: "Revelation 22:20" },
    { title: "A decree went out", ref: "Luke 2:1" },
    { title: "No room for them", ref: "Luke 2:7" },
    { title: "Glory to God", ref: "Luke 2:14" },
    { title: "Good tidings of great joy", ref: "Luke 2:10" },
  ],
  christmas: [
    { title: "The Word became flesh", ref: "John 1:14" },
    { title: "Born this day a Saviour", ref: "Luke 2:11" },
    { title: "Wrapped in swaddling clothes", ref: "Luke 2:12" },
    { title: "The shepherds made known", ref: "Luke 2:17" },
    { title: "Mary kept these things", ref: "Luke 2:19" },
    { title: "Simeon's blessing", ref: "Luke 2:29" },
    { title: "A light to the Gentiles", ref: "Luke 2:32" },
    { title: "Anna gave thanks", ref: "Luke 2:38" },
    { title: "Wise men from the east", ref: "Matthew 2:1" },
    { title: "They offered him gifts", ref: "Matthew 2:11" },
    { title: "Grace and truth came", ref: "John 1:17" },
    { title: "God sent forth his Son", ref: "Galatians 4:4" },
    { title: "Great is the mystery", ref: "1 Timothy 3:16" },
  ],
  lent: [
    { title: "Create in me a clean heart", ref: "Psalms 51:10" },
    { title: "Return to the Lord", ref: "Joel 2:13" },
    { title: "Man shall not live by bread alone", ref: "Matthew 4:4" },
    { title: "Led into the wilderness", ref: "Matthew 4:1" },
    { title: "Take up your cross", ref: "Luke 9:23" },
    { title: "Blessed are the poor in spirit", ref: "Matthew 5:3" },
    { title: "Your Father sees in secret", ref: "Matthew 6:6" },
    { title: "Where your treasure is", ref: "Matthew 6:21" },
    { title: "Seek first his kingdom", ref: "Matthew 6:33" },
    { title: "The Lord is my shepherd", ref: "Psalms 23:1" },
    { title: "Search me, O God", ref: "Psalms 139:23" },
    { title: "A broken and contrite heart", ref: "Psalms 51:17" },
    { title: "He was wounded for our transgressions", ref: "Isaiah 53:5" },
    { title: "All we like sheep", ref: "Isaiah 53:6" },
    { title: "Come now, let us reason", ref: "Isaiah 1:18" },
    { title: "Rend your heart", ref: "Joel 2:12" },
    { title: "The prodigal returns", ref: "Luke 15:20" },
    { title: "God be merciful to me", ref: "Luke 18:13" },
    { title: "Whoever loses his life", ref: "Mark 8:35" },
    { title: "The grain of wheat", ref: "John 12:24" },
    { title: "I am the bread of life", ref: "John 6:35" },
    { title: "Living water", ref: "John 4:14" },
    { title: "Neither do I condemn you", ref: "John 8:11" },
    { title: "I am the resurrection", ref: "John 11:25" },
    { title: "The Son of Man came to serve", ref: "Mark 10:45" },
    { title: "Humble yourselves", ref: "James 4:10" },
    { title: "If we confess our sins", ref: "1 John 1:9" },
    { title: "Draw near to God", ref: "James 4:8" },
    { title: "Renew a right spirit", ref: "Psalms 51:12" },
    { title: "Wait on the Lord", ref: "Psalms 27:14" },
    { title: "My grace is sufficient", ref: "2 Corinthians 12:9" },
    { title: "Crucified with Christ", ref: "Galatians 2:20" },
    { title: "Put on the new man", ref: "Ephesians 4:24" },
    { title: "Forgetting what is behind", ref: "Philippians 3:13" },
    { title: "That I may know him", ref: "Philippians 3:10" },
    { title: "The goodness of God leads to repentance", ref: "Romans 2:4" },
    { title: "No condemnation", ref: "Romans 8:1" },
    { title: "Present your bodies", ref: "Romans 12:1" },
    { title: "He humbled himself", ref: "Philippians 2:8" },
    { title: "Let this mind be in you", ref: "Philippians 2:5" },
  ],
  // Indexed from Palm Sunday (0) through Holy Saturday (6).
  "holy-week": [
    { title: "Hosanna to the Son of David", ref: "Matthew 21:9" },
    { title: "My house shall be called a house of prayer", ref: "Matthew 21:13" },
    { title: "The stone the builders rejected", ref: "Matthew 21:42" },
    { title: "She has done a beautiful thing", ref: "Mark 14:6" },
    { title: "This is my body", ref: "Luke 22:19" },
    { title: "It is finished", ref: "John 19:30" },
    { title: "He rested in the grave", ref: "Luke 23:56" },
  ],

  eastertide: [
    { title: "He is risen", ref: "Matthew 28:6" },
    { title: "Why seek the living among the dead?", ref: "Luke 24:5" },
    { title: "Their eyes were opened", ref: "Luke 24:31" },
    { title: "Peace be unto you", ref: "John 20:19" },
    { title: "My Lord and my God", ref: "John 20:28" },
    { title: "Do you love me?", ref: "John 21:17" },
    { title: "Death is swallowed up", ref: "1 Corinthians 15:54" },
    { title: "The firstfruits", ref: "1 Corinthians 15:20" },
    { title: "A living hope", ref: "1 Peter 1:3" },
    { title: "Raised with Christ", ref: "Colossians 3:1" },
    { title: "Newness of life", ref: "Romans 6:4" },
    { title: "I am he that lives", ref: "Revelation 1:18" },
    { title: "The Lord is risen indeed", ref: "Luke 24:34" },
    { title: "Christ our Passover", ref: "1 Corinthians 5:7" },
    { title: "Alive to God", ref: "Romans 6:11" },
    { title: "Behold my hands", ref: "Luke 24:39" },
    { title: "He opened their understanding", ref: "Luke 24:45" },
    { title: "You shall be witnesses", ref: "Acts 1:8" },
    { title: "This same Jesus shall come", ref: "Acts 1:11" },
    { title: "Seated at the right hand", ref: "Ephesians 1:20" },
    { title: "The power that raised him", ref: "Ephesians 1:19" },
    { title: "Blessed are those who have not seen", ref: "John 20:29" },
    { title: "Written that you may believe", ref: "John 20:31" },
    { title: "He ever lives to intercede", ref: "Hebrews 7:25" },
    { title: "Wait for the promise", ref: "Acts 1:4" },
  ],
  pentecost: [
    { title: "They were all filled", ref: "Acts 2:4" },
    { title: "A rushing mighty wind", ref: "Acts 2:2" },
    { title: "I will pour out my Spirit", ref: "Acts 2:17" },
    { title: "Repent and be baptised", ref: "Acts 2:38" },
    { title: "The Comforter has come", ref: "John 14:26" },
    { title: "The fruit of the Spirit", ref: "Galatians 5:22" },
    { title: "Led by the Spirit", ref: "Romans 8:14" },
  ],
};

function d(year: number, month: number, day: number) {
  return Date.UTC(year, month - 1, day);
}

const DAY = 86400000;

/** Anonymous Gregorian algorithm. */
export function easterSunday(year: number): number {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const dd = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - dd - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return d(year, month, day);
}

/** First Sunday of Advent: the fourth Sunday before 25 December. */
function adventStart(year: number): number {
  const christmas = d(year, 12, 25);
  const dow = new Date(christmas).getUTCDay();
  const fourthSundayBefore = christmas - (dow === 0 ? 7 : dow) * DAY - 21 * DAY;
  return fourthSundayBefore;
}

export type SeasonHit = { season: SeasonId; label: string; dayIndex: number };

/** Which church season, if any, a UTC date falls in. */
export function seasonFor(dayMs: number): SeasonHit | null {
  const year = new Date(dayMs).getUTCFullYear();

  const ranges: Array<{ season: SeasonId; start: number; end: number }> = [];

  for (const y of [year - 1, year]) {
    const easter = easterSunday(y);
    ranges.push({ season: "lent", start: easter - 46 * DAY, end: easter - 8 * DAY });
    ranges.push({ season: "holy-week", start: easter - 7 * DAY, end: easter - DAY });
    ranges.push({ season: "eastertide", start: easter, end: easter + 47 * DAY });
    ranges.push({ season: "pentecost", start: easter + 48 * DAY, end: easter + 55 * DAY });
    ranges.push({ season: "advent", start: adventStart(y), end: d(y, 12, 24) });
    ranges.push({ season: "christmas", start: d(y, 12, 25), end: d(y + 1, 1, 5) });
  }

  for (const r of ranges) {
    if (dayMs >= r.start && dayMs <= r.end) {
      return {
        season: r.season,
        label: SEASON_LABEL[r.season],
        dayIndex: Math.round((dayMs - r.start) / DAY),
      };
    }
  }
  return null;
}

export function seasonReading(hit: SeasonHit): SeasonReading {
  const list = READINGS[hit.season];
  return list[hit.dayIndex % list.length]!;
}
