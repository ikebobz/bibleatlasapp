/** Places on the Atlas map, in real longitude/latitude, projected to a stylised SVG. */

export type Place = {
  id: string;
  name: string;
  lon: number;
  lat: number;
  kind?: "city" | "region" | "water" | "mountain";
};

export const PLACES: Record<string, Place> = {
  ur: { id: "ur", name: "Ur of the Chaldeans", lon: 46.1, lat: 30.96 },
  babel: { id: "babel", name: "Babel (Babylon)", lon: 44.42, lat: 32.54 },
  nineveh: { id: "nineveh", name: "Nineveh", lon: 43.15, lat: 36.36 },
  haran: { id: "haran", name: "Haran", lon: 39.03, lat: 36.86 },
  damascus: { id: "damascus", name: "Damascus", lon: 36.29, lat: 33.51 },
  shechem: { id: "shechem", name: "Shechem", lon: 35.28, lat: 32.21 },
  bethel: { id: "bethel", name: "Bethel", lon: 35.22, lat: 31.93 },
  hebron: { id: "hebron", name: "Hebron", lon: 35.1, lat: 31.53 },
  jerusalem: { id: "jerusalem", name: "Jerusalem", lon: 35.23, lat: 31.78 },
  bethlehem: { id: "bethlehem", name: "Bethlehem", lon: 35.2, lat: 31.7 },
  beersheba: { id: "beersheba", name: "Beersheba", lon: 34.79, lat: 31.25 },
  dothan: { id: "dothan", name: "Dothan", lon: 35.23, lat: 32.41 },
  samaria: { id: "samaria", name: "Samaria", lon: 35.19, lat: 32.28 },
  sychar: { id: "sychar", name: "Sychar (Jacob's well)", lon: 35.28, lat: 32.2 },
  "jacobs-well": { id: "jacobs-well", name: "Jacob's Well", lon: 35.284, lat: 32.211 },
  "mount-gerizim": { id: "mount-gerizim", name: "Mount Gerizim", lon: 35.273, lat: 32.199, kind: "mountain" },
  judea: { id: "judea", name: "Judea", lon: 35.2, lat: 31.75, kind: "region" },
  galilee: { id: "galilee", name: "Galilee", lon: 35.42, lat: 32.75, kind: "region" },
  jericho: { id: "jericho", name: "Jericho", lon: 35.44, lat: 31.86 },
  nazareth: { id: "nazareth", name: "Nazareth", lon: 35.3, lat: 32.7 },
  capernaum: { id: "capernaum", name: "Capernaum", lon: 35.57, lat: 32.88 },
  cana: { id: "cana", name: "Cana", lon: 35.34, lat: 32.75 },
  aenon: { id: "aenon", name: "Aenon near Salim", lon: 35.55, lat: 32.34 },
  perea: { id: "perea", name: "Perea (beyond Jordan)", lon: 35.7, lat: 31.9, kind: "region" },
  goshen: { id: "goshen", name: "Goshen", lon: 31.8, lat: 30.8, kind: "region" },
  egypt: { id: "egypt", name: "Egypt", lon: 31.2, lat: 29.9, kind: "region" },
  canaan: { id: "canaan", name: "Canaan", lon: 35.2, lat: 31.95, kind: "region" },
  negev: { id: "negev", name: "The Negev", lon: 34.9, lat: 30.9, kind: "region" },
  eden: { id: "eden", name: "Eden (traditional region)", lon: 44.5, lat: 33.6, kind: "region" },
  ararat: { id: "ararat", name: "Mountains of Ararat", lon: 44.3, lat: 39.7, kind: "mountain" },
  sinai: { id: "sinai", name: "Mount Sinai", lon: 33.97, lat: 28.54, kind: "mountain" },
  sodom: { id: "sodom", name: "Sodom", lon: 35.4, lat: 31.2 },
  antioch: { id: "antioch", name: "Antioch", lon: 36.16, lat: 36.2 },
  tarsus: { id: "tarsus", name: "Tarsus", lon: 34.9, lat: 36.92 },
  ephesus: { id: "ephesus", name: "Ephesus", lon: 27.34, lat: 37.95 },
  patmos: { id: "patmos", name: "Patmos", lon: 26.55, lat: 37.31, kind: "region" },
  smyrna: { id: "smyrna", name: "Smyrna", lon: 27.14, lat: 38.42 },
  pergamum: { id: "pergamum", name: "Pergamum", lon: 27.18, lat: 39.13 },
  thyatira: { id: "thyatira", name: "Thyatira", lon: 27.84, lat: 38.92 },
  sardis: { id: "sardis", name: "Sardis", lon: 28.04, lat: 38.49 },
  "philadelphia-asia": { id: "philadelphia-asia", name: "Philadelphia", lon: 28.52, lat: 38.35 },
  laodicea: { id: "laodicea", name: "Laodicea", lon: 29.11, lat: 37.84 },
  corinth: { id: "corinth", name: "Corinth", lon: 22.93, lat: 37.94 },
  athens: { id: "athens", name: "Athens", lon: 23.73, lat: 37.98 },
  philippi: { id: "philippi", name: "Philippi", lon: 24.29, lat: 41.01 },
  thessalonica: { id: "thessalonica", name: "Thessalonica", lon: 22.94, lat: 40.64 },
  rome: { id: "rome", name: "Rome", lon: 12.5, lat: 41.9 },
  caesarea: { id: "caesarea", name: "Caesarea Maritima", lon: 34.89, lat: 32.5 },
  joppa: { id: "joppa", name: "Joppa", lon: 34.75, lat: 32.05 },
  cyprus: { id: "cyprus", name: "Cyprus", lon: 33.2, lat: 35.1, kind: "region" },

  /* ── Abraham ── */
  moriah: { id: "moriah", name: "Mount Moriah", lon: 35.235, lat: 31.778, kind: "mountain" },
  gerar: { id: "gerar", name: "Gerar", lon: 34.6, lat: 31.4 },
  mamre: { id: "mamre", name: "Mamre", lon: 35.1, lat: 31.56 },

  /* ── Exodus ── */
  ramesses: { id: "ramesses", name: "Rameses", lon: 31.83, lat: 30.8 },
  succoth: { id: "succoth", name: "Succoth", lon: 32.15, lat: 30.55 },
  "red-sea-crossing": { id: "red-sea-crossing", name: "The Sea crossing", lon: 32.55, lat: 30.05, kind: "water" },
  marah: { id: "marah", name: "Marah", lon: 33.0, lat: 29.5 },
  elim: { id: "elim", name: "Elim", lon: 33.15, lat: 29.1 },
  rephidim: { id: "rephidim", name: "Rephidim", lon: 33.7, lat: 28.8 },
  kadesh: { id: "kadesh", name: "Kadesh-barnea", lon: 34.5, lat: 30.68 },
  nebo: { id: "nebo", name: "Mount Nebo", lon: 35.73, lat: 31.77, kind: "mountain" },
  paran: { id: "paran", name: "Wilderness of Paran", lon: 34.75, lat: 29.7, kind: "region" },
  "mount-hor": { id: "mount-hor", name: "Mount Hor (traditional)", lon: 35.4, lat: 30.32, kind: "mountain" },
  "ezion-geber": { id: "ezion-geber", name: "Ezion-geber", lon: 34.97, lat: 29.53 },
  "plains-of-moab": { id: "plains-of-moab", name: "Plains of Moab", lon: 35.62, lat: 31.82, kind: "region" },

  /* ── Jacob ── */
  gilead: { id: "gilead", name: "Hill country of Gilead", lon: 35.75, lat: 32.35, kind: "region" },
  mahanaim: { id: "mahanaim", name: "Mahanaim", lon: 35.72, lat: 32.2 },
  peniel: { id: "peniel", name: "Peniel (Penuel)", lon: 35.72, lat: 32.15 },
  "succoth-jacob": { id: "succoth-jacob", name: "Succoth (Transjordan)", lon: 35.61, lat: 32.18 },

  /* ── Joshua ── */
  shittim: { id: "shittim", name: "Shittim", lon: 35.62, lat: 31.86 },
  gilgal: { id: "gilgal", name: "Gilgal", lon: 35.5, lat: 31.87 },
  ai: { id: "ai", name: "Ai", lon: 35.27, lat: 31.92 },
  gibeon: { id: "gibeon", name: "Gibeon", lon: 35.18, lat: 31.85 },
  makkedah: { id: "makkedah", name: "Makkedah", lon: 34.93, lat: 31.68 },
  hazor: { id: "hazor", name: "Hazor", lon: 35.57, lat: 33.02 },
  shiloh: { id: "shiloh", name: "Shiloh", lon: 35.29, lat: 32.06 },

  /* ── Jesus' ministry ── */
  bethabara: { id: "bethabara", name: "Bethany beyond the Jordan", lon: 35.55, lat: 31.84 },
  wilderness: { id: "wilderness", name: "The Judean wilderness", lon: 35.35, lat: 31.75, kind: "region" },
  "caesarea-philippi": { id: "caesarea-philippi", name: "Caesarea Philippi", lon: 35.69, lat: 33.25 },
  bethany: { id: "bethany", name: "Bethany", lon: 35.26, lat: 31.77 },
  olives: { id: "olives", name: "Mount of Olives", lon: 35.245, lat: 31.778, kind: "mountain" },
  gethsemane: { id: "gethsemane", name: "Gethsemane", lon: 35.24, lat: 31.779 },
  golgotha: { id: "golgotha", name: "Golgotha", lon: 35.229, lat: 31.7784 },
  emmaus: { id: "emmaus", name: "Emmaus", lon: 35.02, lat: 31.84 },
  temple: { id: "temple", name: "The Temple courts", lon: 35.2354, lat: 31.7781 },
  "upper-room": { id: "upper-room", name: "The Upper Room", lon: 35.2295, lat: 31.7717 },
  "pool-of-siloam": { id: "pool-of-siloam", name: "Pool of Siloam", lon: 35.2354, lat: 31.7703 },
  bethesda: { id: "bethesda", name: "Pool of Bethesda", lon: 35.2365, lat: 31.7815 },

  /* ── Paul ── */
  salamis: { id: "salamis", name: "Salamis", lon: 33.9, lat: 35.18 },
  paphos: { id: "paphos", name: "Paphos", lon: 32.42, lat: 34.77 },
  perga: { id: "perga", name: "Perga", lon: 30.85, lat: 36.96 },
  "pisidian-antioch": { id: "pisidian-antioch", name: "Antioch in Pisidia", lon: 31.19, lat: 38.31 },
  iconium: { id: "iconium", name: "Iconium", lon: 32.49, lat: 37.87 },
  lystra: { id: "lystra", name: "Lystra", lon: 32.45, lat: 37.58 },
  derbe: { id: "derbe", name: "Derbe", lon: 33.35, lat: 37.35 },
  attalia: { id: "attalia", name: "Attalia", lon: 30.7, lat: 36.88 },
  troas: { id: "troas", name: "Troas", lon: 26.16, lat: 39.75 },
  neapolis: { id: "neapolis", name: "Neapolis", lon: 24.41, lat: 40.94 },
  berea: { id: "berea", name: "Berea", lon: 22.2, lat: 40.52 },
  miletus: { id: "miletus", name: "Miletus", lon: 27.28, lat: 37.53 },
  tyre: { id: "tyre", name: "Tyre", lon: 35.2, lat: 33.27 },
  ptolemais: { id: "ptolemais", name: "Ptolemais", lon: 35.07, lat: 32.93 },
  myra: { id: "myra", name: "Myra", lon: 29.98, lat: 36.25 },
  "fair-havens": { id: "fair-havens", name: "Fair Havens, Crete", lon: 24.9, lat: 34.92 },
  malta: { id: "malta", name: "Malta", lon: 14.4, lat: 35.9, kind: "region" },
  syracuse: { id: "syracuse", name: "Syracuse", lon: 15.29, lat: 37.07 },
  rhegium: { id: "rhegium", name: "Rhegium", lon: 15.65, lat: 38.11 },
  puteoli: { id: "puteoli", name: "Puteoli", lon: 14.12, lat: 40.82 },
  sidon: { id: "sidon", name: "Sidon", lon: 35.37, lat: 33.56 },

  /* ── Jonah ── */
  tarshish: { id: "tarshish", name: "Tarshish (far west)", lon: 10.4, lat: 37.2, kind: "region" },
};


/** Map viewport in degrees. */
export const BOUNDS = { lon0: 10, lon1: 50, lat0: 25.5, lat1: 42.5 };
export const VIEW = { w: 1000, h: 520 };

export function project(lon: number, lat: number): [number, number] {
  const x = ((lon - BOUNDS.lon0) / (BOUNDS.lon1 - BOUNDS.lon0)) * VIEW.w;
  const y = ((BOUNDS.lat1 - lat) / (BOUNDS.lat1 - BOUNDS.lat0)) * VIEW.h;
  return [x, y];
}

export function haversineKm(a: Place, b: Place): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function routeDistanceKm(placeIds: string[]): number {
  let total = 0;
  for (let i = 1; i < placeIds.length; i++) {
    const a = PLACES[placeIds[i - 1]];
    const b = PLACES[placeIds[i]];
    if (a && b) total += haversineKm(a, b);
  }
  return total;
}

/** Stylised coastlines — approximated outlines, not survey data. */
export const SEAS: { id: string; label: string; points: [number, number][] }[] = [
  {
    id: "mediterranean",
    label: "The Great Sea",
    points: [
      [10, 41.4],
      [12.5, 37.5],
      [18, 34.5],
      [24, 31.6],
      [30, 31.3],
      [32.3, 31.2],
      [34.5, 31.5],
      [34.9, 32.8],
      [35.4, 34.4],
      [35.9, 35.9],
      [36.1, 36.5],
      [34.6, 36.7],
      [33.0, 36.3],
      [31.0, 36.6],
      [29.4, 36.2],
      [27.5, 36.4],
      [25.5, 35.2],
      [23.5, 35.4],
      [21.5, 37.2],
      [19.5, 39.5],
      [17.5, 41.5],
      [13.5, 43.5],
      [10, 43.8],
    ],
  },
  {
    id: "black-sea",
    label: "Black Sea",
    points: [
      [28, 41.2],
      [32, 41.8],
      [37, 41.5],
      [41, 42.5],
      [41, 45],
      [28, 45],
    ],
  },
  {
    id: "gulf",
    label: "Persian Gulf",
    points: [
      [47.6, 30.4],
      [49.2, 29.4],
      [50, 28.2],
      [50, 25.5],
      [47.4, 25.5],
      [47.2, 29.6],
    ],
  },
  {
    id: "red-sea",
    label: "Red Sea",
    points: [
      [32.5, 29.9],
      [34.1, 27.9],
      [36.5, 25.5],
      [39.5, 25.5],
      [36.4, 28.6],
      [34.6, 29.6],
      [34.4, 28.2],
      [33.2, 29.6],
    ],
  },
];

export const RIVERS: { id: string; label: string; points: [number, number][] }[] = [
  {
    id: "nile",
    label: "Nile",
    points: [
      [32.9, 25.5],
      [32.7, 26.6],
      [31.5, 28.5],
      [31.2, 30.1],
      [31.0, 31.2],
    ],
  },
  {
    id: "euphrates",
    label: "Euphrates",
    points: [
      [38.3, 37.4],
      [39.0, 36.0],
      [40.5, 35.0],
      [42.5, 33.8],
      [44.4, 32.5],
      [46.1, 31.2],
      [47.5, 30.5],
    ],
  },
  {
    id: "tigris",
    label: "Tigris",
    points: [
      [41.0, 37.4],
      [43.0, 36.2],
      [44.4, 33.3],
      [45.6, 32.0],
      [47.4, 30.7],
    ],
  },
  {
    id: "jordan",
    label: "Jordan",
    points: [
      [35.62, 33.25],
      [35.58, 32.78],
      [35.56, 32.2],
      [35.52, 31.72],
    ],
  },
];

export const LAKES: { id: string; label: string; cx: number; cy: number; rx: number; ry: number }[] =
  [
    { id: "galilee", label: "Sea of Galilee", cx: 35.59, cy: 32.82, rx: 0.11, ry: 0.14 },
    { id: "dead-sea", label: "Salt Sea", cx: 35.48, cy: 31.4, rx: 0.11, ry: 0.35 },
  ];

/**
 * Present-day overlay: rough modern national borders and today's city names for
 * the same ground. Indicative outlines for orientation, not survey data.
 */
export const MODERN_BORDERS: { id: string; label: string; labelAt: [number, number]; points: [number, number][] }[] = [
  {
    id: "israel-palestine",
    label: "Israel / Palestine",
    labelAt: [34.6, 31.0],
    points: [
      [34.27, 31.22],
      [34.55, 31.55],
      [34.95, 32.4],
      [35.1, 33.09],
      [35.62, 33.27],
      [35.55, 32.72],
      [35.57, 31.76],
      [35.45, 31.49],
      [35.15, 30.05],
      [34.27, 31.22],
    ],
  },
  {
    id: "jordan",
    label: "Jordan",
    labelAt: [36.9, 31.3],
    points: [
      [35.62, 33.27],
      [38.8, 33.35],
      [39.2, 32.15],
      [37.0, 31.0],
      [36.75, 29.5],
      [34.96, 29.35],
      [35.15, 30.05],
      [35.45, 31.49],
      [35.57, 31.76],
      [35.55, 32.72],
      [35.62, 33.27],
    ],
  },
  {
    id: "lebanon-syria",
    label: "Lebanon / Syria",
    labelAt: [38.0, 34.9],
    points: [
      [35.1, 33.09],
      [35.62, 33.27],
      [38.8, 33.35],
      [40.9, 34.4],
      [42.35, 37.1],
      [36.65, 36.8],
      [35.9, 35.9],
      [35.45, 34.5],
      [35.1, 33.09],
    ],
  },
  {
    id: "iraq",
    label: "Iraq",
    labelAt: [43.3, 33.4],
    points: [
      [38.8, 33.35],
      [40.9, 34.4],
      [42.35, 37.1],
      [44.8, 37.15],
      [46.1, 35.0],
      [47.7, 33.0],
      [47.9, 30.5],
      [46.5, 29.1],
      [44.7, 29.2],
      [39.2, 32.15],
      [38.8, 33.35],
    ],
  },
  {
    id: "turkey",
    label: "Türkiye",
    labelAt: [33.5, 39.2],
    points: [
      [26.0, 40.0],
      [26.2, 41.7],
      [35.0, 42.1],
      [41.0, 41.4],
      [44.8, 39.7],
      [44.8, 37.15],
      [42.35, 37.1],
      [36.65, 36.8],
      [36.0, 36.2],
      [32.8, 36.1],
      [29.0, 36.3],
      [27.2, 38.4],
      [26.0, 40.0],
    ],
  },
  {
    id: "egypt",
    label: "Egypt",
    labelAt: [30.0, 28.0],
    points: [
      [24.7, 31.4],
      [24.7, 25.5],
      [34.0, 25.5],
      [34.9, 29.4],
      [34.27, 31.22],
      [31.5, 31.5],
      [24.7, 31.4],
    ],
  },
  {
    id: "saudi",
    label: "Saudi Arabia",
    labelAt: [43.0, 27.5],
    points: [
      [34.96, 29.35],
      [36.75, 29.5],
      [37.0, 31.0],
      [39.2, 32.15],
      [44.7, 29.2],
      [46.5, 29.1],
      [48.5, 28.5],
      [50.0, 25.5],
      [38.0, 25.5],
      [34.96, 29.35],
    ],
  },
  {
    id: "greece",
    label: "Greece",
    labelAt: [21.8, 39.6],
    points: [
      [20.0, 39.7],
      [22.6, 41.3],
      [26.0, 41.4],
      [26.2, 40.0],
      [23.7, 37.8],
      [22.2, 36.7],
      [21.1, 38.3],
      [20.0, 39.7],
    ],
  },
  {
    id: "italy",
    label: "Italy",
    labelAt: [13.4, 42.6],
    points: [
      [10.0, 44.2],
      [13.6, 45.6],
      [16.2, 41.9],
      [18.5, 40.1],
      [16.1, 38.9],
      [15.6, 38.0],
      [12.4, 41.3],
      [10.0, 42.9],
      [10.0, 44.2],
    ],
  },
  {
    id: "cyprus-modern",
    label: "Cyprus",
    labelAt: [33.4, 34.7],
    points: [
      [32.3, 34.6],
      [34.6, 35.7],
      [34.0, 35.0],
      [33.9, 34.6],
      [32.3, 34.6],
    ],
  },
];

/** Today's name for the same ground, keyed by ancient place id. */
export const MODERN_NAMES: Record<string, string> = {
  ur: "Tell el-Muqayyar, Iraq",
  babel: "Hillah, Iraq",
  nineveh: "Mosul, Iraq",
  haran: "Harran, Türkiye",
  damascus: "Damascus, Syria",
  shechem: "Nablus, Palestine",
  bethel: "Beitin, West Bank",
  hebron: "Hebron, West Bank",
  jerusalem: "Jerusalem",
  bethlehem: "Bethlehem, West Bank",
  beersheba: "Be'er Sheva, Israel",
  dothan: "Tell Dothan, West Bank",
  samaria: "Sebastia, West Bank",
  sychar: "Askar, Nablus",
  "jacobs-well": "Balata, Nablus",
  "mount-gerizim": "Jabal Gerizim, West Bank",
  judea: "Judean hills",
  galilee: "Northern Israel",
  jericho: "Jericho, West Bank",
  nazareth: "Nazareth, Israel",
  capernaum: "Kfar Nahum, Israel",
  cana: "Kafr Kanna, Israel",
  aenon: "Jordan Valley",
  perea: "NW Jordan",
  goshen: "Eastern Nile Delta, Egypt",
  egypt: "Egypt",
  canaan: "Israel / Palestine",
  negev: "Negev, Israel",
  eden: "Southern Iraq (traditional)",
  ararat: "Mt. Ararat, Türkiye",
  sinai: "Sinai, Egypt",
  sodom: "Dead Sea plain, Jordan",
  antioch: "Antakya, Türkiye",
  tarsus: "Tarsus, Türkiye",
  ephesus: "Selçuk, Türkiye",
  patmos: "Patmos, Greece",
  smyrna: "İzmir, Türkiye",
  pergamum: "Bergama, Türkiye",
  thyatira: "Akhisar, Türkiye",
  sardis: "Sart, Türkiye",
  "philadelphia-asia": "Alaşehir, Türkiye",
  laodicea: "Near Denizli, Türkiye",
  corinth: "Korinthos, Greece",
  athens: "Athens, Greece",
  philippi: "Filippoi, Greece",
  thessalonica: "Thessaloniki, Greece",
  rome: "Rome, Italy",
  caesarea: "Caesarea, Israel",
  joppa: "Jaffa, Tel Aviv",
  cyprus: "Cyprus",
  paran: "Central Sinai / northern Arabian wilderness region",
  "mount-hor": "Jabal Harun near Petra (traditional)",
  "ezion-geber": "Northern Gulf of Aqaba",
  "plains-of-moab": "Jordan Valley opposite Jericho",
  gilead: "Northwestern Jordan",
  mahanaim: "Jabbok region, Jordan",
  peniel: "Jabbok valley, Jordan",
  "succoth-jacob": "Jordan Valley, east of the Jordan",
};
