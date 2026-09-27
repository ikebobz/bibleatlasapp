/**
 * Realistic travel corridors between journey stops.
 *
 * Journeys used to be drawn as straight lines between stops, which is neither
 * how people travelled nor how the distances actually worked out. Each
 * segment below carries curated waypoints taken from the attested ancient
 * roads and sea lanes (the Euphrates caravan route, the Via Maris, the King's
 * Highway, the Roman roads of Asia Minor, the coastal shipping lanes). The
 * waypoints are then smoothed into a gentle curve, so the drawn route bends
 * the way real travel bent.
 *
 * No network calls: everything here is static data plus maths.
 */

import { PLACES } from "./geo";

export type Corridor = {
  /** Intermediate [lon, lat] points along the historic route. */
  via: [number, number][];
  /** Sea leg — ships sailed close to the direct line, land routes did not. */
  sea?: boolean;
  /** Broad travel mode, used for styling and mixed-route estimates. */
  mode: RouteMode;
  /** How firmly the drawn corridor can be reconstructed. */
  accuracy: RouteAccuracy;
  /** Honest description of what the geometry represents. */
  note: string;
};

export type RouteMode = "walking" | "maritime";
export type RouteAccuracy = "verified" | "approximate" | "schematic";

export type RouteSegment = {
  from: string;
  to: string;
  index: number;
  geometry: [number, number][];
  mode: RouteMode;
  accuracy: RouteAccuracy;
  note: string;
  distanceKm: number;
};

/** Extra distance walked on land compared with the straight line, when no corridor is curated. */
export const LAND_DETOUR = 1.2;

const C = (
  via: [number, number][],
  sea = false,
  accuracy: RouteAccuracy = "approximate",
  note?: string,
): Corridor => ({
  via,
  sea,
  mode: sea ? "maritime" : "walking",
  accuracy,
  note:
    note ??
    (sea
      ? "Approximate sailing corridor reconstructed from the recorded ports and known coastal sea lanes."
      : "Approximate travel corridor reconstructed from the recorded stops, terrain, and known ancient roads."),
});

/** Keyed "fromPlaceId>toPlaceId"; the reverse direction reuses the same corridor. */
export const CORRIDORS: Record<string, Corridor> = {
  /* ── Abraham: the Euphrates caravan road and the Way of Shur ── */
  "ur>haran": C([
    [44.42, 32.54],
    [43.3, 33.4],
    [42.0, 34.4],
    [40.6, 35.5],
    [39.6, 36.5],
  ]),
  "haran>shechem": C([
    [38.2, 36.55],
    [37.16, 36.2],
    [36.75, 35.13],
    [36.4, 34.35],
    [36.29, 33.51],
    [35.85, 33.05],
    [35.5, 32.75],
    [35.35, 32.45],
  ]),
  "shechem>bethel": C([[35.24, 32.06]]),
  "bethel>negev": C([
    [35.19, 31.72],
    [35.05, 31.4],
    [34.95, 31.1],
  ]),
  "negev>egypt": C([
    [34.4, 31.05],
    [33.6, 31.1],
    [32.6, 31.15],
    [31.9, 30.8],
    [31.5, 30.3],
  ]),
  "egypt>bethel": C([
    [31.5, 30.3],
    [31.9, 30.8],
    [32.6, 31.15],
    [33.6, 31.1],
    [34.4, 31.05],
    [34.95, 31.25],
    [35.15, 31.6],
  ]),
  "bethel>hebron": C([
    [35.21, 31.78],
    [35.15, 31.65],
  ]),
  "hebron>beersheba": C([[34.95, 31.38]]),
  "beersheba>moriah": C([
    [34.98, 31.42],
    [35.1, 31.6],
    [35.18, 31.72],
  ]),

  /* ── Exodus: the wilderness way, not the coastal road ── */
  "ramesses>succoth": C([[32.0, 30.68]]),
  "succoth>red-sea-crossing": C([[32.35, 30.3]]),
  "red-sea-crossing>marah": C([[32.8, 29.8]]),
  "marah>elim": C([[33.05, 29.3]]),
  "elim>rephidim": C([
    [33.4, 28.95],
    [33.6, 28.85],
  ]),
  "rephidim>sinai": C([[33.85, 28.65]]),
  "sinai>kadesh": C([
    [34.2, 29.1],
    [34.5, 29.8],
    [34.6, 30.35],
  ]),
  "kadesh>nebo": C([
    [35.0, 30.5],
    [35.5, 30.7],
    [35.75, 31.2],
    [35.8, 31.6],
  ]),

  /* ── Joshua / Judea: the Jordan valley and the ridge road ── */
  "shittim>gilgal": C([[35.56, 31.87]]),
  "gilgal>jericho": C([[35.47, 31.87]]),
  "jericho>ai": C([
    [35.4, 31.9],
    [35.33, 31.92],
  ]),
  "jericho>jerusalem": C([
    [35.38, 31.84],
    [35.3, 31.8],
  ]),
  "nazareth>jerusalem": C([
    [35.45, 32.5],
    [35.52, 32.1],
    [35.5, 31.9],
    [35.4, 31.83],
  ]),
  "capernaum>jerusalem": C([
    [35.58, 32.6],
    [35.55, 32.2],
    [35.5, 31.9],
    [35.4, 31.83],
  ]),
  "jerusalem>emmaus": C([[35.13, 31.82]]),
  "bethany>olives": C([[35.25, 31.78]]),

  /* ── Paul, first journey (Acts 13-14) ── */
  "antioch>salamis": C(
    [
      [35.93, 36.12],
      [35.4, 35.85],
      [34.6, 35.4],
    ],
    true,
  ),
  "salamis>paphos": C([
    [33.6, 34.95],
    [32.95, 34.68],
    [32.55, 34.66],
  ]),
  "paphos>perga": C(
    [
      [32.2, 35.1],
      [31.4, 35.9],
      [30.9, 36.6],
    ],
    true,
  ),
  "perga>pisidian-antioch": C([
    [30.9, 37.25],
    [30.95, 37.75],
    [31.05, 38.1],
  ]),
  "pisidian-antioch>iconium": C([
    [31.7, 38.2],
    [32.2, 38.0],
  ]),
  "iconium>lystra": C([[32.42, 37.73]]),
  "lystra>derbe": C([[32.9, 37.43]]),
  "derbe>attalia": C([
    [32.45, 37.58],
    [32.49, 37.87],
    [31.7, 38.2],
    [31.19, 38.31],
    [30.95, 37.75],
    [30.9, 37.25],
    [30.85, 36.96],
  ]),
  "attalia>antioch": C(
    [
      [31.4, 36.4],
      [32.6, 36.05],
      [33.9, 35.95],
      [34.9, 36.3],
      [35.93, 36.12],
    ],
    true,
  ),

  /* ── Paul, second and third journeys ── */
  "antioch>tarsus": C([
    [36.0, 36.6],
    [35.6, 36.9],
    [35.2, 36.95],
  ]),
  "tarsus>lystra": C([
    [34.6, 37.2],
    [34.0, 37.5],
    [33.2, 37.55],
  ]),
  "lystra>troas": C([
    [31.5, 38.1],
    [30.0, 38.6],
    [28.4, 39.0],
    [27.0, 39.4],
  ]),
  "troas>neapolis": C([[25.5, 40.45]], true),
  "neapolis>philippi": C([[24.35, 40.98]]),
  "philippi>thessalonica": C([
    [23.9, 40.85],
    [23.3, 40.72],
  ]),
  "thessalonica>berea": C([[22.6, 40.6]]),
  "berea>athens": C(
    [
      [22.6, 39.9],
      [23.4, 38.8],
      [23.9, 38.2],
    ],
    true,
  ),
  "athens>corinth": C([[23.35, 37.96]]),
  "corinth>ephesus": C(
    [
      [23.8, 37.6],
      [25.5, 37.4],
      [26.9, 37.7],
    ],
    true,
  ),
  "ephesus>caesarea": C(
    [
      [28.5, 36.7],
      [30.5, 35.8],
      [33.0, 34.9],
      [34.4, 33.3],
    ],
    true,
  ),
  "caesarea>antioch": C([
    [35.0, 33.3],
    [35.5, 34.5],
    [35.9, 35.6],
  ]),
  "ephesus>philippi": C(
    [
      [26.5, 38.6],
      [25.6, 40.0],
      [24.6, 40.8],
    ],
    true,
  ),
  "philippi>corinth": C([
    [23.4, 40.6],
    [22.6, 39.8],
    [22.9, 38.6],
  ]),
  "corinth>troas": C(
    [
      [23.6, 38.4],
      [24.8, 39.4],
      [25.9, 39.7],
    ],
    true,
  ),
  "troas>miletus": C(
    [
      [26.4, 39.0],
      [26.9, 38.0],
    ],
    true,
  ),
  "miletus>tyre": C(
    [
      [28.6, 36.5],
      [31.5, 35.3],
      [33.8, 34.6],
      [35.1, 33.6],
    ],
    true,
  ),
  "tyre>caesarea": C([[35.05, 32.93]], true),
  "caesarea>jerusalem": C([
    [35.0, 32.35],
    [35.15, 32.0],
  ]),

  /* ── Paul's voyage to Rome (Acts 27-28) ── */
  "caesarea>sidon": C([[35.05, 33.1]], true),
  "sidon>myra": C(
    [
      [35.2, 34.6],
      [33.6, 35.8],
      [31.6, 36.3],
      [30.4, 36.2],
    ],
    true,
  ),
  "myra>fair-havens": C(
    [
      [28.6, 35.7],
      [26.9, 35.2],
      [25.8, 34.9],
    ],
    true,
  ),
  "fair-havens>malta": C(
    [
      [23.2, 34.7],
      [20.5, 34.8],
      [17.0, 35.3],
    ],
    true,
  ),
  "malta>syracuse": C([[14.7, 36.6]], true),
  "syracuse>rhegium": C([[15.6, 37.6]], true),
  "rhegium>puteoli": C(
    [
      [15.3, 39.2],
      [14.6, 40.2],
    ],
    true,
  ),
  "puteoli>rome": C([
    [13.9, 41.2],
    [13.0, 41.5],
  ]),

  /* ── Jonah ── */
  "joppa>tarshish": C(
    [
      [33.0, 33.3],
      [29.0, 34.0],
      [24.5, 34.4],
      [18.0, 34.8],
      [13.5, 36.4],
    ],
    true,
  ),
  "nineveh>joppa": C([
    [42.0, 36.3],
    [39.5, 36.6],
    [37.2, 36.2],
    [36.3, 34.6],
    [36.0, 33.3],
    [35.4, 32.6],
  ]),

  /* ── Jesus' ministry: Galilee ridge roads, the lake shore, the Jordan valley ── */
  "nazareth>bethabara": C([
    [35.38, 32.6],
    [35.5, 32.4],
    [35.55, 32.3],
    [35.55, 32.05],
  ]),
  "bethabara>wilderness": C([
    [35.48, 31.82],
    [35.4, 31.78],
  ]),
  "wilderness>cana": C([
    [35.4, 31.83],
    [35.5, 32.05],
    [35.55, 32.3],
    [35.5, 32.55],
    [35.4, 32.7],
  ]),
  "cana>capernaum": C([
    [35.42, 32.8],
    [35.5, 32.86],
  ]),
  "capernaum>sychar": C([
    [35.55, 32.78],
    [35.55, 32.6],
    [35.45, 32.45],
    [35.33, 32.32],
  ]),
  "sychar>caesarea-philippi": C([
    [35.35, 32.4],
    [35.48, 32.6],
    [35.58, 32.85],
    [35.62, 33.1],
  ]),
  "caesarea-philippi>jericho": C([
    [35.62, 33.05],
    [35.6, 32.8],
    [35.57, 32.5],
    [35.55, 32.1],
    [35.52, 31.95],
  ]),
  "jericho>bethany": C([
    [35.38, 31.84],
    [35.31, 31.8],
  ]),
  "bethany>jerusalem": C([[35.245, 31.778]]),

  /* ── Joshua: the central ridge route and the northern plain ── */
  "ai>shechem": C([
    [35.28, 32.0],
    [35.29, 32.09],
    [35.3, 32.16],
  ]),
  "shechem>gibeon": C([
    [35.28, 32.1],
    [35.25, 31.98],
    [35.21, 31.9],
  ]),
  "gibeon>makkedah": C([
    [35.1, 31.84],
    [34.99, 31.78],
    [34.95, 31.72],
  ]),
  "makkedah>hazor": C([
    [34.99, 31.85],
    [35.05, 32.2],
    [35.18, 32.5],
    [35.35, 32.68],
    [35.5, 32.85],
  ]),
  "hazor>shiloh": C([
    [35.55, 32.8],
    [35.5, 32.55],
    [35.42, 32.4],
    [35.32, 32.2],
  ]),

  /* ── Passion week: walked between the gates, valleys and pools ── */
  "olives>temple": C([
    [35.2405, 31.7787],
    [35.2381, 31.7784],
  ]),
  "temple>bethesda": C([[35.2374, 31.7801]]),
  "bethesda>pool-of-siloam": C([
    [35.2372, 31.7772],
    [35.2366, 31.7728],
  ]),
  "pool-of-siloam>upper-room": C([
    [35.2322, 31.7699],
    [35.2299, 31.7706],
  ]),
  "upper-room>gethsemane": C([
    [35.2318, 31.7756],
    [35.2372, 31.7784],
  ]),
  "gethsemane>golgotha": C([
    [35.2366, 31.7806],
    [35.2318, 31.7811],
  ]),
  "golgotha>emmaus": C([
    [35.2201, 31.7804],
    [35.16, 31.8],
    [35.09, 31.82],
  ]),

  /* ── Paul, third journey: overland through the Cilician Gates ── */
  "antioch>ephesus": C([
    [36.0, 36.6],
    [35.2, 36.95],
    [34.4, 37.35],
    [33.2, 37.55],
    [31.7, 38.1],
    [30.2, 38.4],
    [28.8, 38.3],
    [27.8, 38.1],
  ]),

  /* ── Jesus through Samaria: the central ridge road ── */
  "judea>samaria": C([[35.23, 31.95], [35.25, 32.1]]),
  "samaria>sychar": C([[35.23, 32.25]]),
  "sychar>jacobs-well": C([[35.282, 32.205]], false, "verified", "The well lies beside the ancient Shechem and Sychar setting described in John 4."),
  "jacobs-well>mount-gerizim": C([[35.28, 32.205]], false, "verified", "A short local connection from Jacob's Well to Mount Gerizim, which overlooks the site."),
  "mount-gerizim>sychar": C([[35.279, 32.205]], false, "verified", "A short local connection returning to the Sychar area beneath Mount Gerizim."),
  "sychar>galilee": C([[35.3, 32.35], [35.32, 32.52], [35.38, 32.68]]),

  /* ── Revelation: Patmos and the Roman courier circuit ── */
  "patmos>ephesus": C([[26.72, 37.45], [27.02, 37.7]], true, "approximate", "Approximate Aegean sailing corridor from Patmos to the port serving Ephesus."),
  "ephesus>smyrna": C([[27.2, 38.15], [27.11, 38.3]], false, "verified", "The established Roman road corridor followed the Aegean coastal plain north to Smyrna."),
  "smyrna>pergamum": C([[27.02, 38.65], [27.08, 38.95]], false, "verified", "The established Roman road corridor continued north from Smyrna toward Pergamum."),
  "pergamum>thyatira": C([[27.35, 39.02], [27.62, 38.95]], false, "verified", "The route follows the well-established inland road from Pergamum to Thyatira."),
  "thyatira>sardis": C([[27.9, 38.78], [28.0, 38.62]], false, "verified", "The route follows the established road south through the Hermus valley."),
  "sardis>philadelphia-asia": C([[28.2, 38.44], [28.38, 38.39]], false, "verified", "The established valley road connected Sardis with Philadelphia."),
  "philadelphia-asia>laodicea": C([[28.7, 38.2], [28.92, 38.02]], false, "verified", "The established Roman road continued southeast through the Lycus valley to Laodicea."),

  /* ── Forty years: only broad, defensible stages are mapped ── */
  "ramesses>red-sea-crossing": C([[32.0, 30.62], [32.3, 30.35]], false, "schematic", "Schematic departure corridor from the eastern Nile delta to an illustrative sea-crossing location."),
  "red-sea-crossing>sinai": C([[32.85, 29.7], [33.2, 29.2], [33.6, 28.8]], false, "schematic", "Schematic wilderness corridor from the debated sea crossing toward traditional Mount Sinai."),
  "sinai>paran": C([[34.15, 28.85], [34.45, 29.25]], false, "schematic", "Schematic movement into the broad Wilderness of Paran; the precise line and many camps are unknown."),
  "paran>kadesh": C([[34.7, 30.0], [34.62, 30.35]], false, "schematic", "Schematic regional movement toward Kadesh; intervening Numbers 33 stations remain unlocated."),
  "kadesh>mount-hor": C([[34.8, 30.55], [35.1, 30.45]], false, "schematic", "Schematic route to the traditional Mount Hor location; both the path and identification remain debated."),
  "mount-hor>ezion-geber": C([[35.25, 30.1], [35.05, 29.8]], false, "schematic", "Schematic wilderness corridor between a traditional Mount Hor and the Gulf of Aqaba."),
  "ezion-geber>plains-of-moab": C([[35.25, 29.8], [35.55, 30.25], [35.75, 30.8], [35.72, 31.4]], false, "schematic", "Schematic movement north through Transjordan; many recorded stations cannot be located securely."),
  "plains-of-moab>nebo": C([[35.68, 31.79]], false, "verified", "The plains of Moab and Mount Nebo are adjoining settings east of the Jordan."),

  /* ── Jacob: outbound ridge road and return through Transjordan ── */
  "beersheba>bethel": C([[34.95, 31.42], [35.12, 31.65], [35.2, 31.82]]),
  "bethel>haran": C([[35.35, 32.4], [35.8, 33.05], [36.3, 33.51], [36.75, 35.13], [38.2, 36.55]]),
  "haran>gilead": C([[38.4, 36.1], [37.6, 35.2], [36.8, 34.2], [36.2, 33.3], [35.9, 32.7]]),
  "gilead>mahanaim": C([[35.74, 32.28]], false, "schematic", "Schematic movement within Gilead; Mahanaim's exact archaeological location is disputed."),
  "mahanaim>peniel": C([[35.72, 32.175]], false, "schematic", "Schematic connection in the Jabbok valley; the exact sites of Mahanaim and Peniel are disputed."),
  "peniel>succoth-jacob": C([[35.67, 32.16]], false, "schematic", "Schematic route west through the Jabbok valley to the proposed Succoth area."),
  "succoth-jacob>shechem": C([[35.53, 32.18], [35.4, 32.2]]),
  "shechem>bethlehem": C([[35.25, 32.05], [35.22, 31.9], [35.22, 31.78]]),
  "bethel>bethlehem": C([[35.23, 31.88], [35.23, 31.78]], false, "approximate", "Approximate central ridge road south from Bethel through Jerusalem toward Bethlehem."),
  "bethlehem>hebron": C([[35.16, 31.62]]),
};

export function corridorFor(from: string, to: string): Corridor | undefined {
  const direct = CORRIDORS[`${from}>${to}`];
  if (direct) return direct;
  const reverse = CORRIDORS[`${to}>${from}`];
  if (!reverse) return undefined;
  return { ...reverse, via: [...reverse.via].reverse() };
}

function kmBetween(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Length of a sampled path in km. */
export function pathLengthKm(path: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += kmBetween(path[i - 1], path[i]);
  return total;
}

/** Catmull-Rom smoothing through the control points, endpoints preserved exactly. */
function smooth(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;
  const out: [number, number][] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? points[i + 1];
    const span = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.min(28, Math.max(6, Math.round(span * 6)));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const at = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([at(p0[0], p1[0], p2[0], p3[0]), at(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  // Keep the endpoints exact: sampling introduces floating point drift.
  out[out.length - 1] = points[points.length - 1];
  return out;
}

/** Smoothed travel path between two places, following the curated corridor when there is one. */
export function segmentPath(fromId: string, toId: string): [number, number][] {
  const a = PLACES[fromId];
  const b = PLACES[toId];
  if (!a || !b) return [];
  const start: [number, number] = [a.lon, a.lat];
  const end: [number, number] = [b.lon, b.lat];
  const corridor = corridorFor(fromId, toId);
  if (!corridor || corridor.via.length === 0) return smooth([start, end]);
  return smooth([start, ...corridor.via, end]);
}

/** Travel distance for a segment: measured along the corridor, or straight line plus a land detour. */
export function segmentDistanceKm(fromId: string, toId: string, bySea = false): number {
  const a = PLACES[fromId];
  const b = PLACES[toId];
  if (!a || !b) return 0;
  const corridor = corridorFor(fromId, toId);
  if (corridor && corridor.via.length > 0) return pathLengthKm(segmentPath(fromId, toId));
  const direct = kmBetween([a.lon, a.lat], [b.lon, b.lat]);
  return bySea ? direct : direct * LAND_DETOUR;
}

/** Full smoothed path across an ordered list of place ids. */
export function routePath(placeIds: string[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 1; i < placeIds.length; i++) {
    const segment = segmentPath(placeIds[i - 1], placeIds[i]);
    if (segment.length === 0) continue;
    out.push(...(out.length === 0 ? segment : segment.slice(1)));
  }
  return out;
}

/** Reusable, ordered route model derived from the journey's stops. */
export function routeSegments(placeIds: string[], defaultSea = false): RouteSegment[] {
  const segments: RouteSegment[] = [];
  for (let index = 1; index < placeIds.length; index++) {
    const from = placeIds[index - 1];
    const to = placeIds[index];
    if (from === to) continue;
    const corridor = corridorFor(from, to);
    const geometry = segmentPath(from, to);
    if (geometry.length < 2) continue;
    const mode = corridor?.mode ?? (defaultSea ? "maritime" : "walking");
    segments.push({
      from,
      to,
      index: index - 1,
      geometry,
      mode,
      accuracy: corridor?.accuracy ?? "schematic",
      note:
        corridor?.note ??
        "Schematic connection between recorded stops; the precise historical route is not known.",
      distanceKm: corridor ? pathLengthKm(geometry) : segmentDistanceKm(from, to, defaultSea),
    });
  }
  return segments;
}

/** Position at a distance fraction along the sampled route, not between stop coordinates. */
export function pointAlongPath(path: [number, number][], progress: number): [number, number] | null {
  if (path.length === 0) return null;
  if (path.length === 1 || progress <= 0) return path[0];
  if (progress >= 1) return path[path.length - 1];
  const lengths = path.slice(1).map((point, index) => kmBetween(path[index], point));
  const target = lengths.reduce((sum, value) => sum + value, 0) * progress;
  let travelled = 0;
  for (let index = 0; index < lengths.length; index++) {
    const next = travelled + lengths[index];
    if (target <= next) {
      const amount = lengths[index] ? (target - travelled) / lengths[index] : 0;
      const a = path[index];
      const b = path[index + 1];
      return [a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount];
    }
    travelled = next;
  }
  return path[path.length - 1];
}
