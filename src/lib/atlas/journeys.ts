/**
 * Journey data for the /journeys section.
 *
 * Each journey is a named, ordered list of stops on the Atlas projection. The
 * reader's contextual panels keep using `Block` maps; these entries power the
 * standalone, full-screen journey pages and the /maps hub.
 */

import { routeSegments, type RouteAccuracy, type RouteMode } from "./corridors";

export type JourneyStop = {
  /** Place id in `PLACES`. */
  place: string;
  label?: string;
  /** One sentence about what happened here. */
  note: string;
  /** Human reference, e.g. "Genesis 12:1". */
  ref?: string;
  /** Reader link target for `ref`. */
  link?: { book: string; chapter: number; verse?: number };
  /** Approximate date or period. */
  when?: string;
  /** Church planted, letter written, or other extra detail. */
  extra?: string;
  /** Editorial label for the moment in the journey story. */
  event?: string;
  /** Related people or concepts that can be discovered elsewhere in the atlas. */
  related?: string[];
};

export type JourneyCategory = "Patriarchs" | "Exodus & Israel" | "Jesus" | "Early Church" | "Prophets & Kings";

export type UnlocatedJourneyStop = {
  name: string;
  ref: string;
  note: string;
};

export type JourneyLeg = {
  id: string;
  name: string;
  short: string;
  /** Mostly by sea rather than on foot. */
  bySea?: boolean;
  stops: JourneyStop[];
};

export type JourneyRouteSegment = {
  origin: JourneyStop;
  destination: JourneyStop;
  routeGeometry: [number, number][];
  routeType: RouteMode;
  historicalAccuracy: RouteAccuracy;
  routeNote: string;
  bibleReferences: string[];
  distanceKm: number;
};

export type JourneyComparisonRoute = {
  id: string;
  name: string;
  shortLabel: string;
  note: string;
  /** Comparison routes provide historical context; they are not part of playback. */
  status: "debated" | "schematic";
  geometry: [number, number][];
  supportingPlaceIds: string[];
};

export type Journey = {
  id: string;
  title: string;
  /** Card headline. */
  tagline: string;
  /** SEO + hero paragraph. */
  description: string;
  era: string;
  /** Chapter to read alongside the map. */
  read: { label: string; book: string; chapter: number };
  category: JourneyCategory;
  featured?: boolean;
  passage: string;
  people: string[];
  aliases: string[];
  context: string;
  comparisonRoutes?: JourneyComparisonRoute[];
  /** Named biblical stations that cannot responsibly be assigned a map pin. */
  unlocatedStops?: UnlocatedJourneyStop[];
  legs: JourneyLeg[];
};

const g = (chapter: number, verse?: number) => ({ book: "genesis", chapter, verse });
const ex = (chapter: number, verse?: number) => ({ book: "exodus", chapter, verse });
const jos = (chapter: number, verse?: number) => ({ book: "joshua", chapter, verse });
const jon = (chapter: number, verse?: number) => ({ book: "jonah", chapter, verse });
const acts = (chapter: number, verse?: number) => ({ book: "acts", chapter, verse });
const jhn = (chapter: number, verse?: number) => ({ book: "john", chapter, verse });
const mt = (chapter: number, verse?: number) => ({ book: "matthew", chapter, verse });
const lk = (chapter: number, verse?: number) => ({ book: "luke", chapter, verse });
const nu = (chapter: number, verse?: number) => ({ book: "numbers", chapter, verse });
const rev = (chapter: number, verse?: number) => ({ book: "revelation", chapter, verse });

export const JOURNEYS: Journey[] = [
  {
    id: "abraham",
    title: "Abraham's Journey",
    tagline: "Ur to Canaan, and the long walk of faith that follows",
    description:
      "Follow Abraham from Ur of the Chaldeans to Haran, into Canaan, down to Egypt and back, ending on Mount Moriah — with distances, dates and the Genesis passage for every stop.",
    era: "c. 2000 BC",
    read: { label: "Genesis 12", book: "genesis", chapter: 12 },
    category: "Patriarchs",
    passage: "Genesis 11–22",
    people: ["Abraham", "Sarah", "Isaac", "Lot"],
    aliases: ["Abram", "Abraham route", "Ur to Canaan"],
    context: "Geography turns Abraham's call into a costly migration: north along the Euphrates corridor, then south into Canaan.",
    legs: [
      {
        id: "main",
        name: "Ur to Moriah",
        short: "The whole journey",
        stops: [
          { place: "ur", note: "Abram's family home in southern Mesopotamia, a wealthy city of the moon god.", ref: "Genesis 11:31", link: g(11, 31), when: "Departure" },
          { place: "haran", note: "Terah settles here and dies; the call to leave comes to Abram.", ref: "Genesis 12:1", link: g(12, 1), when: "Abram aged 75" },
          { place: "shechem", note: "First stop in Canaan. God promises the land to his offspring; Abram builds an altar.", ref: "Genesis 12:6", link: g(12, 6) },
          { place: "bethel", note: "Camps between Bethel and Ai, builds another altar and calls on the LORD.", ref: "Genesis 12:8", link: g(12, 8) },
          { place: "negev", label: "The Negev", note: "Moves south through the dry country as famine tightens.", ref: "Genesis 12:9", link: g(12, 9) },
          { place: "egypt", note: "Famine drives the family into Egypt, where Abram passes Sarai off as his sister.", ref: "Genesis 12:10", link: g(12, 10) },
          { place: "bethel", label: "Back to Bethel", note: "Returns to the altar he built; he and Lot part ways here.", ref: "Genesis 13:3", link: g(13, 3) },
          { place: "hebron", label: "Hebron (Mamre)", note: "Settles by the oaks of Mamre — his long-term home and burial place.", ref: "Genesis 13:18", link: g(13, 18) },
          { place: "beersheba", note: "Plants a tamarisk, digs a well and makes a treaty with Abimelech.", ref: "Genesis 21:33", link: g(21, 33) },
          { place: "moriah", note: "The testing of Abraham: Isaac bound, and a ram provided instead.", ref: "Genesis 22:2", link: g(22, 2), when: "The final test" },
        ],
      },
    ],
  },
  {
    id: "paul",
    title: "Paul's Missionary Journeys",
    tagline: "Three journeys from Antioch, and a voyage to Rome in chains",
    description:
      "Trace all four of Paul's voyages — the first, second and third missionary journeys and the sea road to Rome — with cities, churches planted, letters written and the Acts passage behind each leg.",
    era: "AD 46–62",
    read: { label: "Acts 13", book: "acts", chapter: 13 },
    category: "Early Church",
    featured: true,
    passage: "Acts 13–28",
    people: ["Paul", "Barnabas", "Silas", "Timothy", "Luke"],
    aliases: ["Paul", "missionary journeys", "Paul to Rome"],
    context: "The gospel moves through ports, Roman roads and provincial capitals from Antioch to Rome.",
    legs: [
      {
        id: "first",
        name: "First missionary journey",
        short: "Acts 13–14",
        stops: [
          { place: "antioch", note: "The church fasts, prays and sends Barnabas and Saul out.", ref: "Acts 13:1", link: acts(13, 1), when: "c. AD 46" },
          { place: "salamis", note: "Preaching in the Jewish synagogues of Cyprus, with John Mark helping.", ref: "Acts 13:5", link: acts(13, 5) },
          { place: "paphos", note: "The proconsul Sergius Paulus believes; Saul is now called Paul.", ref: "Acts 13:6", link: acts(13, 6) },
          { place: "perga", note: "John Mark leaves the team and returns to Jerusalem.", ref: "Acts 13:13", link: acts(13, 13) },
          { place: "pisidian-antioch", note: "Paul's great synagogue sermon; the word spreads through the region.", ref: "Acts 13:14", link: acts(13, 14), extra: "Church planted" },
          { place: "iconium", note: "A long stay, many believe, and a plot forces them out.", ref: "Acts 14:1", link: acts(14, 1), extra: "Church planted" },
          { place: "lystra", note: "A lame man healed, the crowd calls them gods, then Paul is stoned.", ref: "Acts 14:8", link: acts(14, 8), extra: "Timothy's home town" },
          { place: "derbe", note: "Many disciples made before they turn back the way they came.", ref: "Acts 14:20", link: acts(14, 20) },
          { place: "attalia", note: "Elders appointed in each church, then sail for home.", ref: "Acts 14:25", link: acts(14, 25) },
          { place: "antioch", label: "Antioch (report)", note: "They report all God had done and opened a door of faith to the Gentiles.", ref: "Acts 14:27", link: acts(14, 27) },
        ],
      },
      {
        id: "second",
        name: "Second missionary journey",
        short: "Acts 15:36–18:22",
        stops: [
          { place: "antioch", note: "Paul and Barnabas part over John Mark; Silas joins Paul.", ref: "Acts 15:36", link: acts(15, 36), when: "c. AD 49" },
          { place: "tarsus", label: "Through Cilicia", note: "Strengthening the churches through Syria and Cilicia.", ref: "Acts 15:41", link: acts(15, 41) },
          { place: "lystra", note: "Timothy joins the team.", ref: "Acts 16:1", link: acts(16, 1) },
          { place: "troas", note: "The vision of the man of Macedonia: 'Come over and help us.'", ref: "Acts 16:8", link: acts(16, 8) },
          { place: "neapolis", note: "The gospel crosses into Europe.", ref: "Acts 16:11", link: acts(16, 11) },
          { place: "philippi", note: "Lydia believes, a slave girl is freed, Paul and Silas sing in prison.", ref: "Acts 16:12", link: acts(16, 12), extra: "Church planted — later Philippians" },
          { place: "thessalonica", note: "Three sabbaths of reasoning from the Scriptures; a riot follows.", ref: "Acts 17:1", link: acts(17, 1), extra: "Later 1 & 2 Thessalonians" },
          { place: "berea", note: "The Bereans examine the Scriptures daily to test what they hear.", ref: "Acts 17:10", link: acts(17, 10) },
          { place: "athens", note: "Paul at the Areopagus, preaching the unknown God.", ref: "Acts 17:16", link: acts(17, 16) },
          { place: "corinth", note: "Eighteen months with Aquila and Priscilla; a large church formed.", ref: "Acts 18:1", link: acts(18, 1), extra: "Later 1 & 2 Corinthians" },
          { place: "ephesus", note: "A short first visit, with a promise to return.", ref: "Acts 18:19", link: acts(18, 19) },
          { place: "caesarea", note: "Landing back in Judea before returning to Antioch.", ref: "Acts 18:22", link: acts(18, 22) },
        ],
      },
      {
        id: "third",
        name: "Third missionary journey",
        short: "Acts 18:23–21:17",
        stops: [
          { place: "antioch", note: "Sets out again, strengthening every disciple on the way.", ref: "Acts 18:23", link: acts(18, 23), when: "c. AD 53" },
          { place: "ephesus", note: "Three years here: the hall of Tyrannus, burned scrolls, the silversmiths' riot.", ref: "Acts 19:1", link: acts(19, 1), extra: "Base of the journey" },
          { place: "philippi", label: "Macedonia", note: "Travels through Macedonia giving much encouragement.", ref: "Acts 20:1", link: acts(20, 1) },
          { place: "corinth", label: "Greece", note: "Three months in Greece; Romans likely written from here.", ref: "Acts 20:2", link: acts(20, 2), extra: "Letter to the Romans" },
          { place: "troas", note: "Eutychus falls from the window and is raised.", ref: "Acts 20:6", link: acts(20, 6) },
          { place: "miletus", note: "Farewell to the Ephesian elders — they will not see his face again.", ref: "Acts 20:17", link: acts(20, 17) },
          { place: "tyre", note: "Seven days with the disciples, who warn him not to go up.", ref: "Acts 21:3", link: acts(21, 3) },
          { place: "caesarea", note: "Agabus binds himself with Paul's belt as a warning.", ref: "Acts 21:8", link: acts(21, 8) },
          { place: "jerusalem", note: "Welcomed by the brothers, then arrested in the temple.", ref: "Acts 21:17", link: acts(21, 17) },
        ],
      },
      {
        id: "rome",
        name: "The voyage to Rome",
        short: "Acts 27–28",
        bySea: true,
        stops: [
          { place: "caesarea", note: "Paul, a prisoner, is handed to the centurion Julius.", ref: "Acts 27:1", link: acts(27, 1), when: "c. AD 60" },
          { place: "sidon", note: "Julius allows him to visit friends and be cared for.", ref: "Acts 27:3", link: acts(27, 3) },
          { place: "myra", note: "Transferred to an Alexandrian grain ship bound for Italy.", ref: "Acts 27:5", link: acts(27, 5) },
          { place: "fair-havens", note: "Paul warns that sailing on will cost ship and lives.", ref: "Acts 27:8", link: acts(27, 8) },
          { place: "malta", note: "Shipwreck, the viper on Paul's hand, and healings on the island.", ref: "Acts 28:1", link: acts(28, 1) },
          { place: "syracuse", note: "Three days in Sicily on the last stretch north.", ref: "Acts 28:12", link: acts(28, 12) },
          { place: "rhegium", note: "A south wind carries them up the Italian coast.", ref: "Acts 28:13", link: acts(28, 13) },
          { place: "puteoli", note: "Believers welcome him and he stays a week.", ref: "Acts 28:13", link: acts(28, 13) },
          { place: "rome", note: "Two whole years teaching under guard, without hindrance.", ref: "Acts 28:16", link: acts(28, 16), extra: "Prison letters" },
        ],
      },
    ],
  },
  {
    id: "jerusalem",
    title: "Ancient Jerusalem",
    tagline: "The final week, street by street",
    description:
      "Walk the sites of ancient Jerusalem — the Temple courts, the Mount of Olives, Gethsemane, Golgotha and the road to Emmaus — in the order of Jesus' last week.",
    era: "c. AD 30",
    read: { label: "Luke 19", book: "luke", chapter: 19 },
    category: "Jesus",
    passage: "Matthew 21–28; Luke 19–24",
    people: ["Jesus", "Mary", "Martha", "Lazarus"],
    aliases: ["Passion Week", "Holy Week", "Jerusalem last week"],
    context: "The final week unfolds within a compact landscape of ridges, gates, courts, gardens and roads outside Jerusalem.",
    legs: [
      {
        id: "passion-week",
        name: "Passion week",
        short: "Bethany to Emmaus",
        stops: [
          { place: "bethany", note: "Jesus lodges here each night with Mary, Martha and Lazarus.", ref: "Matthew 21:17", link: mt(21, 17), when: "Sunday" },
          { place: "olives", note: "The triumphal entry begins on the ridge east of the city.", ref: "Luke 19:37", link: lk(19, 37), when: "Sunday" },
          { place: "temple", note: "The tables of the money-changers overturned; days of public teaching.", ref: "Luke 19:45", link: lk(19, 45), when: "Monday" },
          { place: "bethesda", note: "One of the city pools where Jesus had earlier healed on the sabbath.", ref: "John 5:2", link: jhn(5, 2) },
          { place: "pool-of-siloam", note: "Where the man born blind washed and came back seeing.", ref: "John 9:7", link: jhn(9, 7) },
          { place: "upper-room", note: "The last supper, the washing of feet, the new commandment.", ref: "Luke 22:12", link: lk(22, 12), when: "Thursday" },
          { place: "gethsemane", note: "Prayer, sweat like blood, and the arrest by torchlight.", ref: "Matthew 26:36", link: mt(26, 36), when: "Thursday night" },
          { place: "golgotha", note: "The crucifixion, outside the city wall.", ref: "Luke 23:33", link: lk(23, 33), when: "Friday" },
          { place: "emmaus", note: "The risen Jesus walks seven miles explaining the Scriptures.", ref: "Luke 24:13", link: lk(24, 13), when: "Sunday" },
        ],
      },
    ],
  },
  {
    id: "exodus",
    title: "The Exodus Journey",
    tagline: "Out of Egypt, through the sea, to the edge of the land",
    description:
      "Map Israel's route out of Egypt: Rameses, the sea crossing, bitter water at Marah, Sinai, the failure at Kadesh-barnea and the view from Mount Nebo.",
    era: "c. 1446 BC",
    read: { label: "Exodus 12", book: "exodus", chapter: 12 },
    category: "Exodus & Israel",
    featured: true,
    passage: "Exodus 12–19; Numbers 13; Deuteronomy 34",
    people: ["Moses", "Aaron", "Miriam", "Joshua"],
    aliases: ["Exodus", "Moses", "Egypt to Sinai"],
    context: "This concise route follows the major turning points from slavery in Egypt to covenant at Sinai and the threshold of Canaan.",
    legs: [
      {
        id: "main",
        name: "Rameses to Nebo",
        short: "The wilderness route",
        stops: [
          { place: "ramesses", note: "Israel leaves on the night of the Passover, about six hundred thousand men on foot.", ref: "Exodus 12:37", link: ex(12, 37) },
          { place: "succoth", note: "First camp; bread baked without yeast because they were driven out in haste.", ref: "Exodus 12:39", link: ex(12, 39) },
          { place: "red-sea-crossing", note: "The sea divided, Israel crossing on dry ground, Pharaoh's army drowned.", ref: "Exodus 14:21", link: ex(14, 21) },
          { place: "marah", note: "Bitter water made sweet by a piece of wood.", ref: "Exodus 15:23", link: ex(15, 23) },
          { place: "elim", note: "Twelve springs and seventy palms — a real oasis.", ref: "Exodus 15:27", link: ex(15, 27) },
          { place: "rephidim", note: "Water from the rock, and the battle with Amalek.", ref: "Exodus 17:1", link: ex(17, 1) },
          { place: "sinai", note: "The mountain of the law: thunder, cloud and covenant.", ref: "Exodus 19:1", link: ex(19, 1), when: "Third month" },
          { place: "kadesh", note: "The twelve spies return; the people refuse to go up.", ref: "Numbers 13:26", link: { book: "numbers", chapter: 13, verse: 26 }, when: "Forty years begin" },
          { place: "nebo", note: "Moses sees the whole land from the mountain and dies there.", ref: "Deuteronomy 34:1", link: { book: "deuteronomy", chapter: 34, verse: 1 } },
        ],
      },
    ],
  },
  {
    id: "jesus",
    title: "Jesus' Ministry",
    tagline: "Nazareth, Galilee, and the road up to Jerusalem",
    description:
      "Follow Jesus from Nazareth and the Jordan through Cana, Capernaum and Caesarea Philippi, and on the final road up to Jerusalem, with the Gospel passage at every stop.",
    era: "c. AD 27–30",
    read: { label: "Matthew 4", book: "matthew", chapter: 4 },
    category: "Jesus",
    passage: "Matthew 3–21; Luke 4–19; John 2–11",
    people: ["Jesus", "John the Baptist", "Peter", "Mary", "Martha", "Lazarus"],
    aliases: ["Jesus", "ministry of Jesus", "Galilee ministry"],
    context: "Jesus' ministry moves between Galilee, the Jordan valley, Samaria and Jerusalem, making the landscape part of the Gospel narrative.",
    legs: [
      {
        id: "main",
        name: "Nazareth to Jerusalem",
        short: "The ministry route",
        stops: [
          { place: "nazareth", note: "Thirty quiet years, and the sermon that nearly ended in a cliff.", ref: "Luke 4:16", link: lk(4, 16) },
          { place: "bethabara", note: "Baptised by John; the Spirit descends and the Father speaks.", ref: "Matthew 3:13", link: mt(3, 13) },
          { place: "wilderness", note: "Forty days of fasting and three temptations answered from Deuteronomy.", ref: "Matthew 4:1", link: mt(4, 1) },
          { place: "cana", note: "Water into wine — the first sign, revealing his glory.", ref: "John 2:1", link: jhn(2, 1) },
          { place: "capernaum", note: "His base in Galilee: healings, the call of the fishermen, synagogue teaching.", ref: "Matthew 4:13", link: mt(4, 13) },
          { place: "sychar", note: "The Samaritan woman at Jacob's well, and a village that believes.", ref: "John 4:5", link: jhn(4, 5) },
          { place: "caesarea-philippi", note: "'Who do you say that I am?' — Peter's confession.", ref: "Matthew 16:13", link: mt(16, 13) },
          { place: "jericho", note: "Blind Bartimaeus sees, and Zacchaeus climbs a tree.", ref: "Luke 19:1", link: lk(19, 1) },
          { place: "bethany", note: "Lazarus raised, and Mary's jar of costly perfume.", ref: "John 11:1", link: jhn(11, 1) },
          { place: "jerusalem", note: "The final week: the temple, the cross, the empty tomb.", ref: "Luke 19:28", link: lk(19, 28) },
        ],
      },
    ],
  },
  {
    id: "joshua",
    title: "Joshua's Conquest",
    tagline: "Across the Jordan and into the land",
    description:
      "Follow the conquest campaigns in Joshua: the Jordan crossing, Jericho and Ai, the southern coalition at Gibeon, the northern battle at Hazor, and the tent at Shiloh.",
    era: "c. 1406 BC",
    read: { label: "Joshua 6", book: "joshua", chapter: 6 },
    category: "Exodus & Israel",
    passage: "Joshua 2–18",
    people: ["Joshua", "Rahab", "Caleb"],
    aliases: ["Joshua", "conquest of Canaan", "Jericho campaign"],
    context: "The campaigns follow the Jordan valley, central ridge and routes linking the southern and northern cities of Canaan.",
    legs: [
      {
        id: "main",
        name: "Shittim to Shiloh",
        short: "The campaigns",
        stops: [
          { place: "shittim", note: "Two spies sent out from the camp across the Jordan.", ref: "Joshua 2:1", link: jos(2, 1) },
          { place: "gilgal", note: "The Jordan stops, twelve stones are set up, and the camp is made.", ref: "Joshua 4:19", link: jos(4, 19) },
          { place: "jericho", note: "Seven days of marching, then the walls fall flat.", ref: "Joshua 6:20", link: jos(6, 20) },
          { place: "ai", note: "Defeat over Achan's sin, then victory by ambush.", ref: "Joshua 8:1", link: jos(8, 1) },
          { place: "shechem", note: "The law read aloud on Ebal and Gerizim, blessing and curse.", ref: "Joshua 8:30", link: jos(8, 30) },
          { place: "gibeon", note: "The Gibeonite treaty, then the long day of battle.", ref: "Joshua 10:12", link: jos(10, 12) },
          { place: "makkedah", note: "The five southern kings defeated and the campaign completed.", ref: "Joshua 10:16", link: jos(10, 16) },
          { place: "hazor", note: "The northern coalition broken at the waters of Merom.", ref: "Joshua 11:10", link: jos(11, 10) },
          { place: "shiloh", note: "The tent of meeting set up and the land divided by lot.", ref: "Joshua 18:1", link: jos(18, 1) },
        ],
      },
    ],
  },
  {
    id: "jonah",
    title: "Jonah's Journey",
    tagline: "Running west, sent east",
    description:
      "The shortest journey on the map and the most stubborn: Joppa and the ship for Tarshish, the storm, the fish, and finally the long walk to Nineveh.",
    era: "c. 780 BC",
    read: { label: "Jonah 1", book: "jonah", chapter: 1 },
    category: "Prophets & Kings",
    passage: "Jonah 1–4",
    people: ["Jonah"],
    aliases: ["Jonah", "Jonah and the fish", "Nineveh"],
    context: "The geography exposes Jonah's flight: he boards west for Tarshish while God's call points east to Nineveh.",
    legs: [
      {
        id: "main",
        name: "Joppa to Nineveh",
        short: "Flight and obedience",
        stops: [
          { place: "joppa", note: "Jonah pays the fare and boards a ship going the opposite way.", ref: "Jonah 1:3", link: jon(1, 3) },
          { place: "tarshish", label: "Toward Tarshish", note: "The far west — as far from Nineveh as a ship could take him.", ref: "Jonah 1:3", link: jon(1, 3) },
          { place: "joppa", label: "Back on dry land", note: "The storm, the lots, the sea, the fish, and three days inside it.", ref: "Jonah 2:10", link: jon(2, 10) },
          { place: "nineveh", note: "A city of great size warned in five words, and a king in sackcloth.", ref: "Jonah 3:3", link: jon(3, 3) },
        ],
      },
    ],
  },
  {
    id: "jesus-through-samaria",
    title: "Jesus Through Samaria",
    tagline: "The journey to the woman at the well",
    description:
      "Follow Jesus from Judea through Samaria to Sychar and Jacob's Well, where one conversation opens into a Samaritan town's belief before he continues to Galilee.",
    era: "c. AD 28–29",
    read: { label: "John 4", book: "john", chapter: 4 },
    category: "Jesus",
    featured: true,
    passage: "John 4:1–42",
    people: ["Jesus", "Samaritan Woman", "Jacob"],
    aliases: ["woman at the well", "John 4", "Samaria", "Jacob's Well", "he had to go through Samaria"],
    context:
      "The direct road from Judea to Galilee crossed Samaria. Some travellers also used a longer route through Perea, but avoidance of Samaria was not universal; John presents both a real journey and a purposeful encounter.",
    comparisonRoutes: [
      {
        id: "jordan-valley-perea",
        name: "Historically discussed alternative via the Jordan Valley / Perea",
        shortLabel: "Alternative route",
        status: "debated",
        note: "A schematic eastern alternative used by some travellers. John does not say Jesus considered this route, and Jewish avoidance of Samaria was not universal.",
        supportingPlaceIds: ["perea"],
        geometry: [
          [35.2, 31.75],
          [35.44, 31.86],
          [35.58, 32.08],
          [35.64, 32.34],
          [35.58, 32.58],
          [35.42, 32.75],
        ],
      },
    ],
    legs: [
      {
        id: "main",
        name: "Judea to Galilee through Samaria",
        short: "John 4:1–42",
        stops: [
          { place: "judea", label: "Judea", event: "Jesus leaves Judea", note: "Jesus leaves Judea and sets out again for Galilee as attention around his ministry grows.", ref: "John 4:1–3", link: jhn(4, 1), related: ["Jesus"] },
          { place: "samaria", event: "He had to go through Samaria", note: "The central ridge road is the direct route north. John's wording also prepares the reader for a divinely purposeful encounter.", ref: "John 4:4", link: jhn(4, 4), when: "The direct road north", related: ["Jesus", "Samaria"] },
          { place: "sychar", event: "Near the field Jacob gave Joseph", note: "Jesus comes to Sychar, near Jacob's field and the well associated with the patriarch.", ref: "John 4:5", link: jhn(4, 5), related: ["Jacob", "Sychar"] },
          { place: "jacobs-well", label: "Jacob's Well", event: "Living water", note: "Tired from the journey, Jesus sits by the well and speaks with a Samaritan woman about living water and true worship.", ref: "John 4:6–26", link: jhn(4, 6), when: "About noon", related: ["Jesus", "Samaritan Woman", "Jacob"] },
          { place: "mount-gerizim", label: "Mount Gerizim", event: "Worship beyond one mountain", note: "The mountain sacred to Samaritans stands over the conversation as Jesus speaks of worship in spirit and truth.", ref: "John 4:20–24", link: jhn(4, 20), related: ["Samaritans"] },
          { place: "sychar", label: "Sychar believes", event: "Many Samaritans believe", note: "The woman returns to the town; many come, hear Jesus, and confess him as Savior of the world.", ref: "John 4:28–42", link: jhn(4, 28), related: ["Samaritan Woman", "Samaritans"] },
          { place: "galilee", label: "Galilee", event: "The journey continues", note: "After two days among the Samaritans, Jesus continues north into Galilee.", ref: "John 4:43", link: jhn(4, 43), related: ["Jesus"] },
        ],
      },
    ],
  },
  {
    id: "seven-churches-of-revelation",
    title: "Seven Churches of Revelation",
    tagline: "A circular route through Roman Asia and seven messages from Jesus",
    description:
      "Travel from Patmos through the seven churches named in Revelation — a coherent Roman road circuit whose ancient cities remain identifiable across western Türkiye.",
    era: "c. AD 95",
    read: { label: "Revelation 1", book: "revelation", chapter: 1 },
    category: "Early Church",
    passage: "Revelation 1–3",
    people: ["John", "Jesus"],
    aliases: ["seven churches", "churches of Asia", "Revelation churches", "Patmos"],
    context: "The order in Revelation 1:11 follows a practical courier circuit from the Aegean coast through the inland valleys of Roman Asia.",
    legs: [
      {
        id: "main",
        name: "Patmos and the seven churches",
        short: "Revelation 1–3",
        stops: [
          { place: "patmos", event: "The vision on Patmos", note: "John receives the revelation while on Patmos and is told to send it to seven churches.", ref: "Revelation 1:9–11", link: rev(1, 9), extra: "Island of exile", related: ["John", "Jesus"] },
          { place: "ephesus", event: "Return to your first love", note: "Praised for endurance and discernment, Ephesus is called to remember and return to its first love.", ref: "Revelation 2:1–7", link: rev(2, 1), extra: "Church 1 of 7", related: ["Paul", "John"] },
          { place: "smyrna", event: "Be faithful unto death", note: "A suffering church is told not to fear what it is about to endure.", ref: "Revelation 2:8–11", link: rev(2, 8), extra: "Church 2 of 7" },
          { place: "pergamum", event: "Hold fast to my name", note: "The church holds fast under pressure but is warned about compromise.", ref: "Revelation 2:12–17", link: rev(2, 12), extra: "Church 3 of 7" },
          { place: "thyatira", event: "Hold fast until I come", note: "Love and service are commended while corrupt teaching and practice are confronted.", ref: "Revelation 2:18–29", link: rev(2, 18), extra: "Church 4 of 7" },
          { place: "sardis", event: "Wake up", note: "A church with a living reputation is called to strengthen what remains.", ref: "Revelation 3:1–6", link: rev(3, 1), extra: "Church 5 of 7" },
          { place: "philadelphia-asia", label: "Philadelphia", event: "An open door", note: "The faithful church receives an open door that no one can shut.", ref: "Revelation 3:7–13", link: rev(3, 7), extra: "Church 6 of 7" },
          { place: "laodicea", event: "Be zealous and repent", note: "The self-sufficient church is exposed as lukewarm and invited to renewed fellowship.", ref: "Revelation 3:14–22", link: rev(3, 14), extra: "Church 7 of 7" },
        ],
      },
    ],
  },
  {
    id: "israel-40-year-wilderness",
    title: "Israel's 40-Year Wilderness Journey",
    tagline: "Forty years, one wilderness, a generation's journey",
    description:
      "Follow the major stages of Israel's forty-year wilderness journey, then open the complete Numbers 33 itinerary without pretending that every ancient station can be located today.",
    era: "c. 1446–1406 BC",
    read: { label: "Numbers 33", book: "numbers", chapter: 33 },
    category: "Exodus & Israel",
    featured: true,
    passage: "Exodus 12–40; Numbers 10–33; Deuteronomy 1–34",
    people: ["Moses", "Aaron", "Miriam", "Joshua", "Caleb"],
    aliases: ["wilderness", "40 years", "forty years", "Numbers 33", "Israel in the wilderness"],
    context: "Numbers 33 preserves an ordered station list. A few stages can be mapped with confidence or as broad regions; most minor stations remain unlocated and are kept in the textual itinerary.",
    unlocatedStops: [
      { name: "Dophkah", ref: "Numbers 33:12", note: "Named in the itinerary; its location is unknown." },
      { name: "Alush", ref: "Numbers 33:13", note: "Named in the itinerary; its location is unknown." },
      { name: "Kibroth-hattaavah", ref: "Numbers 33:16", note: "Named after the graves of craving; the exact site is unknown." },
      { name: "Hazeroth", ref: "Numbers 33:17", note: "A station after Kibroth-hattaavah; proposed locations remain uncertain." },
      { name: "Rithmah to Ezion-geber", ref: "Numbers 33:18–35", note: "Eighteen named stages are preserved in order, but most cannot be placed securely on a modern map." },
      { name: "Zalmonah to Almon-diblathaim", ref: "Numbers 33:41–46", note: "The final Transjordan stages are named, while their precise locations remain debated or unknown." },
    ],
    legs: [
      {
        id: "main",
        name: "Egypt to the plains of Moab",
        short: "Exodus–Deuteronomy",
        stops: [
          { place: "ramesses", event: "The departure", note: "Israel leaves Rameses after Passover, beginning the itinerary Moses records.", ref: "Numbers 33:3", link: nu(33, 3), when: "Year 1" },
          { place: "red-sea-crossing", event: "Through the sea", note: "Scripture records the sea crossing, but the precise crossing point is unknown.", ref: "Numbers 33:8", link: nu(33, 8), when: "Year 1" },
          { place: "sinai", event: "Covenant at Sinai", note: "Israel camps before the mountain, receives the covenant, and builds the tabernacle. The mapped mountain is the traditional location.", ref: "Numbers 33:15", link: nu(33, 15), when: "Years 1–2" },
          { place: "paran", label: "Wilderness of Paran", event: "Into the wilderness", note: "The people travel through a broad wilderness region; many intervening stations cannot be located securely.", ref: "Numbers 10:12", link: nu(10, 12), when: "Year 2" },
          { place: "kadesh", event: "A generation turns back", note: "From Kadesh the spies return, and Israel refuses to enter the land.", ref: "Numbers 13:26", link: nu(13, 26), when: "The wandering begins" },
          { place: "mount-hor", label: "Mount Hor", event: "Aaron dies", note: "Aaron dies on Mount Hor. The traditional mountain near Petra is shown; the identification is debated.", ref: "Numbers 33:37–39", link: nu(33, 37), when: "Year 40" },
          { place: "ezion-geber", label: "Ezion-geber", event: "At the head of the gulf", note: "The itinerary reaches Ezion-geber near the northern Gulf of Aqaba before turning north and east.", ref: "Numbers 33:35–36", link: nu(33, 35), when: "Year 40" },
          { place: "plains-of-moab", label: "Plains of Moab", event: "Across from Jericho", note: "Israel camps by the Jordan opposite Jericho, at the threshold of the promised land.", ref: "Numbers 33:48–49", link: nu(33, 48), when: "Year 40" },
          { place: "nebo", event: "Moses sees the land", note: "From Mount Nebo Moses sees the land he will not enter and dies in Moab.", ref: "Deuteronomy 34:1–5", link: { book: "deuteronomy", chapter: 34, verse: 1 }, when: "Year 40" },
        ],
      },
    ],
  },
  {
    id: "jacobs-journey",
    title: "Jacob's Journey",
    tagline: "From exile and striving to return and a new name",
    description:
      "Follow Jacob from Beersheba to Bethel and Haran, then home through Gilead, Peniel, Shechem and Bethel — a geography of exile, encounter and transformation.",
    era: "c. 1900 BC",
    read: { label: "Genesis 28", book: "genesis", chapter: 28 },
    category: "Patriarchs",
    passage: "Genesis 25–35",
    people: ["Jacob", "Esau", "Rachel", "Leah", "Laban", "Isaac"],
    aliases: ["Jacob", "Israel", "Jacob and Esau", "Jacob wrestling", "Peniel"],
    context: "The outward and return routes frame Jacob's transformation from a fugitive grasping for blessing to Israel, wounded and reconciled on the way home.",
    legs: [
      {
        id: "main",
        name: "Beersheba to Haran and home",
        short: "Genesis 25–35",
        stops: [
          { place: "beersheba", event: "Jacob leaves home", note: "After receiving Isaac's blessing, Jacob leaves Beersheba to escape Esau and find his mother's family.", ref: "Genesis 28:10", link: g(28, 10), related: ["Jacob", "Esau", "Isaac"] },
          { place: "bethel", event: "The dream at Bethel", note: "Jacob sees a stairway between earth and heaven, receives God's promise, and names the place Bethel.", ref: "Genesis 28:11–22", link: g(28, 11), when: "The outward journey", related: ["Jacob"] },
          { place: "haran", label: "Haran / Paddan-Aram", event: "Years with Laban", note: "Jacob meets Rachel, serves Laban, marries Leah and Rachel, and his household grows.", ref: "Genesis 29:1–30:43", link: g(29, 1), when: "Twenty years", related: ["Jacob", "Rachel", "Leah", "Laban"] },
          { place: "gilead", label: "Mount Gilead", event: "The covenant with Laban", note: "Laban catches Jacob in the hill country of Gilead; they make a covenant and part.", ref: "Genesis 31:21–55", link: g(31, 21), related: ["Jacob", "Laban"] },
          { place: "mahanaim", event: "God's camp", note: "Angels meet Jacob, and he names the place Mahanaim. Its exact site is uncertain.", ref: "Genesis 32:1–2", link: g(32, 1), related: ["Jacob"] },
          { place: "peniel", label: "Peniel / Penuel", event: "Jacob becomes Israel", note: "At the Jabbok, Jacob wrestles through the night, receives a new name, and walks away limping.", ref: "Genesis 32:22–32", link: g(32, 22), when: "Before meeting Esau", related: ["Jacob", "Israel"] },
          { place: "succoth-jacob", label: "Succoth", event: "Booths east of the Jordan", note: "Jacob builds a house and shelters for his livestock. This is not the Egyptian Succoth of the Exodus.", ref: "Genesis 33:17", link: g(33, 17), related: ["Jacob"] },
          { place: "shechem", event: "Back in Canaan", note: "Jacob buys land and builds an altar; the Dinah narrative follows in this region.", ref: "Genesis 33:18–20", link: g(33, 18), related: ["Jacob", "Dinah"] },
          { place: "bethel", label: "Return to Bethel", event: "Return to the vow", note: "Jacob puts away foreign gods, returns to Bethel, and God reaffirms the name Israel.", ref: "Genesis 35:1–15", link: g(35, 1), related: ["Jacob", "Israel"] },
          { place: "bethlehem", label: "Ephrath / Bethlehem", event: "Rachel dies", note: "Rachel dies giving birth to Benjamin on the road from Bethel toward Ephrath.", ref: "Genesis 35:16–20", link: g(35, 16), related: ["Rachel", "Benjamin"] },
          { place: "hebron", label: "Hebron / Mamre", event: "Jacob returns to Isaac", note: "Jacob comes home to Isaac at Mamre near Hebron; the brothers later bury their father together.", ref: "Genesis 35:27–29", link: g(35, 27), related: ["Jacob", "Esau", "Isaac"] },
        ],
      },
    ],
  },
];

export const JOURNEY_BY_ID: Record<string, Journey> = Object.fromEntries(
  JOURNEYS.map((j) => [j.id, j]),
);

/** Entry ids in the reader that should offer a link to a journey page. */
export const JOURNEY_FOR_ENTRY: Record<string, string> = {
  abraham: "abraham",
  ur: "abraham",
  haran: "abraham",
  canaan: "abraham",
  shechem: "abraham",
  paul: "paul",
  antioch: "paul",
  ephesus: "paul",
  philippi: "paul",
  corinth: "paul",
  rome: "paul",
  jerusalem: "jerusalem",
  jesus: "jesus",
  egypt: "exodus",
  jacob: "jacobs-journey",
  peniel: "jacobs-journey",
  samaria: "jesus-through-samaria",
  sychar: "jesus-through-samaria",
  "jacobs-well": "jesus-through-samaria",
  "samaritan-woman": "jesus-through-samaria",
  patmos: "seven-churches-of-revelation",
  laodicea: "seven-churches-of-revelation",
  moses: "israel-40-year-wilderness",
};

/** Cumulative travel distance in km at each stop, measured along the drawn route. */
export function legDistances(stops: JourneyStop[], bySea = false): number[] {
  const out = [0];
  for (const segment of journeySegments(stops, bySea)) {
    out.push(out[out.length - 1] + segment.distanceKm);
  }
  return out;
}

export function journeySegments(stops: JourneyStop[], bySea = false): JourneyRouteSegment[] {
  return routeSegments(stops.map((stop) => stop.place), bySea).map((segment) => ({
    origin: stops[segment.index],
    destination: stops[segment.index + 1],
    routeGeometry: segment.geometry,
    routeType: segment.mode,
    historicalAccuracy: segment.accuracy,
    routeNote: segment.note,
    bibleReferences: [stops[segment.index]?.ref, stops[segment.index + 1]?.ref].filter(
      (reference): reference is string => Boolean(reference),
    ),
    distanceKm: segment.distanceKm,
  }));
}

export function totalDistanceKm(stops: JourneyStop[], bySea = false): number {
  const d = legDistances(stops, bySea);
  return d[d.length - 1] ?? 0;
}

/** Rough travel estimate: 25 km a day on foot, 100 km a day under sail. */
export function travelEstimate(km: number, bySea = false): string {
  const perDay = bySea ? 100 : 25;
  const days = Math.max(1, Math.round(km / perDay));
  if (days < 14) return `about ${days} day${days === 1 ? "" : "s"} of travel`;
  const weeks = Math.round(days / 7);
  if (weeks < 9) return `about ${weeks} weeks of travel`;
  return `about ${Math.round(days / 30)} months of travel`;
}

export function mixedTravelEstimate(stops: JourneyStop[], throughStop: number, bySea = false): string {
  const segments = journeySegments(stops, bySea).slice(0, Math.max(throughStop, 0));
  if (segments.length === 0) return "Starting point";
  const days = segments.reduce(
    (total, segment) => total + segment.distanceKm / (segment.routeType === "maritime" ? 100 : 25),
    0,
  );
  const rounded = Math.max(1, Math.round(days));
  if (rounded < 14) return `about ${rounded} day${rounded === 1 ? "" : "s"} of travel`;
  const weeks = Math.round(rounded / 7);
  if (weeks < 9) return `about ${weeks} weeks of travel`;
  return `about ${Math.round(rounded / 30)} months of travel`;
}

export function versePath(link: JourneyStop["link"]): string | null {
  if (!link) return null;
  return link.verse
    ? `/${link.book}/${link.chapter}/${link.verse}`
    : `/${link.book}/${link.chapter}`;
}
