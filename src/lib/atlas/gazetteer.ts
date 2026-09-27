import type { EntityKind } from "./types";

/**
 * Canon-wide name index. These terms are recognised anywhere in Scripture and
 * open an on-demand context panel (curated Atlas entries always take priority).
 * Kinds map onto the reader's colour scheme, so a river reads differently from
 * a prophecy at a glance.
 */
export type GazetteerTerm = { term: string; kind: EntityKind };

const group = (kind: EntityKind, terms: string[]): GazetteerTerm[] =>
  terms.map((term) => ({ term, kind }));

const PLACES = group("place", [
  // Cities and towns
  "Jerusalem", "Zion", "Bethlehem", "Hebron", "Beersheba", "Shechem", "Bethel", "Shiloh",
  "Jericho", "Ai", "Gibeon", "Gilgal", "Ramah", "Mizpah", "Gibeah", "Jabesh Gilead",
  "Samaria", "Jezreel", "Megiddo", "Hazor", "Dan", "Beth Shean", "Lachish", "Gezer",
  "Ashdod", "Ashkelon", "Ekron", "Gath", "Gaza", "Joppa", "Caesarea", "Ptolemais",
  "Tyre", "Sidon", "Byblos", "Damascus", "Hamath", "Riblah", "Carchemish", "Haran",
  "Ur", "Babylon", "Nineveh", "Calah", "Asshur", "Susa", "Ecbatana", "Persepolis",
  "Memphis", "Thebes", "On", "Zoan", "Pithom", "Rameses", "Goshen", "Elephantine",
  "Sodom", "Gomorrah", "Zoar", "Admah", "Zeboiim", "Nazareth", "Capernaum", "Bethsaida",
  "Chorazin", "Cana", "Nain", "Magdala", "Tiberias", "Bethany", "Bethphage", "Emmaus",
  "Jaffa", "Lydda", "Antioch", "Iconium", "Lystra", "Derbe", "Tarsus", "Ephesus",
  "Smyrna", "Pergamum", "Thyatira", "Sardis", "Philadelphia", "Laodicea", "Colossae",
  "Miletus", "Troas", "Philippi", "Thessalonica", "Berea", "Athens", "Corinth", "Cenchreae",
  "Rome", "Puteoli", "Malta", "Cyprus", "Salamis", "Paphos", "Crete", "Rhodes", "Patmos",
  "Ziklag", "Adullam", "Endor", "Shunem", "Succoth", "Penuel", "Mahanaim", "Rabbah",
  "Bozrah", "Petra", "Sela", "Kadesh Barnea", "Elim", "Marah", "Rephidim", "Massah",
  "Meribah", "Pi Hahiroth", "Baal Zephon", "Migdol", "Etham", "Ramoth Gilead", "Tekoa",
  // Regions, kingdoms, peoples' lands
  "Canaan", "Israel", "Judah", "Judea", "Galilee", "Samaria", "Perea", "Decapolis",
  "Idumea", "Edom", "Moab", "Ammon", "Midian", "Amalek", "Philistia", "Phoenicia",
  "Aram", "Syria", "Mesopotamia", "Padan Aram", "Shinar", "Chaldea", "Elam", "Media",
  "Persia", "Assyria", "Babylonia", "Egypt", "Cush", "Ethiopia", "Put", "Libya",
  "Arabia", "Sheba", "Ophir", "Tarshish", "Asia", "Macedonia", "Achaia", "Galatia",
  "Cappadocia", "Bithynia", "Pontus", "Pamphylia", "Cilicia", "Lycia", "Mysia", "Phrygia",
  "Gilead", "Bashan", "Negev", "Shephelah", "Sharon", "Arabah", "Goshen", "Havilah",
  // Mountains, rivers, seas, deserts
  "Mount Sinai", "Mount Horeb", "Mount Ararat", "Mount Moriah", "Mount Carmel",
  "Mount Tabor", "Mount Gilboa", "Mount Hermon", "Mount Nebo", "Mount Ebal",
  "Mount Gerizim", "Mount of Olives", "Mount Zion", "Golgotha", "Calvary",
  "Jordan", "Euphrates", "Tigris", "Nile", "Kishon", "Arnon", "Jabbok", "Kidron",
  "Brook Cherith", "Red Sea", "Sea of Galilee", "Sea of Chinnereth", "Great Sea",
  "Dead Sea", "Salt Sea", "Mediterranean", "Wilderness of Zin", "Wilderness of Paran",
  "Wilderness of Sin", "Wilderness of Judea", "Desert of Shur", "Valley of Elah",
  "Valley of Hinnom", "Valley of Jehoshaphat", "Kidron Valley", "Jezreel Valley",
  "Plain of Jordan", "Wilderness of Sinai",
]);

const PEOPLES = group("people", [
  "Israelites", "Hebrews", "Jews", "Gentiles", "Samaritans", "Canaanites", "Amorites",
  "Hittites", "Hivites", "Jebusites", "Perizzites", "Girgashites", "Philistines",
  "Moabites", "Ammonites", "Edomites", "Amalekites", "Midianites", "Kenites",
  "Horites", "Rephaim", "Anakim", "Nephilim", "Chaldeans", "Assyrians", "Babylonians",
  "Medes", "Persians", "Greeks", "Romans", "Ethiopians", "Egyptians", "Arameans",
  "Sidonians", "Pharisees", "Sadducees", "Scribes", "Essenes", "Zealots", "Herodians",
  "Levites", "Nazirites", "Rechabites", "Nethinim", "Sanhedrin", "Twelve tribes",
  "Reuben", "Simeon", "Levi", "Judah", "Dan", "Naphtali", "Gad", "Asher",
  "Issachar", "Zebulun", "Joseph", "Benjamin", "Ephraim", "Manasseh",
]);

const PERSONS = group("person", [
  "Adam", "Eve", "Cain", "Abel", "Seth", "Enoch", "Methuselah", "Lamech", "Noah",
  "Shem", "Ham", "Japheth", "Nimrod", "Terah", "Abraham", "Abram", "Sarah", "Sarai",
  "Hagar", "Ishmael", "Isaac", "Rebekah", "Esau", "Jacob", "Leah", "Rachel", "Dinah",
  "Judah", "Tamar", "Joseph", "Potiphar", "Asenath", "Ephraim", "Manasseh", "Benjamin",
  "Pharaoh", "Shishak", "Necho", "Hophra", "Potiphera",
  "Job", "Jethro", "Zipporah", "Moses", "Aaron", "Miriam", "Nadab", "Abihu", "Eleazar",
  "Phinehas", "Korah", "Balaam", "Balak", "Caleb", "Joshua", "Rahab", "Achan", "Deborah",
  "Barak", "Sisera", "Jael", "Gideon", "Abimelech", "Jephthah", "Samson", "Delilah",
  "Naomi", "Ruth", "Boaz", "Obed", "Jesse", "Eli", "Hannah", "Samuel", "Saul", "Jonathan",
  "David", "Goliath", "Abner", "Joab", "Michal", "Abigail", "Nabal", "Bathsheba", "Uriah",
  "Nathan", "Absalom", "Ahithophel", "Adonijah", "Solomon", "Hiram", "Rehoboam", "Jeroboam",
  "Asa", "Jehoshaphat", "Ahab", "Jezebel", "Naboth", "Elijah", "Elisha", "Naaman", "Gehazi",
  "Jehu", "Athaliah", "Joash", "Amaziah", "Uzziah", "Jotham", "Ahaz", "Hezekiah", "Sennacherib",
  "Manasseh", "Josiah", "Jehoiakim", "Jehoiachin", "Zedekiah", "Nebuchadnezzar", "Belshazzar",
  "Darius", "Cyrus", "Artaxerxes", "Xerxes", "Ahasuerus", "Esther", "Mordecai", "Haman",
  "Ezra", "Nehemiah", "Zerubbabel", "Joshua the high priest", "Sanballat", "Tobiah",
  "Isaiah", "Jeremiah", "Baruch", "Ezekiel", "Daniel", "Shadrach", "Meshach", "Abednego",
  "Hosea", "Gomer", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
  "Zephaniah", "Haggai", "Zechariah", "Malachi", "Melchizedek", "Lot", "Laban", "Eliezer",
  "Jesus", "Christ", "Messiah", "Immanuel", "Mary", "Joseph of Nazareth", "John the Baptist",
  "Elizabeth", "Zechariah the priest", "Simeon", "Anna", "Herod", "Herod Antipas",
  "Herodias", "Pontius Pilate", "Caiaphas", "Annas", "Barabbas", "Simon of Cyrene",
  "Peter", "Simon Peter", "Cephas", "Andrew", "James", "John", "Philip", "Bartholomew",
  "Nathanael", "Thomas", "Matthew", "Levi", "Thaddaeus", "Judas Iscariot", "Matthias",
  "Mary Magdalene", "Martha", "Lazarus", "Nicodemus", "Joseph of Arimathea", "Zacchaeus",
  "Bartimaeus", "Jairus", "Stephen", "Philip the evangelist", "Cornelius", "Tabitha",
  "Barnabas", "Saul of Tarsus", "Paul", "Silas", "Timothy", "Titus", "Luke", "Mark",
  "Apollos", "Aquila", "Priscilla", "Lydia", "Felix", "Festus", "Agrippa", "Gallio",
  "Demetrius", "Onesimus", "Philemon", "Gamaliel", "Ananias", "Sapphira", "Simon Magus",
  "Eutychus", "Phoebe", "Epaphras", "Tychicus", "Demas", "Diotrephes", "Gabriel", "Michael",
  "Satan", "the devil", "Beelzebul", "Abaddon", "Legion",
]);

const OBJECTS = group("object", [
  "ark of the covenant", "ark", "tabernacle", "tent of meeting", "temple", "holy of holies",
  "most holy place", "mercy seat", "menorah", "lampstand", "altar of incense",
  "bronze altar", "bronze sea", "table of showbread", "showbread", "ephod", "breastplate",
  "Urim and Thummim", "high priest's garments", "veil", "curtain", "censer", "scroll",
  "book of the law", "tablets of stone", "staff", "rod of Aaron", "bronze serpent",
  "manna", "pot of manna", "trumpet", "shofar", "harp", "lyre", "sling", "chariot",
  "yoke", "millstone", "winepress", "threshing floor", "olive press", "lamp", "seal",
  "crown of thorns", "cross", "purple robe", "spear", "sword", "shield", "helmet",
  "breastplate of righteousness", "sandals", "net", "boat", "well", "cistern", "tomb",
  "linen cloths", "alabaster jar", "denarius", "talent", "shekel", "mina", "drachma",
]);

const ANIMALS = group("object", [
  "lamb", "sheep", "goat", "ram", "bull", "ox", "heifer", "donkey", "camel", "horse",
  "lion", "bear", "wolf", "leopard", "serpent", "dove", "raven", "eagle", "quail",
  "locust", "scorpion", "fish", "leviathan", "behemoth", "scapegoat",
]);

const EVENTS = group("event", [
  "creation", "the flood", "the deluge", "tower of Babel", "the exodus", "the passover",
  "crossing the Red Sea", "the golden calf", "the ten plagues", "the conquest",
  "fall of Jericho", "the united monarchy", "the divided kingdom", "the exile",
  "Babylonian captivity", "the return", "rebuilding the temple", "the crucifixion",
  "the resurrection", "the ascension", "Pentecost", "the transfiguration",
  "the last supper", "the triumphal entry", "the day of the Lord", "the last judgment",
  "battle of Jericho", "siege of Jerusalem", "destruction of the temple",
]);

const FESTIVALS = group("covenant", [
  "Passover", "Feast of Unleavened Bread", "Feast of Weeks", "Pentecost", "Firstfruits",
  "Day of Atonement", "Yom Kippur", "Feast of Tabernacles", "Feast of Booths",
  "Feast of Trumpets", "Sabbath", "Sabbath year", "Jubilee", "Purim", "Dedication",
  "Hanukkah", "new moon",
]);

const LAWS = group("covenant", [
  "the Ten Commandments", "the law", "Torah", "covenant", "circumcision", "tithe",
  "sin offering", "burnt offering", "guilt offering", "peace offering", "grain offering",
  "wave offering", "drink offering", "kosher", "clean and unclean", "cities of refuge",
  "levirate marriage", "kinsman redeemer", "Nazirite vow", "year of jubilee",
  "an eye for an eye", "the greatest commandment",
]);

const THEOLOGY = group("concept", [
  "grace", "faith", "righteousness", "justification", "redemption", "atonement",
  "propitiation", "sanctification", "repentance", "forgiveness", "salvation", "gospel",
  "kingdom of God", "kingdom of heaven", "eternal life", "resurrection of the dead",
  "the Holy Spirit", "the Word", "logos", "glory", "wisdom", "mercy", "steadfast love",
  "hesed", "shalom", "remnant", "election", "adoption", "new creation", "new covenant",
  "body of Christ", "the church", "communion", "baptism", "idolatry", "blasphemy",
  "hardness of heart", "the fear of the Lord",
]);

const PROPHECY = group("prophecy", [
  "the seed of the woman", "the suffering servant", "the branch", "son of man",
  "son of David", "the day of the Lord", "seventy weeks", "the new heavens",
  "the new earth", "the new Jerusalem", "the beast", "the lamb who was slain",
  "the seals", "the trumpets", "the bowls", "the millennium", "the antichrist",
  "the rapture", "the second coming", "the abomination of desolation",
  "prophecy", "vision", "dream",
]);

const MIRACLES = group("miracle", [
  "miracle", "sign", "wonder", "healing", "raising the dead", "feeding of the five thousand",
  "walking on water", "calming the storm", "water into wine", "cleansing of the leper",
  "casting out demons", "the burning bush", "fire from heaven", "the parting of the sea",
  "the sun standing still", "the lions' den", "the fiery furnace", "the great fish",
]);

const PARABLES = group("concept", [
  "parable", "the sower", "the prodigal son", "the good Samaritan", "the lost sheep",
  "the lost coin", "the mustard seed", "the talents", "the ten virgins",
  "the rich man and Lazarus", "the vineyard", "the wedding banquet", "the unjust steward",
  "the pharisee and the tax collector", "the wheat and the tares", "the good shepherd",
  "the narrow gate", "the sermon on the mount", "the beatitudes", "the Lord's prayer",
]);

const JOURNEYS = group("journey", [
  "the wilderness wanderings", "Abraham's journey", "the road to Emmaus",
  "the road to Damascus", "missionary journey", "the voyage to Rome", "the ascent to Jerusalem",
  "the flight to Egypt", "the return from exile",
]);

export const GAZETTEER: GazetteerTerm[] = [
  ...PLACES,
  ...PEOPLES,
  ...PERSONS,
  ...OBJECTS,
  ...ANIMALS,
  ...EVENTS,
  ...FESTIVALS,
  ...LAWS,
  ...THEOLOGY,
  ...PROPHECY,
  ...MIRACLES,
  ...PARABLES,
  ...JOURNEYS,
];

/** Deduped, longest-first so multi-word phrases win over their parts. */
export const GAZETTEER_PHRASES: GazetteerTerm[] = (() => {
  const seen = new Set<string>();
  const out: GazetteerTerm[] = [];
  for (const item of GAZETTEER) {
    const key = item.term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out.sort((a, b) => b.term.length - a.term.length);
})();

const KIND_BY_TERM = new Map(GAZETTEER_PHRASES.map((g) => [g.term.toLowerCase(), g.kind]));

export function gazetteerKind(term: string): EntityKind | undefined {
  return KIND_BY_TERM.get(term.trim().toLowerCase());
}
