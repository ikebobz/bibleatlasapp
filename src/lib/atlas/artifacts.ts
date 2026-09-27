/**
 * Interactive biblical objects: geometry for the 3D viewer plus the
 * measurements, materials, construction and purpose notes shown beside it.
 */

export type MaterialKey =
  | "gold"
  | "wood"
  | "bronze"
  | "silver"
  | "linen"
  | "crimson"
  | "blue"
  | "purple"
  | "stone"
  | "parchment";

export type Part =
  | { kind: "box"; pos: [number, number, number]; size: [number, number, number]; color: MaterialKey }
  | {
      kind: "cyl";
      pos: [number, number, number];
      r: number;
      h: number;
      axis: "x" | "y" | "z";
      seg?: number;
      color: MaterialKey;
    };

export type Artifact = {
  id: string;
  title: string;
  subtitle: string;
  /** Phrases in the biblical text that open this object. */
  matches: string[];
  /** Short orientation paragraph shown above the model. */
  intro: string[];
  parts: Part[];
  /** Rough world radius used to frame the camera. */
  scale: number;
  measurements: { label: string; value: string }[];
  materials: { label: string; value: string }[];
  construction: { title: string; body: string }[];
  purpose: string[];
  refs: { ref: string; note: string }[];
};

/* Geometry is written in "cubits" (~45 cm) unless a note says otherwise. */

export const ARTIFACTS: Artifact[] = [
  {
    id: "ark-of-the-covenant",
    title: "Ark of the Covenant",
    subtitle: "A gold chest, two cherubim, and the place where God met Israel",
    matches: [
      "ark of the covenant",
      "ark of the testimony",
      "mercy seat",
      "the ark of God",
      "cherubim",
    ],
    intro: [
      "The Ark is a wooden chest overlaid inside and out with gold, carried on poles that were never removed. Its lid — the mercy seat — was where blood was sprinkled once a year on the Day of Atonement.",
      "Drag the model to turn it. The two cherubim face each other over the lid, wings arched toward the empty space between them.",
    ],
    scale: 2.6,
    parts: [
      { kind: "box", pos: [0, 0, 0], size: [2.5, 1.5, 1.5], color: "wood" },
      { kind: "box", pos: [0, 0.82, 0], size: [2.62, 0.16, 1.62], color: "gold" },
      { kind: "box", pos: [0, 0.16, 0], size: [2.56, 0.1, 1.56], color: "gold" },
      { kind: "cyl", pos: [0, -0.35, 0.95], r: 0.09, h: 3.6, axis: "x", color: "gold" },
      { kind: "cyl", pos: [0, -0.35, -0.95], r: 0.09, h: 3.6, axis: "x", color: "gold" },
      // cherubim: bodies and arched wings
      { kind: "box", pos: [-0.75, 1.25, 0], size: [0.32, 0.75, 0.32], color: "gold" },
      { kind: "box", pos: [0.75, 1.25, 0], size: [0.32, 0.75, 0.32], color: "gold" },
      { kind: "box", pos: [-0.35, 1.75, 0], size: [0.62, 0.12, 0.5], color: "gold" },
      { kind: "box", pos: [0.35, 1.75, 0], size: [0.62, 0.12, 0.5], color: "gold" },
      { kind: "box", pos: [-1.1, 1.62, 0], size: [0.4, 0.12, 0.5], color: "gold" },
      { kind: "box", pos: [1.1, 1.62, 0], size: [0.4, 0.12, 0.5], color: "gold" },
    ],
    measurements: [
      { label: "Length", value: "2½ cubits ≈ 1.15 m / 3 ft 9 in" },
      { label: "Width", value: "1½ cubits ≈ 0.68 m / 2 ft 3 in" },
      { label: "Height", value: "1½ cubits ≈ 0.68 m / 2 ft 3 in" },
      { label: "Mercy seat", value: "Solid gold lid, same length and width" },
      { label: "Poles", value: "Acacia, gold-overlaid, left permanently in the rings" },
    ],
    materials: [
      { label: "Core", value: "Acacia wood — dense desert hardwood, resistant to rot" },
      { label: "Overlay", value: "Pure gold, inside and out, with a gold moulding around the rim" },
      { label: "Fittings", value: "Four cast gold rings, one at each foot" },
      { label: "Cherubim", value: "Hammered from one piece with the lid, not attached separately" },
    ],
    construction: [
      {
        title: "Chest and moulding",
        body: "Acacia boards form the box; gold sheet is worked over every surface so no wood shows. A raised gold moulding runs around the top edge.",
      },
      {
        title: "Rings and poles",
        body: "Four rings are cast and fixed at the feet. Poles slide through and stay there — the Ark is never touched by hand, only carried.",
      },
      {
        title: "Mercy seat and cherubim",
        body: "The lid is beaten from a single mass of gold, the two cherubim rising out of it at either end, wings spread forward and overshadowing the centre.",
      },
    ],
    purpose: [
      "Inside were the stone tablets of the covenant — later joined by Aaron's staff and a jar of manna. The Ark is the covenant document kept at the feet of the King.",
      "God said he would meet Israel and speak from above the mercy seat, between the cherubim. It is a throne footstool, not a magic weapon: when Israel treated it as a talisman in battle it was captured.",
      "On the Day of Atonement the high priest sprinkled blood on the lid — the one place where the broken law was covered.",
    ],
    refs: [
      { ref: "Exodus 25:10", note: "The plans given at Sinai." },
      { ref: "Exodus 37:1", note: "Bezalel builds it." },
      { ref: "Leviticus 16:14", note: "Blood on the mercy seat." },
      { ref: "Hebrews 9:4", note: "What the Ark contained." },
    ],
  },
  {
    id: "menorah",
    title: "The Menorah",
    subtitle: "A hammered gold lampstand shaped like a flowering tree",
    matches: ["lampstand", "lamp stand", "menorah", "golden lampstand", "seven lamps"],
    intro: [
      "The lampstand stood in the Holy Place on the south side, opposite the table of bread. Its seven lamps burned continually before the veil.",
      "It is not an abstract candlestick: it is described as a tree in blossom — branches, almond cups, buds and flowers.",
    ],
    scale: 3.2,
    parts: [
      { kind: "cyl", pos: [0, -1.6, 0], r: 0.55, h: 0.2, axis: "y", color: "gold" },
      { kind: "cyl", pos: [0, 0, 0], r: 0.14, h: 3.2, axis: "y", color: "gold" },
      { kind: "box", pos: [-0.6, 0.5, 0], size: [1.2, 0.12, 0.12], color: "gold" },
      { kind: "box", pos: [0.6, 0.5, 0], size: [1.2, 0.12, 0.12], color: "gold" },
      { kind: "box", pos: [-0.95, 0.0, 0], size: [1.9, 0.12, 0.12], color: "gold" },
      { kind: "box", pos: [0.95, 0.0, 0], size: [1.9, 0.12, 0.12], color: "gold" },
      { kind: "box", pos: [-1.3, -0.5, 0], size: [2.6, 0.12, 0.12], color: "gold" },
      { kind: "box", pos: [1.3, -0.5, 0], size: [2.6, 0.12, 0.12], color: "gold" },
      { kind: "cyl", pos: [-1.2, 0.85, 0], r: 0.1, h: 0.8, axis: "y", color: "gold" },
      { kind: "cyl", pos: [1.2, 0.85, 0], r: 0.1, h: 0.8, axis: "y", color: "gold" },
      { kind: "cyl", pos: [-1.9, 0.85, 0], r: 0.1, h: 1.8, axis: "y", color: "gold" },
      { kind: "cyl", pos: [1.9, 0.85, 0], r: 0.1, h: 1.8, axis: "y", color: "gold" },
      { kind: "cyl", pos: [-2.6, 0.85, 0], r: 0.1, h: 2.8, axis: "y", color: "gold" },
      { kind: "cyl", pos: [2.6, 0.85, 0], r: 0.1, h: 2.8, axis: "y", color: "gold" },
      { kind: "cyl", pos: [0, 1.7, 0], r: 0.22, h: 0.22, axis: "y", color: "gold" },
      { kind: "cyl", pos: [-1.2, 1.3, 0], r: 0.22, h: 0.22, axis: "y", color: "gold" },
      { kind: "cyl", pos: [1.2, 1.3, 0], r: 0.22, h: 0.22, axis: "y", color: "gold" },
      { kind: "cyl", pos: [-1.9, 1.8, 0], r: 0.22, h: 0.22, axis: "y", color: "gold" },
      { kind: "cyl", pos: [1.9, 1.8, 0], r: 0.22, h: 0.22, axis: "y", color: "gold" },
      { kind: "cyl", pos: [-2.6, 2.3, 0], r: 0.22, h: 0.22, axis: "y", color: "gold" },
      { kind: "cyl", pos: [2.6, 2.3, 0], r: 0.22, h: 0.22, axis: "y", color: "gold" },
    ],
    measurements: [
      { label: "Weight", value: "One talent of gold ≈ 34 kg / 75 lb" },
      { label: "Height", value: "Not given in Scripture; Second Temple depictions suggest ~1.5 m" },
      { label: "Branches", value: "Six branches — three each side — plus the central shaft: seven lamps" },
      { label: "Ornament", value: "Twenty-two almond-shaped cups with buds and blossoms" },
    ],
    materials: [
      { label: "Body", value: "Pure gold, hammered from a single talent — not cast or assembled" },
      { label: "Fuel", value: "Beaten olive oil, pure and clear" },
      { label: "Tools", value: "Gold tongs and trays for tending the wicks" },
    ],
    construction: [
      {
        title: "One piece",
        body: "Base, shaft, branches, cups and flowers are all worked out of one mass of gold. Nothing is soldered on — the unity is deliberate.",
      },
      {
        title: "Almond blossom",
        body: "Each branch carries three almond-shaped cups with bud and blossom; the central shaft carries four. Almond is the first tree to flower in Israel — the tree of waking life.",
      },
      {
        title: "Tending",
        body: "Aaron dressed the lamps every morning and lit them every evening so that light burned before the Lord continually.",
      },
    ],
    purpose: [
      "The Holy Place had no windows. The lampstand was the only light — the priests worked entirely by it.",
      "Shaped as a flowering tree inside a garden-like sanctuary, it echoes the tree of life in Eden and the promise of light and life restored.",
      "Zechariah sees it again as a vision of God's Spirit; Revelation turns it into an image of the churches themselves as lampstands.",
    ],
    refs: [
      { ref: "Exodus 25:31", note: "The pattern of the lampstand." },
      { ref: "Leviticus 24:2", note: "Lamps kept burning continually." },
      { ref: "Zechariah 4:2", note: "\"Not by might, nor by power, but by my Spirit.\"" },
      { ref: "Revelation 1:12", note: "Seven lampstands, seven churches." },
    ],
  },
  {
    id: "priestly-garments",
    title: "High Priest's garments",
    subtitle: "Clothing made \"for glory and for beauty\" — and for bearing names",
    matches: [
      "ephod",
      "breastplate",
      "Urim and Thummim",
      "holy garments",
      "priestly garments",
      "turban",
      "high priest's garments",
    ],
    intro: [
      "Eight pieces made up the high priest's dress. Every element carried meaning: he did not enter God's presence as a private individual but as Israel wearing its own name.",
      "The model shows the layered silhouette — tunic, blue robe, ephod, breastplate, sash and turban.",
    ],
    scale: 3.0,
    parts: [
      { kind: "box", pos: [0, -1.1, 0], size: [1.5, 2.2, 0.6], color: "linen" },
      { kind: "box", pos: [0, -0.2, 0], size: [1.65, 1.9, 0.7], color: "blue" },
      { kind: "box", pos: [0, 0.35, 0.05], size: [1.35, 1.4, 0.72], color: "purple" },
      { kind: "box", pos: [0, 0.45, 0.42], size: [0.7, 0.7, 0.08], color: "gold" },
      { kind: "box", pos: [-0.62, 1.05, 0.1], size: [0.3, 0.16, 0.5], color: "gold" },
      { kind: "box", pos: [0.62, 1.05, 0.1], size: [0.3, 0.16, 0.5], color: "gold" },
      { kind: "box", pos: [0, -0.35, 0.05], size: [1.7, 0.24, 0.76], color: "crimson" },
      { kind: "cyl", pos: [0, 1.55, 0], r: 0.42, h: 0.55, axis: "y", color: "linen" },
      { kind: "box", pos: [0, 1.62, 0.4], size: [0.5, 0.16, 0.06], color: "gold" },
      { kind: "box", pos: [-0.55, -2.35, 0], size: [0.28, 0.3, 0.55], color: "gold" },
      { kind: "box", pos: [0.55, -2.35, 0], size: [0.28, 0.3, 0.55], color: "gold" },
    ],
    measurements: [
      { label: "Breastpiece", value: "A span square when folded ≈ 22 × 22 cm / 9 × 9 in" },
      { label: "Stones", value: "12 engraved gems in four rows of three" },
      { label: "Shoulder stones", value: "Two onyx, six tribal names engraved on each" },
      { label: "Robe hem", value: "Alternating gold bells and pomegranates all round" },
      { label: "Plate", value: "Gold, engraved \"Holy to Yahweh\", tied to the turban with blue cord" },
    ],
    materials: [
      { label: "Threads", value: "Gold wire, blue, purple and scarlet yarn, fine twisted linen" },
      { label: "Stones", value: "Sardius, topaz, beryl, turquoise, sapphire, emerald and others" },
      { label: "Undergarments", value: "Plain white linen tunic, sash, turban and breeches" },
    ],
    construction: [
      {
        title: "Gold beaten into thread",
        body: "Sheets of gold were hammered thin and cut into wire, then woven in with the coloured yarn — the same craft used for the tabernacle curtains.",
      },
      {
        title: "The ephod and breastpiece",
        body: "A two-piece apron joined at the shoulders and tied at the waist. The breastpiece hangs on gold chains from the shoulder settings and is tied with blue cord to rings on the ephod so it never comes loose.",
      },
      {
        title: "Bells on the hem",
        body: "The sound of the bells was heard as he went in and came out — proof to those waiting outside that he was alive in the holy place.",
      },
    ],
    purpose: [
      "He carried the twelve tribal names on his shoulders and over his heart: the whole nation entered God's presence with him.",
      "The Urim and Thummim in the breastpiece were used to seek God's decision in matters too heavy for a judge.",
      "The gold plate on his forehead bore the guilt of Israel's holy offerings, so that imperfect worship could still be accepted.",
    ],
    refs: [
      { ref: "Exodus 28:2", note: "\"For glory and for beauty.\"" },
      { ref: "Exodus 28:29", note: "Names over the heart." },
      { ref: "Leviticus 16:4", note: "Plain linen on the Day of Atonement." },
      { ref: "Hebrews 7:26", note: "A high priest who needs no such covering." },
    ],
  },
  {
    id: "temple-veil",
    title: "The Temple veil",
    subtitle: "The woven barrier torn from top to bottom",
    matches: ["veil", "curtain of the temple", "the veil of the temple", "inner veil"],
    intro: [
      "The veil separated the Holy Place from the Most Holy Place. Only one man, once a year, with blood, went behind it.",
      "It was not a hanging sheet but a heavy embroidered wall of cloth on gold-covered pillars.",
    ],
    scale: 3.2,
    parts: [
      { kind: "cyl", pos: [-1.7, 0, 0], r: 0.16, h: 4.4, axis: "y", color: "gold" },
      { kind: "cyl", pos: [-0.57, 0, 0], r: 0.16, h: 4.4, axis: "y", color: "gold" },
      { kind: "cyl", pos: [0.57, 0, 0], r: 0.16, h: 4.4, axis: "y", color: "gold" },
      { kind: "cyl", pos: [1.7, 0, 0], r: 0.16, h: 4.4, axis: "y", color: "gold" },
      { kind: "box", pos: [0, 0.6, 0], size: [3.6, 3.1, 0.08], color: "purple" },
      { kind: "box", pos: [0, 0.6, 0.06], size: [3.4, 2.9, 0.02], color: "crimson" },
      { kind: "box", pos: [0, 2.35, 0], size: [3.9, 0.22, 0.3], color: "gold" },
      { kind: "box", pos: [-1.7, -2.3, 0], size: [0.5, 0.3, 0.5], color: "silver" },
      { kind: "box", pos: [-0.57, -2.3, 0], size: [0.5, 0.3, 0.5], color: "silver" },
      { kind: "box", pos: [0.57, -2.3, 0], size: [0.5, 0.3, 0.5], color: "silver" },
      { kind: "box", pos: [1.7, -2.3, 0], size: [0.5, 0.3, 0.5], color: "silver" },
    ],
    measurements: [
      { label: "Tabernacle veil", value: "About 10 cubits square ≈ 4.5 × 4.5 m" },
      { label: "Herod's Temple", value: "Josephus and the Mishnah describe a curtain roughly 18 m high" },
      { label: "Thickness", value: "Rabbinic tradition: a handbreadth thick, woven of 72 strands" },
      { label: "Pillars", value: "Four acacia posts overlaid with gold on silver bases" },
    ],
    materials: [
      { label: "Yarn", value: "Blue, purple and scarlet on fine twisted linen" },
      { label: "Figures", value: "Cherubim worked into the weave by a skilled craftsman" },
      { label: "Hardware", value: "Gold hooks, gold-plated posts, cast silver sockets" },
    ],
    construction: [
      {
        title: "Woven, not printed",
        body: "The cherubim were part of the weave itself, visible from both sides — the work of a designer rather than an embroiderer.",
      },
      {
        title: "Guardians at the door",
        body: "Cherubim guarded Eden's entrance after the exile from the garden. The same figures now stand on the cloth barring the way in.",
      },
      {
        title: "Torn",
        body: "At the death of Jesus the veil tore from top to bottom — the direction matters. It was opened from God's side, not forced from ours.",
      },
    ],
    purpose: [
      "The veil made a point plainly: sinful people cannot walk into God's unmediated presence and live.",
      "It also kept the promise alive. God was present — near enough that a curtain was needed.",
      "Hebrews reads the torn veil as the body of Christ: a new and living way opened into the holy place.",
    ],
    refs: [
      { ref: "Exodus 26:31", note: "The veil and its cherubim." },
      { ref: "Matthew 27:51", note: "Torn from top to bottom." },
      { ref: "Hebrews 10:19", note: "Confidence to enter by a new and living way." },
    ],
  },
  {
    id: "roman-cross",
    title: "The Roman cross",
    subtitle: "An execution device designed to be seen from the road",
    matches: ["cross", "crucified", "crucify", "crucifixion"],
    intro: [
      "Crucifixion was a Roman public deterrent, reserved for slaves, rebels and non-citizens. The Gospels describe it without a single line of physical detail — their readers had seen it.",
      "The upright usually stayed in place at the execution ground; the condemned carried only the crossbeam.",
    ],
    scale: 3.4,
    parts: [
      { kind: "box", pos: [0, 0, 0], size: [0.42, 6.2, 0.42], color: "wood" },
      { kind: "box", pos: [0, 1.6, 0.05], size: [3.6, 0.38, 0.38], color: "wood" },
      { kind: "box", pos: [0, 2.35, 0.1], size: [0.9, 0.5, 0.06], color: "parchment" },
      { kind: "box", pos: [0, -0.6, 0.22], size: [0.3, 0.3, 0.1], color: "wood" },
      { kind: "box", pos: [0, -3.05, 0], size: [1.0, 0.35, 1.0], color: "stone" },
    ],
    measurements: [
      { label: "Upright (stipes)", value: "Typically 2.5–3.5 m, often reused and fixed in the ground" },
      { label: "Crossbeam (patibulum)", value: "1.5–1.8 m, roughly 30–50 kg — the part carried" },
      { label: "Nails", value: "Iron spikes 13–18 cm, driven through the wrists and heel bones" },
      { label: "Titulus", value: "A whitened board naming the charge: \"King of the Jews\"" },
    ],
    materials: [
      { label: "Timber", value: "Local olive, pine or cypress — rough, unplaned" },
      { label: "Iron", value: "Square-sectioned forged nails; one was found in a 1st-century heel bone at Giv'at ha-Mivtar" },
      { label: "Rope", value: "Often used with or instead of nails to bind the arms" },
    ],
    construction: [
      {
        title: "Two pieces, not one",
        body: "The upright stood permanently at the site. The condemned man carried the crossbeam across his shoulders through the streets, then was fixed to it and hoisted into place.",
      },
      {
        title: "Position",
        body: "Crosses stood beside busy roads and city gates. Visibility was the point: Rome was making a statement about who ruled.",
      },
      {
        title: "Cause of death",
        body: "Death came slowly, usually from asphyxiation and shock as the body could no longer push up to breathe. Breaking the legs ended it quickly.",
      },
    ],
    purpose: [
      "Rome intended humiliation and deterrence. Jewish law added another layer: \"cursed is everyone who hangs on a tree.\"",
      "The New Testament takes the most shameful object in the empire and makes it the centre of its message — the place where the curse is absorbed rather than avoided.",
      "Paul calls it foolishness to Greeks and a stumbling block to Jews, and refuses to preach anything else.",
    ],
    refs: [
      { ref: "John 19:17", note: "Carrying the crossbeam to Golgotha." },
      { ref: "Galatians 3:13", note: "\"Cursed is everyone who hangs on a tree.\"" },
      { ref: "1 Corinthians 1:23", note: "Christ crucified — a stumbling block and foolishness." },
    ],
  },
  {
    id: "tabernacle",
    title: "The Tabernacle",
    subtitle: "A portable sanctuary — God moving with a people on the road",
    matches: ["tabernacle", "tent of meeting", "the dwelling", "the sanctuary"],
    intro: [
      "The Tabernacle was a tent inside a fenced courtyard, designed to be dismantled and carried. Everything about it says movement: poles, rings, frames, coverings.",
      "The model shows the courtyard, the bronze altar and basin, and the tented dwelling with its two rooms.",
    ],
    scale: 9,
    parts: [
      { kind: "box", pos: [0, -1.0, 0], size: [20, 0.15, 10], color: "stone" },
      { kind: "box", pos: [0, -0.2, 5], size: [20, 1.6, 0.14], color: "linen" },
      { kind: "box", pos: [0, -0.2, -5], size: [20, 1.6, 0.14], color: "linen" },
      { kind: "box", pos: [-10, -0.2, 0], size: [0.14, 1.6, 10], color: "linen" },
      { kind: "box", pos: [10, -0.2, 0], size: [0.14, 1.6, 10], color: "linen" },
      { kind: "box", pos: [-6.5, -0.35, 0], size: [2.2, 1.3, 2.2], color: "bronze" },
      { kind: "cyl", pos: [-3.5, -0.5, 0], r: 0.8, h: 1.0, axis: "y", color: "bronze" },
      { kind: "box", pos: [3, 0.1, 0], size: [10, 2.2, 4.5], color: "linen" },
      { kind: "box", pos: [3, 1.3, 0], size: [10.3, 0.3, 4.8], color: "crimson" },
      { kind: "box", pos: [6.4, 0.15, 0], size: [0.2, 2.3, 4.5], color: "purple" },
      { kind: "box", pos: [-1.9, 0.1, 0], size: [0.2, 2.2, 4.5], color: "blue" },
      { kind: "box", pos: [4.6, -0.1, 0], size: [0.7, 0.5, 0.5], color: "gold" },
    ],
    measurements: [
      { label: "Courtyard", value: "100 × 50 cubits ≈ 45 × 23 m" },
      { label: "Dwelling", value: "30 × 10 cubits ≈ 13.7 × 4.6 m, 10 cubits high" },
      { label: "Holy Place", value: "20 × 10 cubits — lampstand, table of bread, incense altar" },
      { label: "Most Holy Place", value: "A perfect 10-cubit cube holding only the Ark" },
      { label: "Bronze altar", value: "5 × 5 cubits, 3 cubits high" },
    ],
    materials: [
      { label: "Frames", value: "Acacia boards overlaid with gold, standing in silver sockets" },
      { label: "Coverings", value: "Four layers: woven linen, goat hair, ram skins dyed red, and durable leather" },
      { label: "Courtyard", value: "Linen hangings on bronze posts with silver hooks" },
      { label: "Gradient", value: "Bronze outside, silver at the join, gold within — metals grow more precious nearer God" },
    ],
    construction: [
      {
        title: "Freewill materials",
        body: "Everything came from voluntary offerings — much of it Egyptian gold and cloth carried out at the exodus. Moses eventually had to tell the people to stop giving.",
      },
      {
        title: "Frames and bars",
        body: "Forty-eight upright frames tenon into ninety-six silver sockets, locked together by five bars per side that slide through gold rings.",
      },
      {
        title: "Made to move",
        body: "Levite clans were assigned each part. Under a cloud by day and fire by night, the whole sanctuary came apart and travelled with the camp.",
      },
    ],
    purpose: [
      "\"Let them make me a sanctuary, that I may dwell among them.\" The point is not the building but the presence.",
      "Its layout runs Eden in reverse: a guarded east entrance, a garden-like lampstand, and a throne room where God meets his people.",
      "Hebrews reads it as a copy and shadow of a heavenly reality, and John says the Word became flesh and \"tabernacled\" among us.",
    ],
    refs: [
      { ref: "Exodus 25:8", note: "\"That I may dwell among them.\"" },
      { ref: "Exodus 40:34", note: "The glory fills the tent." },
      { ref: "Hebrews 8:5", note: "A copy and shadow of heavenly things." },
      { ref: "John 1:14", note: "The Word dwelt — tabernacled — among us." },
    ],
  },
  {
    id: "scrolls",
    title: "Scrolls",
    subtitle: "How Scripture was actually made, stored and read aloud",
    matches: ["scroll", "scrolls", "the book of the law", "the scriptures", "written in the book"],
    intro: [
      "Until the codex took over, a \"book\" meant a roll of sewn sheets wound onto wooden rods and read a column at a time.",
      "When Jesus \"opened the book\" in Nazareth and rolled it up again, this is the object in his hands.",
    ],
    scale: 3.2,
    parts: [
      { kind: "cyl", pos: [-2.2, 0, 0], r: 0.62, h: 0.75, axis: "x", color: "parchment" },
      { kind: "cyl", pos: [2.2, 0, 0], r: 0.62, h: 0.75, axis: "x", color: "parchment" },
      { kind: "box", pos: [0, -0.02, 0], size: [3.9, 0.1, 1.5], color: "parchment" },
      { kind: "cyl", pos: [-2.2, 0, 0], r: 0.12, h: 2.4, axis: "x", color: "wood" },
      { kind: "cyl", pos: [2.2, 0, 0], r: 0.12, h: 2.4, axis: "x", color: "wood" },
      { kind: "box", pos: [-1.1, 0.05, 0], size: [0.9, 0.02, 1.0], color: "wood" },
      { kind: "box", pos: [0.3, 0.05, 0], size: [0.9, 0.02, 1.0], color: "wood" },
      { kind: "box", pos: [1.5, 0.05, 0], size: [0.5, 0.02, 1.0], color: "wood" },
    ],
    measurements: [
      { label: "Height", value: "Typically 25–35 cm; the Great Isaiah Scroll is 26 cm tall" },
      { label: "Length", value: "Isaiah at Qumran runs 7.3 m across 54 columns" },
      { label: "Columns", value: "Ruled with a stylus, usually 3–4 cm apart, ~30 lines each" },
      { label: "Sheets", value: "Prepared skins sewn end to end with animal sinew" },
    ],
    materials: [
      { label: "Surface", value: "Parchment from sheep or goat skin; papyrus for everyday documents" },
      { label: "Ink", value: "Carbon black — soot, gum arabic and water" },
      { label: "Pen", value: "Cut reed, trimmed with a scribe's knife" },
      { label: "Rollers", value: "Wooden rods, later called \"trees of life\" in synagogue use" },
    ],
    construction: [
      {
        title: "Preparing the skin",
        body: "Hides were soaked, dehaired, stretched on a frame, dried and smoothed with pumice, then ruled with horizontal guide lines and vertical column margins.",
      },
      {
        title: "Copying",
        body: "Scribes copied letter by letter, counting words and marking the middle letter of a book as a check. Errors meant the sheet was corrected or buried, never discarded casually.",
      },
      {
        title: "Storage",
        body: "Rolled scrolls were wrapped in linen and stored upright in clay jars — which is exactly how the Dead Sea Scrolls survived two thousand years.",
      },
    ],
    purpose: [
      "Scripture was heard far more often than read. One scroll served a whole community, read aloud in synagogue and explained standing or sitting.",
      "The physical limits shaped the canon's shape: Luke–Acts and Samuel–Kings split where a single roll ran out.",
      "Sealed scrolls carried legal weight — a deed, a will, a verdict. Revelation's sealed scroll trades on exactly that image.",
    ],
    refs: [
      { ref: "Jeremiah 36:23", note: "The king cuts and burns the scroll column by column." },
      { ref: "Luke 4:17", note: "Jesus unrolls Isaiah in Nazareth." },
      { ref: "2 Timothy 4:13", note: "\"Bring the scrolls, especially the parchments.\"" },
      { ref: "Revelation 5:1", note: "A scroll sealed with seven seals." },
    ],
  },
  {
    id: "coins",
    title: "Coins",
    subtitle: "Silver, bronze and the small change of the Gospels",
    matches: [
      "coin",
      "coins",
      "denarius",
      "denarii",
      "shekel",
      "shekels",
      "mite",
      "mites",
      "tribute money",
      "pieces of silver",
    ],
    intro: [
      "Three currencies circulated at once in first-century Judea: imperial Roman, provincial Greek, and local Jewish bronze. Which coin you handed over said something.",
      "The Tyrian shekel — the only coin accepted for the temple tax — carried a pagan god's head, which is why money changers were needed in the first place.",
    ],
    scale: 2.6,
    parts: [
      { kind: "cyl", pos: [-1.35, -0.55, 0.3], r: 0.7, h: 0.16, axis: "y", color: "silver" },
      { kind: "cyl", pos: [-1.35, -0.38, 0.3], r: 0.68, h: 0.16, axis: "y", color: "silver" },
      { kind: "cyl", pos: [-1.3, -0.2, 0.25], r: 0.7, h: 0.16, axis: "y", color: "silver" },
      { kind: "cyl", pos: [0.5, -0.55, -0.5], r: 0.85, h: 0.18, axis: "y", color: "silver" },
      { kind: "cyl", pos: [0.55, -0.36, -0.45], r: 0.85, h: 0.18, axis: "y", color: "silver" },
      { kind: "cyl", pos: [1.6, -0.56, 0.6], r: 0.45, h: 0.14, axis: "y", color: "bronze" },
      { kind: "cyl", pos: [1.55, -0.41, 0.55], r: 0.45, h: 0.14, axis: "y", color: "bronze" },
      { kind: "cyl", pos: [0.9, -0.57, 1.1], r: 0.3, h: 0.12, axis: "y", color: "bronze" },
      { kind: "cyl", pos: [-0.4, 0.35, 0.6], r: 0.7, h: 0.16, axis: "z", color: "silver" },
      { kind: "box", pos: [0, -0.72, 0], size: [4.4, 0.14, 3.2], color: "wood" },
    ],
    measurements: [
      { label: "Denarius", value: "≈ 3.9 g silver, 19 mm — one day's wage for a labourer" },
      { label: "Tyrian shekel", value: "≈ 14 g silver — four denarii; the temple-tax coin" },
      { label: "Didrachma", value: "≈ 6.8 g — the half-shekel temple tax per man" },
      { label: "Lepton (\"mite\")", value: "≈ 2 g bronze, 15 mm — the smallest coin in circulation" },
      { label: "Talent", value: "A weight, not a coin: ≈ 34 kg of silver ≈ 6,000 denarii" },
    ],
    materials: [
      { label: "Silver", value: "Denarii struck at Lyon and Rome; shekels struck at Tyre" },
      { label: "Bronze", value: "Local prutot and lepta struck by Herodian and Roman governors" },
      { label: "Images", value: "Roman coins carried the emperor's head and a divine title — offensive in Jerusalem" },
    ],
    construction: [
      {
        title: "Struck by hand",
        body: "A blank disc of heated metal was set between two engraved dies and hit with a hammer. No two coins are identical, and edges are irregular.",
      },
      {
        title: "Weight is value",
        body: "Coins were trusted by weight and purity, not by decree. Merchants carried scales, and debased coinage was spotted quickly.",
      },
      {
        title: "Money changers",
        body: "Because the temple accepted only Tyrian silver, pilgrims had to exchange — at a commission. That trade is what Jesus overturned in the courts.",
      },
    ],
    purpose: [
      "\"Whose image is this?\" — the denarius question turns on the emperor's portrait stamped in the metal, and on what bears God's image instead.",
      "The widow's two lepta were worth a fraction of a penny, and Jesus counted them as more than every large gift that day.",
      "Thirty pieces of silver was the compensation for a slave gored by an ox — the price set on Jesus by his betrayer.",
    ],
    refs: [
      { ref: "Matthew 22:19", note: "\"Show me the tax money.\"" },
      { ref: "Mark 12:42", note: "Two small copper coins, worth a penny." },
      { ref: "Matthew 17:24", note: "The temple tax and the coin in the fish's mouth." },
      { ref: "Zechariah 11:12", note: "Thirty pieces of silver." },
    ],
  },
];

export const ARTIFACT_BY_ID: Record<string, Artifact> = Object.fromEntries(
  ARTIFACTS.map((a) => [a.id, a]),
);
