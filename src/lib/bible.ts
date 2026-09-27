export type CanonSection =
  | "torah"
  | "history"
  | "wisdom"
  | "prophets"
  | "gospels"
  | "epistles"
  | "apocalyptic";

export type BookMeta = {
  id: string;
  name: string;
  apiName: string;
  chapters: number;
  testament: "old" | "new";
  /** Canonical book number, 1 (Genesis) – 66 (Revelation). */
  num: number;
  section: CanonSection;
  /** Extra names readers might type. */
  aliases?: string[];
};

export const SECTION_LABEL: Record<CanonSection, string> = {
  torah: "Law",
  history: "History",
  wisdom: "Wisdom & Poetry",
  prophets: "Prophets",
  gospels: "Gospels & Acts",
  epistles: "Letters",
  apocalyptic: "Apocalyptic",
};

export const SECTION_ORDER: CanonSection[] = [
  "torah",
  "history",
  "wisdom",
  "prophets",
  "gospels",
  "epistles",
  "apocalyptic",
];

function b(
  num: number,
  id: string,
  name: string,
  apiName: string,
  chapters: number,
  testament: "old" | "new",
  section: CanonSection,
  aliases?: string[],
): BookMeta {
  return { num, id, name, apiName, chapters, testament, section, aliases };
}

export const BOOKS: BookMeta[] = [
  b(1, "genesis", "Genesis", "genesis", 50, "old", "torah", ["gen", "gn"]),
  b(2, "exodus", "Exodus", "exodus", 40, "old", "torah", ["ex", "exod"]),
  b(3, "leviticus", "Leviticus", "leviticus", 27, "old", "torah", ["lev", "lv"]),
  b(4, "numbers", "Numbers", "numbers", 36, "old", "torah", ["num", "nm"]),
  b(5, "deuteronomy", "Deuteronomy", "deuteronomy", 34, "old", "torah", ["deut", "dt"]),
  b(6, "joshua", "Joshua", "joshua", 24, "old", "history", ["josh"]),
  b(7, "judges", "Judges", "judges", 21, "old", "history", ["judg", "jdg"]),
  b(8, "ruth", "Ruth", "ruth", 4, "old", "history"),
  b(9, "1-samuel", "1 Samuel", "1samuel", 31, "old", "history", ["1 sam", "1sa", "i samuel"]),
  b(10, "2-samuel", "2 Samuel", "2samuel", 24, "old", "history", ["2 sam", "2sa", "ii samuel"]),
  b(11, "1-kings", "1 Kings", "1kings", 22, "old", "history", ["1 kgs", "1ki"]),
  b(12, "2-kings", "2 Kings", "2kings", 25, "old", "history", ["2 kgs", "2ki"]),
  b(13, "1-chronicles", "1 Chronicles", "1chronicles", 29, "old", "history", ["1 chron", "1ch"]),
  b(14, "2-chronicles", "2 Chronicles", "2chronicles", 36, "old", "history", ["2 chron", "2ch"]),
  b(15, "ezra", "Ezra", "ezra", 10, "old", "history"),
  b(16, "nehemiah", "Nehemiah", "nehemiah", 13, "old", "history", ["neh"]),
  b(17, "esther", "Esther", "esther", 10, "old", "history", ["est"]),
  b(18, "job", "Job", "job", 42, "old", "wisdom"),
  b(19, "psalms", "Psalms", "psalms", 150, "old", "wisdom", ["psalm", "ps"]),
  b(20, "proverbs", "Proverbs", "proverbs", 31, "old", "wisdom", ["prov", "pr"]),
  b(21, "ecclesiastes", "Ecclesiastes", "ecclesiastes", 12, "old", "wisdom", ["eccl", "qoheleth"]),
  b(22, "song-of-solomon", "Song of Solomon", "songofsolomon", 8, "old", "wisdom", [
    "song of songs",
    "canticles",
    "song",
  ]),
  b(23, "isaiah", "Isaiah", "isaiah", 66, "old", "prophets", ["isa"]),
  b(24, "jeremiah", "Jeremiah", "jeremiah", 52, "old", "prophets", ["jer"]),
  b(25, "lamentations", "Lamentations", "lamentations", 5, "old", "prophets", ["lam"]),
  b(26, "ezekiel", "Ezekiel", "ezekiel", 48, "old", "prophets", ["ezek", "eze"]),
  b(27, "daniel", "Daniel", "daniel", 12, "old", "prophets", ["dan"]),
  b(28, "hosea", "Hosea", "hosea", 14, "old", "prophets", ["hos"]),
  b(29, "joel", "Joel", "joel", 3, "old", "prophets"),
  b(30, "amos", "Amos", "amos", 9, "old", "prophets"),
  b(31, "obadiah", "Obadiah", "obadiah", 1, "old", "prophets", ["obad"]),
  b(32, "jonah", "Jonah", "jonah", 4, "old", "prophets"),
  b(33, "micah", "Micah", "micah", 7, "old", "prophets", ["mic"]),
  b(34, "nahum", "Nahum", "nahum", 3, "old", "prophets", ["nah"]),
  b(35, "habakkuk", "Habakkuk", "habakkuk", 3, "old", "prophets", ["hab"]),
  b(36, "zephaniah", "Zephaniah", "zephaniah", 3, "old", "prophets", ["zeph"]),
  b(37, "haggai", "Haggai", "haggai", 2, "old", "prophets", ["hag"]),
  b(38, "zechariah", "Zechariah", "zechariah", 14, "old", "prophets", ["zech"]),
  b(39, "malachi", "Malachi", "malachi", 4, "old", "prophets", ["mal"]),
  b(40, "matthew", "Matthew", "matthew", 28, "new", "gospels", ["matt", "mt"]),
  b(41, "mark", "Mark", "mark", 16, "new", "gospels", ["mk"]),
  b(42, "luke", "Luke", "luke", 24, "new", "gospels", ["lk"]),
  b(43, "john", "John", "john", 21, "new", "gospels", ["jn"]),
  b(44, "acts", "Acts", "acts", 28, "new", "gospels", ["acts of the apostles"]),
  b(45, "romans", "Romans", "romans", 16, "new", "epistles", ["rom"]),
  b(46, "1-corinthians", "1 Corinthians", "1corinthians", 16, "new", "epistles", ["1 cor", "1co"]),
  b(47, "2-corinthians", "2 Corinthians", "2corinthians", 13, "new", "epistles", ["2 cor", "2co"]),
  b(48, "galatians", "Galatians", "galatians", 6, "new", "epistles", ["gal"]),
  b(49, "ephesians", "Ephesians", "ephesians", 6, "new", "epistles", ["eph"]),
  b(50, "philippians", "Philippians", "philippians", 4, "new", "epistles", ["phil"]),
  b(51, "colossians", "Colossians", "colossians", 4, "new", "epistles", ["col"]),
  b(52, "1-thessalonians", "1 Thessalonians", "1thessalonians", 5, "new", "epistles", ["1 thess"]),
  b(53, "2-thessalonians", "2 Thessalonians", "2thessalonians", 3, "new", "epistles", ["2 thess"]),
  b(54, "1-timothy", "1 Timothy", "1timothy", 6, "new", "epistles", ["1 tim"]),
  b(55, "2-timothy", "2 Timothy", "2timothy", 4, "new", "epistles", ["2 tim"]),
  b(56, "titus", "Titus", "titus", 3, "new", "epistles"),
  b(57, "philemon", "Philemon", "philemon", 1, "new", "epistles", ["philem"]),
  b(58, "hebrews", "Hebrews", "hebrews", 13, "new", "epistles", ["heb"]),
  b(59, "james", "James", "james", 5, "new", "epistles", ["jas"]),
  b(60, "1-peter", "1 Peter", "1peter", 5, "new", "epistles", ["1 pet"]),
  b(61, "2-peter", "2 Peter", "2peter", 3, "new", "epistles", ["2 pet"]),
  b(62, "1-john", "1 John", "1john", 5, "new", "epistles", ["1 jn"]),
  b(63, "2-john", "2 John", "2john", 1, "new", "epistles", ["2 jn"]),
  b(64, "3-john", "3 John", "3john", 1, "new", "epistles", ["3 jn"]),
  b(65, "jude", "Jude", "jude", 1, "new", "epistles"),
  b(66, "revelation", "Revelation", "revelation", 22, "new", "apocalyptic", [
    "rev",
    "apocalypse",
    "revelations",
  ]),
];

const BY_ID = new Map(BOOKS.map((x) => [x.id, x]));
const BY_NUM = new Map(BOOKS.map((x) => [x.num, x]));

const LOOKUP = new Map<string, BookMeta>();
for (const book of BOOKS) {
  LOOKUP.set(book.id, book);
  LOOKUP.set(book.name.toLowerCase(), book);
  LOOKUP.set(book.apiName, book);
  LOOKUP.set(book.name.toLowerCase().replace(/\s+/g, ""), book);
  for (const alias of book.aliases ?? []) {
    LOOKUP.set(alias.toLowerCase(), book);
    LOOKUP.set(alias.toLowerCase().replace(/\s+/g, ""), book);
  }
}

export function getBook(id: string): BookMeta | undefined {
  return BY_ID.get(id.toLowerCase()) ?? LOOKUP.get(id.trim().toLowerCase());
}

export function getBookByNumber(num: number): BookMeta | undefined {
  return BY_NUM.get(num);
}

export function bookName(id: string): string {
  return getBook(id)?.name ?? id;
}

export function booksInSection(section: CanonSection): BookMeta[] {
  return BOOKS.filter((x) => x.section === section);
}

/**
 * Books a reader might be reaching for when they type something: full names,
 * ids and the short forms people actually use ("1 sam", "ps", "song of songs").
 * Shared by the desktop panel and the phone picker so the two can never
 * disagree about what a search finds.
 */
export function matchBooks(query: string): BookMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return BOOKS;
  return BOOKS.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.id.includes(q) ||
      (b.aliases ?? []).some((a) => a.startsWith(q)),
  );
}


export type Verse = { number: number; text: string };

export type Chapter = {
  book: string;
  bookName: string;
  chapter: number;
  reference: string;
  verses: Verse[];
};

/** Neighbouring chapter, crossing book boundaries across the whole canon. */
export function stepChapter(bookId: string, chapter: number, dir: 1 | -1) {
  const idx = BOOKS.findIndex((x) => x.id === bookId);
  if (idx === -1) return null;
  const book = BOOKS[idx];
  const next = chapter + dir;
  if (next >= 1 && next <= book.chapters) return { book: book.id, chapter: next };
  const neighbour = BOOKS[idx + dir];
  if (!neighbour) return null;
  return { book: neighbour.id, chapter: dir === 1 ? 1 : neighbour.chapters };
}

/** Parse a human reference like "1 Samuel 17:40" or "John 4" into a link target. */
export function parseReference(ref: string): { book: string; chapter: number; verse?: number } | null {
  const m = ref.trim().match(/^((?:[1-3]\s*)?[A-Za-z][A-Za-z\s.]*?)\s*\.?\s+(\d+)(?::(\d+))?/);
  if (!m) return null;
  const name = m[1].trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
  const book = LOOKUP.get(name) ?? LOOKUP.get(name.replace(/\s+/g, ""));
  if (!book) return null;
  const chapter = Number(m[2]);
  if (!Number.isFinite(chapter) || chapter < 1 || chapter > book.chapters) return null;
  return { book: book.id, chapter, verse: m[3] ? Number(m[3]) : undefined };
}
