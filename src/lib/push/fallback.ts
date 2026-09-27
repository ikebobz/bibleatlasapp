/** Curated verses used when the mirrored feed is unavailable. */
export const FALLBACK_READINGS: Array<{ title: string; ref: string }> = [
  { title: "The Lord is my shepherd", ref: "Psalms 23:1" },
  { title: "Trust in the Lord", ref: "Proverbs 3:5" },
  { title: "Be strong and courageous", ref: "Joshua 1:9" },
  { title: "All things work together", ref: "Romans 8:28" },
  { title: "For God so loved the world", ref: "John 3:16" },
  { title: "His mercies are new", ref: "Lamentations 3:23" },
  { title: "Cast your care upon him", ref: "1 Peter 5:7" },
  { title: "Be anxious for nothing", ref: "Philippians 4:6" },
  { title: "I can do all things", ref: "Philippians 4:13" },
  { title: "The joy of the Lord", ref: "Nehemiah 8:10" },
  { title: "Wait upon the Lord", ref: "Isaiah 40:31" },
  { title: "A lamp unto my feet", ref: "Psalms 119:105" },
  { title: "Come unto me", ref: "Matthew 11:28" },
  { title: "The peace of God", ref: "Philippians 4:7" },
  { title: "Nothing shall separate us", ref: "Romans 8:38" },
  { title: "Delight in the Lord", ref: "Psalms 37:4" },
  { title: "Fear not, I am with you", ref: "Isaiah 41:10" },
  { title: "Seek and you shall find", ref: "Matthew 7:7" },
  { title: "By grace you are saved", ref: "Ephesians 2:8" },
  { title: "A new creation", ref: "2 Corinthians 5:17" },
  { title: "The Lord is my light", ref: "Psalms 27:1" },
  { title: "Love is patient", ref: "1 Corinthians 13:4" },
  { title: "Whatever is true", ref: "Philippians 4:8" },
  { title: "God is our refuge", ref: "Psalms 46:1" },
  { title: "Be still and know", ref: "Psalms 46:10" },
  { title: "Great is your faithfulness", ref: "Lamentations 3:22" },
  { title: "The Lord bless you", ref: "Numbers 6:24" },
  { title: "This is the day", ref: "Psalms 118:24" },
  { title: "Faith is the substance", ref: "Hebrews 11:1" },
  { title: "Let your light shine", ref: "Matthew 5:16" },
  { title: "He restores my soul", ref: "Psalms 23:3" },
];

/** Deterministic pick so every device sees the same verse on the same day. */
export function fallbackFor(dayMs: number) {
  const index = Math.floor(dayMs / 86400000) % FALLBACK_READINGS.length;
  return FALLBACK_READINGS[index]!;
}
