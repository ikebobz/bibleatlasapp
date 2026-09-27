import { ARTIFACT_ENTRIES } from "./artifact-entries";
import type { AtlasEntry } from "./types";

const GEN = (chapter?: number) => ({ book: "genesis", chapter });

export const ATLAS_ENTRIES: AtlasEntry[] = [
  /* ───────────────────────── Genesis 1 ───────────────────────── */
  {
    id: "in-the-beginning",
    title: "In the beginning",
    kind: "concept",
    subtitle: "Genesis 1:1 — where the whole biblical story starts",
    matches: ["In the beginning", "the beginning"],
    scope: [GEN(1)],
    blocks: [
      {
        type: "prose",
        heading: "Why this opening matters",
        body: [
          "Genesis opens without argument or defence. It does not try to prove God; it announces him as the one who was already there when everything else began.",
          "Every later claim in Scripture rests on this sentence. If God made the heavens and the earth, then the world belongs to him, human beings are his creatures rather than accidents, and the story that follows is his to direct.",
        ],
      },
      {
        type: "timeline",
        heading: "The seven days",
        caption: "Days one to three form the spaces; days four to six fill them.",
        items: [
          { label: "Day 1", when: "Light", detail: "Light separated from darkness.", ref: "Genesis 1:3" },
          { label: "Day 2", when: "Sky", detail: "Waters above parted from waters below.", ref: "Genesis 1:6" },
          { label: "Day 3", when: "Land & plants", detail: "Dry ground appears and brings forth vegetation.", ref: "Genesis 1:9" },
          { label: "Day 4", when: "Lights", detail: "Sun, moon and stars fill the sky of day two.", ref: "Genesis 1:14" },
          { label: "Day 5", when: "Sea & sky life", detail: "Fish and birds fill sea and air.", ref: "Genesis 1:20" },
          { label: "Day 6", when: "Land life & humanity", detail: "Animals, then humanity in God's image.", ref: "Genesis 1:24", accent: true },
          { label: "Day 7", when: "Rest", detail: "God rests and makes the seventh day holy.", ref: "Genesis 2:2", accent: true },
        ],
      },
      {
        type: "diagram",
        heading: "The order of creation",
        caption: "The account is built as three formed spaces answered by three fillings.",
        columns: [
          { title: "Forming", subtitle: "Days 1–3", items: ["Light and darkness", "Sky and sea", "Land and plants"] },
          { title: "Filling", subtitle: "Days 4–6", items: ["Sun, moon, stars", "Fish and birds", "Animals and humanity"] },
          { title: "Resting", subtitle: "Day 7", items: ["Work completed", "The day blessed", "Rest made holy"] },
        ],
      },
      {
        type: "steps",
        heading: "Key themes",
        items: [
          { title: "Light", body: "The first act of creation, and a running image for God's presence, truth and salvation throughout Scripture." },
          { title: "Life", body: "God fills the world with living things and calls them good; life is a gift, not a cosmic accident." },
          { title: "Humanity", body: "Made male and female in God's image, given responsibility for the world rather than ownership of it." },
          { title: "Rest", body: "The week ends in rest, a pattern later written into the Sabbath and finally into the rest offered in Christ." },
        ],
      },
      {
        type: "refs",
        heading: "Creation echoed across Scripture",
        items: [
          { ref: "John 1:1", note: "\"In the beginning was the Word\" — John deliberately reopens Genesis 1." },
          { ref: "Psalm 33:6", note: "The heavens were made by the word of the LORD." },
          { ref: "Isaiah 45:18", note: "God formed the earth to be inhabited, not empty." },
          { ref: "Colossians 1:16", note: "All things created through and for Christ." },
          { ref: "Hebrews 4:9", note: "A Sabbath rest still remains for the people of God." },
          { ref: "Revelation 21:1", note: "A new heaven and a new earth — creation's story completed." },
        ],
      },
    ],
  },
  {
    id: "fruit-bearing-trees",
    title: "Fruit-bearing trees",
    kind: "object",
    subtitle: "Trees and their fruit in the creation account",
    matches: ["the tree", "fruit tree", "fruit trees"],
    scope: [GEN(1)],
    blocks: [
      {
        type: "prose",
        heading: "Trees in the creation account",
        body: [
          "On the third day, the land brings forth vegetation, including trees bearing fruit with seed in it. Genesis 1:12 describes ordinary living trees reproducing according to their kinds, and calls this good.",
          "The passage does not name a particular species or identify these trees with the later trees in the garden of Eden.",
        ],
      },
      {
        type: "refs",
        heading: "In the passage",
        items: [
          { ref: "Genesis 1:11", note: "God calls the land to bring forth fruit trees bearing seed." },
          { ref: "Genesis 1:12", note: "The land brings forth trees yielding fruit, and God sees that it is good." },
        ],
      },
    ],
  },
  {
    id: "image-of-god",
    title: "The image of God",
    kind: "concept",
    subtitle: "Genesis 1:26–27 — what humanity is for",
    matches: ["our image", "his own image", "God's image"],
    scope: [GEN(1), GEN(5), GEN(9)],
    blocks: [
      {
        type: "prose",
        heading: "A shared dignity",
        body: [
          "In the ancient world, an image of a king was set up in a territory to represent his rule. Genesis gives that role to every human being, male and female alike.",
          "The image is not a quality some people have more of. It is a status that grounds human dignity, and later becomes the reason murder is treated as an assault on God himself.",
        ],
      },
      {
        type: "refs",
        heading: "Where this leads",
        items: [
          { ref: "Genesis 9:6", note: "Human life is protected because people bear God's image." },
          { ref: "Psalm 8:5", note: "Crowned with glory and honour." },
          { ref: "Colossians 1:15", note: "Christ is the image of the invisible God." },
          { ref: "Romans 8:29", note: "Believers are being conformed to that image." },
        ],
      },
    ],
  },

  /* ───────────────────────── Genesis 3 ───────────────────────── */
  {
    id: "serpent",
    title: "The serpent",
    kind: "event",
    subtitle: "Genesis 3 — the voice that questions God's word",
    matches: ["serpent"],
    blocks: [
      {
        type: "prose",
        heading: "How the temptation works",
        body: [
          "The serpent never orders anyone to disobey. It asks a question that reframes God's generosity as restriction: \"Has God really said?\"",
          "Then it contradicts the warning outright and offers a motive — that God is holding something back. The first sin begins with a distorted picture of God's character.",
        ],
      },
      {
        type: "steps",
        heading: "The pattern of the fall",
        items: [
          { title: "Doubt", body: "God's word is questioned (3:1)." },
          { title: "Denial", body: "God's warning is contradicted (3:4)." },
          { title: "Desire", body: "The fruit is seen as good, pleasing and desirable (3:6)." },
          { title: "Disobedience", body: "The command is broken, and shared (3:6)." },
          { title: "Hiding", body: "Shame, covering and hiding from God (3:7–8)." },
        ],
      },
      {
        type: "refs",
        heading: "Traced through Scripture",
        items: [
          { ref: "John 8:44", note: "A liar and the father of lies from the beginning." },
          { ref: "2 Corinthians 11:3", note: "Paul recalls the serpent's cunning as a present danger." },
          { ref: "Matthew 4:1", note: "Jesus is tempted and answers with Scripture where Eden gave way." },
          { ref: "Revelation 12:9", note: "\"That old serpent\" named openly." },
          { ref: "Revelation 20:2", note: "The serpent bound and finally defeated." },
        ],
      },
    ],
  },
  {
    id: "tree-of-knowledge",
    title: "The forbidden tree",
    kind: "object",
    subtitle: "The tree of the knowledge of good and evil",
    matches: [
      "the tree of the knowledge of good and evil",
      "tree of the knowledge of good and evil",
      "the tree of life",
      "tree of life",
    ],
    blocks: [
      {
        type: "prose",
        heading: "One limit in a garden of gifts",
        body: [
          "Adam and Eve may eat from every tree but one. The prohibition is small, and that is the point: obedience here is trust, not deprivation.",
          "\"Knowing good and evil\" is less about information than authority — deciding for oneself what is good rather than receiving it from God.",
        ],
      },
      {
        type: "diagram",
        heading: "Two trees, two futures",
        columns: [
          { title: "Tree of life", subtitle: "Access lost in Eden", items: ["Life sustained by God", "Guarded after the fall", "Reappears in Revelation 22"] },
          { title: "Tree of knowledge", subtitle: "The one limit", items: ["Trust tested", "Autonomy chosen", "Death enters the world"] },
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Genesis 2:9", note: "Both trees named in the middle of the garden." },
          { ref: "Romans 6:23", note: "The wages of sin is death." },
          { ref: "Revelation 22:2", note: "The tree of life restored in the new creation." },
        ],
      },
    ],
  },
  {
    id: "offspring-of-the-woman",
    title: "The offspring of the woman",
    kind: "prophecy",
    subtitle: "Genesis 3:15 — the Bible's first promise of a Saviour",
    matches: ["her offspring", "bruise your head", "bruise his heel", "your offspring and her offspring"],
    blocks: [
      {
        type: "prose",
        heading: "A promise inside a curse",
        body: [
          "God's first words after the fall are spoken to the serpent, and they contain a promise. Hostility is set between the serpent and the woman's offspring, and that offspring will crush the serpent's head while suffering a wound to the heel.",
          "Readers since the earliest centuries have called this the protoevangelium — the gospel in seed form. A descendant of the woman will undo what happened in Eden, at real cost to himself.",
        ],
      },
      {
        type: "timeline",
        heading: "The promise unfolding",
        caption: "From Eden to the Cross to the New Creation.",
        items: [
          { label: "Eden", when: "Genesis 3:15", detail: "The offspring of the woman will crush the serpent's head.", accent: true },
          { label: "Abraham", when: "Genesis 12:3", detail: "Through one family all nations will be blessed." },
          { label: "David", when: "2 Samuel 7:12", detail: "An everlasting throne promised to David's offspring." },
          { label: "Isaiah", when: "Isaiah 7:14; 9:6", detail: "A child born of a virgin; a son given who reigns." },
          { label: "Micah", when: "Micah 5:2", detail: "The ruler comes from Bethlehem, from ancient days." },
          { label: "Bethlehem", when: "Matthew 1; Luke 1", detail: "The child is born of Mary — the woman's offspring.", accent: true },
          { label: "The Cross", when: "John 19", detail: "The heel is struck; the serpent's power is broken.", accent: true },
          { label: "Resurrection", when: "1 Corinthians 15:20", detail: "Death itself begins to be undone." },
          { label: "New Creation", when: "Revelation 20:10; 21:4", detail: "The serpent destroyed, death and mourning gone.", accent: true },
        ],
      },
      {
        type: "diagram",
        heading: "Adam and the last Adam",
        caption: "Paul reads Genesis 3 through the lens of the Cross.",
        columns: [
          {
            title: "Adam",
            subtitle: "The first man",
            items: ["Tested in a garden", "Chose his own way", "Sin entered the world", "Death spread to all", "Cast out from God's presence"],
          },
          {
            title: "Jesus",
            subtitle: "The last Adam",
            items: ["Tested in a wilderness and a garden", "Chose the Father's will", "Righteousness offered as a gift", "Life given to many", "Opens the way back to God"],
          },
        ],
      },
      {
        type: "steps",
        heading: "How sin entered, how salvation comes",
        items: [
          { title: "Through one man", body: "Romans 5:12 — sin entered the world through one man, and death through sin." },
          { title: "Through one man", body: "Romans 5:19 — through the obedience of one man, many are made righteous." },
          { title: "Born of a woman", body: "Galatians 4:4 — at the right time God sent his Son, born of a woman." },
          { title: "Sharing our flesh", body: "Hebrews 2:14 — he shared in flesh and blood to destroy the one who holds the power of death." },
        ],
      },
      {
        type: "refs",
        heading: "Cross-references",
        items: [
          { ref: "Isaiah 7:14", note: "The sign of Immanuel — God with us." },
          { ref: "Isaiah 9:6", note: "A child born, a son given, government on his shoulders." },
          { ref: "Micah 5:2", note: "Bethlehem named as the ruler's birthplace." },
          { ref: "Matthew 1:21", note: "He will save his people from their sins." },
          { ref: "Luke 1:31", note: "The announcement to Mary." },
          { ref: "John 1:14", note: "The Word became flesh and lived among us." },
          { ref: "Romans 5:12", note: "Adam and Christ compared directly." },
          { ref: "1 Corinthians 15:22", note: "In Adam all die; in Christ all will be made alive." },
          { ref: "Galatians 4:4", note: "Born of a woman, born under the law." },
          { ref: "Hebrews 2:14", note: "Death defeated by sharing our humanity." },
          { ref: "Revelation 20:10", note: "The serpent's end." },
        ],
      },
    ],
  },
  {
    id: "curse",
    title: "The curse",
    kind: "event",
    subtitle: "Genesis 3:16–19 — the consequences of the fall",
    matches: ["cursed is the ground", "cursed are you", "thorns and thistles", "you will return to the ground"],
    blocks: [
      {
        type: "prose",
        heading: "Every relationship strained",
        body: [
          "The consequences are not arbitrary punishments; they describe a world where every relationship has been fractured — with God, with each other, with work, and with the ground itself.",
        ],
      },
      {
        type: "diagram",
        heading: "Fracture and repair",
        columns: [
          { title: "Consequence", items: ["Shame before God", "Conflict between man and woman", "Painful labour", "Cursed ground and thorns", "Return to dust"] },
          { title: "God's answer", items: ["God seeks them and speaks", "A promised offspring", "Redemption promised through suffering", "Creation itself to be freed (Romans 8:21)", "Resurrection (1 Corinthians 15:54)"] },
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Romans 8:20", note: "Creation subjected to futility, but in hope." },
          { ref: "Matthew 27:29", note: "A crown of thorns — the curse pressed onto Christ's head." },
          { ref: "Revelation 22:3", note: "\"There will be no curse any more.\"" },
        ],
      },
    ],
  },
  {
    id: "garments-of-skin",
    title: "Garments of skin",
    kind: "object",
    subtitle: "Genesis 3:21 — the first covering God provides",
    matches: ["garments of animal skins", "coats of skins", "garments of skin"],
    blocks: [
      {
        type: "prose",
        heading: "Fig leaves and something better",
        body: [
          "Adam and Eve sew fig leaves; God makes them clothing that lasts. Their own covering was inadequate, and a life is taken to provide the replacement.",
          "This quiet verse introduces a pattern the rest of Scripture develops: God himself provides the covering that human beings cannot make for themselves.",
        ],
      },
      {
        type: "refs",
        heading: "The pattern continues",
        items: [
          { ref: "Genesis 22:8", note: "\"God will provide the lamb.\"" },
          { ref: "Isaiah 61:10", note: "Clothed with garments of salvation." },
          { ref: "Romans 13:14", note: "Put on the Lord Jesus Christ." },
          { ref: "Revelation 7:14", note: "Robes washed white — the final covering." },
        ],
      },
    ],
  },
  {
    id: "eden",
    title: "The garden of Eden",
    kind: "place",
    subtitle: "The world as it was meant to be",
    matches: ["garden of Eden", "Eden", "the garden"],
    blocks: [
      {
        type: "map",
        heading: "Where the rivers meet",
        caption: "Genesis names the Tigris and Euphrates, placing Eden in the wider Mesopotamian world. Its exact site is unknown.",
        focus: ["eden", "ur", "babel", "ararat"],
      },
      {
        type: "prose",
        heading: "A temple-garden",
        body: [
          "Eden is described with the language later used for the tabernacle and temple: God walks there, precious stones are named, and cherubim guard the entrance once humanity is sent out.",
          "The Bible ends where it began, but larger — a garden-city where God dwells with his people and the tree of life grows again.",
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Ezekiel 28:13", note: "Eden recalled as the garden of God." },
          { ref: "Revelation 22:1", note: "The river and the tree of life restored." },
        ],
      },
    ],
  },
  {
    id: "adam",
    title: "Adam",
    kind: "person",
    subtitle: "The first man — and a pattern for the last",
    matches: ["Adam"],
    blocks: [
      {
        type: "facts",
        heading: "At a glance",
        items: [
          { label: "Name", value: "'Adam' means humanity, and echoes 'adamah', the ground" },
          { label: "Made", value: "From dust, given the breath of life (Genesis 2:7)" },
          { label: "Role", value: "To work and keep the garden" },
          { label: "Sons named", value: "Cain, Abel, Seth" },
        ],
      },
      {
        type: "tree",
        heading: "The first family",
        root: {
          name: "Adam",
          role: "the first man",
          children: [
            { name: "Cain", role: "firstborn" },
            { name: "Abel", role: "keeper of sheep" },
            { name: "Seth", role: "line leading to Noah", entry: "noah" },
          ],
        },
      },
      {
        type: "refs",
        heading: "Adam beyond Genesis",
        items: [
          { ref: "Luke 3:38", note: "Jesus' genealogy traced back to Adam." },
          { ref: "Romans 5:14", note: "Adam as a pattern of the one to come." },
          { ref: "1 Corinthians 15:45", note: "\"The last Adam became a life-giving spirit.\"" },
        ],
      },
    ],
  },
  {
    id: "eve",
    title: "Eve",
    kind: "person",
    subtitle: "\"The mother of all living\"",
    matches: ["Eve"],
    blocks: [
      {
        type: "prose",
        heading: "Named in hope",
        body: [
          "Adam names his wife Eve — living — immediately after the sentence of death is spoken. The name is an act of faith in the promise just given about her offspring.",
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Genesis 3:15", note: "The promise attached to her offspring." },
          { ref: "Luke 1:38", note: "Mary's answer, often read as Eve's story reversed." },
        ],
      },
    ],
  },

  /* ───────────────────────── Genesis 6–11 ───────────────────────── */
  {
    id: "noah",
    title: "Noah",
    kind: "person",
    subtitle: "Judgement, rescue, and a covenant with all creation",
    matches: ["Noah"],
    blocks: [
      {
        type: "map",
        heading: "Where the ark came to rest",
        focus: ["ararat", "eden", "babel"],
      },
      {
        type: "timeline",
        heading: "The flood account",
        items: [
          { label: "Corruption", detail: "The earth is filled with violence.", ref: "Genesis 6:11" },
          { label: "The ark", detail: "Noah builds as God instructed.", ref: "Genesis 6:22" },
          { label: "The flood", detail: "Waters rise for 150 days.", ref: "Genesis 7:24" },
          { label: "Rest", detail: "The ark rests on the mountains of Ararat.", ref: "Genesis 8:4" },
          { label: "Covenant", detail: "The rainbow given as a sign.", ref: "Genesis 9:13", accent: true },
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Matthew 24:37", note: "\"As the days of Noah were.\"" },
          { ref: "Hebrews 11:7", note: "Noah listed among the faithful." },
          { ref: "1 Peter 3:20", note: "The ark read as a picture of salvation." },
        ],
      },
    ],
  },
  {
    id: "babel",
    title: "Babel",
    kind: "place",
    subtitle: "A tower, a scattering, and a reversal at Pentecost",
    matches: ["Babel", "Shinar"],
    blocks: [
      { type: "map", heading: "The plain of Shinar", focus: ["babel", "ur", "nineveh"] },
      {
        type: "prose",
        heading: "A name for themselves",
        body: [
          "The builders want a tower reaching heaven and a name that will keep them from being scattered. God's response scatters them anyway — and the story sets up the call of Abram, through whom God will make a name and bless the nations his own way.",
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Genesis 12:2", note: "\"I will make your name great\" — God's answer to Babel." },
          { ref: "Acts 2:6", note: "At Pentecost every language hears one message." },
          { ref: "Revelation 7:9", note: "Every nation and language gathered together." },
        ],
      },
    ],
  },

  /* ───────────────────────── Genesis 12 ───────────────────────── */
  {
    id: "ur",
    title: "Ur of the Chaldeans",
    kind: "place",
    subtitle: "Abraham's birthplace in southern Mesopotamia",
    matches: ["Ur of the Chaldees", "Ur of the Chaldeans", "Ur"],
    blocks: [
      {
        type: "map",
        heading: "Abraham's journey",
        caption: "Ur to Haran, then south into Canaan and on to Egypt.",
        focus: ["ur", "haran", "shechem", "bethel", "egypt"],
        route: {
          name: "Abraham's journey",
          stops: [
            { place: "ur", label: "Ur", note: "The family leaves Ur (Genesis 11:31)." },
            { place: "haran", label: "Haran", note: "They settle; Terah dies here." },
            { place: "damascus", label: "Damascus", note: "The trade road south through Aram." },
            { place: "shechem", label: "Shechem", note: "First stop in Canaan; the oak of Moreh (12:6)." },
            { place: "bethel", label: "Bethel", note: "An altar built between Bethel and Ai (12:8)." },
            { place: "negev", label: "The Negev", note: "Journeying on toward the south (12:9)." },
            { place: "egypt", label: "Egypt", note: "Famine drives Abram down to Egypt (12:10)." },
          ],
        },
      },
      {
        type: "facts",
        heading: "The city itself",
        items: [
          { label: "Location", value: "Southern Iraq, near the ancient course of the Euphrates" },
          { label: "Period", value: "A major Sumerian city; at its height around 2100–2000 BC" },
          { label: "Religion", value: "Centre of moon-god worship, dominated by a great ziggurat" },
          { label: "Scale", value: "One of the largest cities in the world of its day" },
        ],
      },
      {
        type: "prose",
        heading: "Historical background",
        body: [
          "Ur was not a backwater. It was a wealthy, literate, temple-centred city with international trade, law codes and schools. Leaving it for a tent in Canaan meant leaving the most advanced culture of the age.",
          "Joshua later reminds Israel that Abraham's family served other gods beyond the River. The call of Abram is a call out of a religious world as much as out of a place.",
        ],
      },
      {
        type: "prose",
        heading: "Archaeology",
        body: [
          "Excavations at Tell el-Muqayyar from the 1920s uncovered the ziggurat of Ur, royal tombs with extraordinary metalwork, and thousands of clay tablets recording contracts, loans and school exercises.",
          "The finds give a vivid picture of the settled, prosperous life Abraham's family walked away from.",
        ],
      },
      {
        type: "timeline",
        heading: "Timeline placement",
        items: [
          { label: "Ur at its height", when: "c. 2100 BC", detail: "The Third Dynasty of Ur rules southern Mesopotamia." },
          { label: "Terah leaves Ur", when: "Genesis 11:31", detail: "The family sets out for Canaan and settles in Haran." },
          { label: "The call of Abram", when: "Genesis 12:1", detail: "God calls Abram to leave country, family and father's house.", accent: true },
          { label: "Entering Canaan", when: "Genesis 12:5", detail: "Abram arrives at Shechem." },
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Genesis 11:31", note: "Terah takes Abram out of Ur toward Canaan." },
          { ref: "Genesis 15:7", note: "\"I am Yahweh who brought you out of Ur.\"" },
          { ref: "Nehemiah 9:7", note: "Israel remembers the call out of Ur in prayer." },
          { ref: "Acts 7:2", note: "Stephen begins Israel's story in Mesopotamia." },
          { ref: "Hebrews 11:8", note: "He went out, not knowing where he was going." },
        ],
      },
    ],
  },
  {
    id: "haran",
    title: "Haran",
    kind: "place",
    subtitle: "The waypoint the family could not quite leave",
    matches: ["Haran"],
    blocks: [
      {
        type: "map",
        heading: "On the road between two worlds",
        focus: ["ur", "haran", "damascus", "shechem"],
        route: {
          name: "Ur to Haran",
          stops: [
            { place: "ur", label: "Ur" },
            { place: "haran", label: "Haran" },
          ],
        },
      },
      {
        type: "prose",
        heading: "Why Haran matters",
        body: [
          "Haran sat on the caravan route linking Mesopotamia to the Mediterranean, and shared Ur's devotion to the moon god. Terah's family stopped here and stayed until he died.",
          "Haran keeps pulling on the family: Abraham's servant returns here for Isaac's wife, and Jacob flees here for twenty years.",
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Genesis 11:32", note: "Terah dies in Haran." },
          { ref: "Genesis 24:4", note: "A wife for Isaac sought from this country." },
          { ref: "Genesis 28:10", note: "Jacob flees toward Haran." },
        ],
      },
    ],
  },
  {
    id: "canaan",
    title: "Canaan",
    kind: "place",
    subtitle: "The land promised to Abraham's family",
    matches: ["land of Canaan", "Canaan", "Canaanite"],
    blocks: [
      {
        type: "map",
        heading: "The land of promise",
        focus: ["shechem", "bethel", "hebron", "beersheba", "negev", "canaan"],
      },
      {
        type: "prose",
        heading: "A land already occupied",
        body: [
          "Genesis notes plainly that \"the Canaanite was then in the land.\" Abram receives a promise about a place he will never own, living in it as a resident foreigner.",
          "Canaan is a corridor: every army and caravan between Egypt and Mesopotamia passes through it. The promise puts Abraham's family at the crossroads of the ancient world.",
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Genesis 15:18", note: "The boundaries of the promise described." },
          { ref: "Exodus 3:8", note: "God remembers the land when he rescues Israel." },
          { ref: "Hebrews 11:9", note: "Abraham lived in the promised land as a foreigner." },
        ],
      },
    ],
  },
  {
    id: "abraham",
    title: "Abraham",
    kind: "person",
    subtitle: "Called out of Ur; father of a promised family",
    matches: ["Abram", "Abraham"],
    blocks: [
      {
        type: "facts",
        heading: "At a glance",
        items: [
          { label: "From", value: "Ur of the Chaldeans, then Haran" },
          { label: "Called", value: "Genesis 12:1 — to a land God would show him" },
          { label: "Promised", value: "A land, a great nation, and blessing for all peoples" },
          { label: "Distance travelled", value: "Roughly 1,600 km from Ur to Canaan by the caravan roads" },
        ],
      },
      {
        type: "map",
        heading: "The whole journey",
        caption: "Play the route to follow the stages and cumulative distance.",
        focus: ["ur", "haran", "shechem", "bethel", "hebron", "egypt"],
        route: {
          name: "Ur to Canaan and Egypt",
          stops: [
            { place: "ur", label: "Ur" },
            { place: "haran", label: "Haran" },
            { place: "damascus", label: "Damascus" },
            { place: "shechem", label: "Shechem" },
            { place: "bethel", label: "Bethel" },
            { place: "negev", label: "Negev" },
            { place: "egypt", label: "Egypt" },
            { place: "hebron", label: "Hebron" },
          ],
        },
      },
      {
        type: "tree",
        heading: "Family line",
        root: {
          name: "Terah",
          children: [
            {
              name: "Abraham",
              role: "with Sarah",
              children: [
                { name: "Ishmael", role: "with Hagar" },
                {
                  name: "Isaac",
                  role: "the child of promise",
                  entry: "isaac",
                  children: [
                    { name: "Esau" },
                    { name: "Jacob", role: "renamed Israel", entry: "jacob" },
                  ],
                },
              ],
            },
            { name: "Nahor" },
            { name: "Haran", role: "father of Lot" },
          ],
        },
      },
      {
        type: "timeline",
        heading: "Life events",
        items: [
          { label: "The call", when: "Genesis 12", detail: "Leaves Haran for Canaan at seventy-five.", accent: true },
          { label: "Covenant", when: "Genesis 15", detail: "God promises offspring as numerous as the stars." },
          { label: "Sign of covenant", when: "Genesis 17", detail: "Renamed Abraham; circumcision given as the sign." },
          { label: "Isaac born", when: "Genesis 21", detail: "The promised son arrives." },
          { label: "Moriah", when: "Genesis 22", detail: "\"God will provide the lamb.\"", accent: true },
        ],
      },
      {
        type: "refs",
        heading: "Abraham beyond Genesis",
        items: [
          { ref: "Romans 4:3", note: "Abraham believed God, and it was credited as righteousness." },
          { ref: "Galatians 3:8", note: "The gospel announced in advance to Abraham." },
          { ref: "Hebrews 11:8", note: "Faith that set out without knowing the destination." },
          { ref: "Matthew 1:1", note: "Jesus named as son of Abraham." },
        ],
      },
    ],
  },
  {
    id: "shechem",
    title: "Shechem",
    kind: "place",
    subtitle: "The first place Abram stops in Canaan",
    matches: ["Shechem", "Moreh"],
    blocks: [
      { type: "map", heading: "In the hill country", focus: ["shechem", "bethel", "dothan", "samaria"] },
      {
        type: "prose",
        heading: "A hinge in the story",
        body: [
          "Shechem sits in a pass between Mount Ebal and Mount Gerizim, on the main north–south route. Abram builds his first altar here after God says, \"To your offspring I will give this land.\"",
          "The same ground reappears again and again: Jacob buys a field here, Joseph is buried here, Israel renews the covenant here — and Jesus speaks with a Samaritan woman at Jacob's well just outside.",
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Genesis 33:19", note: "Jacob buys a plot of ground at Shechem." },
          { ref: "Genesis 37:12", note: "Joseph's brothers pasture the flocks near Shechem." },
          { ref: "Joshua 24:1", note: "Israel renews the covenant at Shechem." },
          { ref: "John 4:5", note: "Jesus comes to Sychar, near Jacob's field." },
        ],
      },
    ],
  },
  {
    id: "egypt",
    title: "Egypt",
    kind: "place",
    subtitle: "Refuge, furnace, and the road to Exodus",
    matches: ["Egypt", "Egyptian", "Egyptians", "Pharaoh"],
    blocks: [
      {
        type: "map",
        heading: "Down to Egypt",
        focus: ["egypt", "goshen", "negev", "hebron", "sinai"],
        route: {
          name: "Canaan to Egypt",
          stops: [
            { place: "hebron", label: "Hebron" },
            { place: "beersheba", label: "Beersheba" },
            { place: "negev", label: "Negev" },
            { place: "goshen", label: "Goshen" },
          ],
        },
      },
      {
        type: "prose",
        heading: "Why Egypt, again and again",
        body: [
          "Fed by the Nile, Egypt had grain when Canaan had famine. Abram goes down in Genesis 12, Joseph is sold there in Genesis 37, Jacob's whole family follows in Genesis 46 — and Jesus' family flees there in Matthew 2.",
          "Egypt is where the family becomes a nation, and where rescue becomes the defining memory of Israel's faith.",
        ],
      },
      {
        type: "timeline",
        heading: "Egypt through the story",
        items: [
          { label: "Abram", when: "Genesis 12:10", detail: "Famine drives him down to Egypt." },
          { label: "Joseph sold", when: "Genesis 37:36", detail: "Taken to Egypt and sold to Potiphar." },
          { label: "Jacob's family", when: "Genesis 46", detail: "Seventy people settle in Goshen." },
          { label: "Slavery", when: "Exodus 1", detail: "A new king who did not know Joseph." },
          { label: "Exodus", when: "Exodus 12", detail: "Israel leaves after the Passover.", accent: true },
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Exodus 3:7", note: "\"I have surely seen the affliction of my people in Egypt.\"" },
          { ref: "Matthew 2:15", note: "\"Out of Egypt I called my son.\"" },
        ],
      },
    ],
  },

  /* ───────────────────────── Genesis 37 ───────────────────────── */
  {
    id: "joseph",
    title: "Joseph",
    kind: "person",
    subtitle: "From the pit at Dothan to the court of Pharaoh",
    matches: ["Joseph"],
    scope: [{ book: "genesis" }, { book: "exodus" }],
    blocks: [
      {
        type: "facts",
        heading: "At a glance",
        items: [
          { label: "Father", value: "Jacob (Israel)" },
          { label: "Mother", value: "Rachel" },
          { label: "Brothers", value: "Eleven, including Judah and Benjamin" },
          { label: "Sold at", value: "Dothan, for twenty pieces of silver" },
          { label: "Died", value: "In Egypt, aged 110, with a request about his bones" },
        ],
      },
      {
        type: "tree",
        heading: "Family tree",
        caption: "Jacob's twelve sons became the tribes of Israel.",
        root: {
          name: "Jacob (Israel)",
          entry: "jacob",
          children: [
            { name: "Leah's sons", role: "Reuben, Simeon, Levi, Judah, Issachar, Zebulun" },
            { name: "Rachel's sons", role: "Joseph, Benjamin" },
            { name: "Bilhah's sons", role: "Dan, Naphtali" },
            { name: "Zilpah's sons", role: "Gad, Asher" },
          ],
        },
      },
      {
        type: "map",
        heading: "Places he lived",
        caption: "Hebron, the pastures near Shechem and Dothan, then Egypt.",
        focus: ["hebron", "shechem", "dothan", "egypt", "goshen"],
        route: {
          name: "Joseph's road to Egypt",
          stops: [
            { place: "hebron", label: "Hebron", note: "Sent by Jacob to check on his brothers." },
            { place: "shechem", label: "Shechem", note: "They had moved on from here." },
            { place: "dothan", label: "Dothan", note: "Thrown into a pit and sold to traders." },
            { place: "egypt", label: "Egypt", note: "Sold to Potiphar, an officer of Pharaoh." },
            { place: "goshen", label: "Goshen", note: "Where he later settles his family." },
          ],
        },
      },
      {
        type: "timeline",
        heading: "Timeline",
        items: [
          { label: "The dreams", when: "Genesis 37:5", detail: "Sheaves and stars bowing down." },
          { label: "Sold", when: "Genesis 37:28", detail: "Taken by traders to Egypt.", accent: true },
          { label: "Potiphar's house", when: "Genesis 39", detail: "Trusted, then falsely accused." },
          { label: "Prison", when: "Genesis 40", detail: "Interprets the dreams of two officials." },
          { label: "Second in Egypt", when: "Genesis 41", detail: "Pharaoh's dream interpreted; famine prepared for.", accent: true },
          { label: "Reunion", when: "Genesis 45", detail: "\"I am Joseph your brother.\"" },
          { label: "Israel in Goshen", when: "Genesis 46–47", detail: "The family settles in Egypt." },
        ],
      },
      {
        type: "steps",
        heading: "Important themes",
        items: [
          { title: "Providence", body: "\"You meant evil against me, but God meant it for good\" (Genesis 50:20)." },
          { title: "Forgiveness", body: "Joseph tests his brothers, then weeps and restores them." },
          { title: "Preservation", body: "The family survives famine, and the promise to Abraham survives with it." },
          { title: "Exile and return", body: "Israel's whole later story — going down, and being brought up — is written small in Joseph." },
        ],
      },
      {
        type: "refs",
        heading: "Connections to Exodus and beyond",
        items: [
          { ref: "Genesis 50:24", note: "\"God will surely visit you, and bring you up out of this land.\"" },
          { ref: "Exodus 1:8", note: "A new king arose who did not know Joseph." },
          { ref: "Exodus 13:19", note: "Moses carries Joseph's bones out of Egypt — a promise kept." },
          { ref: "Joshua 24:32", note: "Joseph is buried at Shechem, in Jacob's field." },
          { ref: "Acts 7:9", note: "Stephen retells Joseph's story to the council." },
          { ref: "Hebrews 11:22", note: "Joseph's faith shown in his instructions about his bones." },
        ],
      },
    ],
  },
  {
    id: "jacob",
    title: "Jacob (Israel)",
    kind: "person",
    subtitle: "The grasping younger brother who became a nation's name",
    matches: ["Jacob", "Israel"],
    scope: [{ book: "genesis" }, { book: "exodus" }],
    blocks: [
      {
        type: "timeline",
        heading: "A life in stages",
        items: [
          { label: "Birthright", when: "Genesis 25", detail: "Bought from Esau for a bowl of stew." },
          { label: "Bethel", when: "Genesis 28", detail: "The stairway dream while fleeing to Haran.", accent: true },
          { label: "Haran", when: "Genesis 29–31", detail: "Twenty years with Laban; marriage, children, flocks." },
          { label: "Peniel", when: "Genesis 32", detail: "Wrestles until daybreak and is renamed Israel.", accent: true },
          { label: "Egypt", when: "Genesis 46", detail: "Goes down to see Joseph before he dies." },
        ],
      },
      {
        type: "map",
        heading: "Jacob's travels",
        focus: ["beersheba", "bethel", "haran", "shechem", "hebron", "goshen"],
        route: {
          name: "Beersheba to Haran and back",
          stops: [
            { place: "beersheba", label: "Beersheba" },
            { place: "bethel", label: "Bethel" },
            { place: "damascus", label: "Damascus" },
            { place: "haran", label: "Haran" },
            { place: "shechem", label: "Shechem" },
            { place: "hebron", label: "Hebron" },
            { place: "goshen", label: "Goshen" },
          ],
        },
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Genesis 35:10", note: "\"Your name will be Israel.\"" },
          { ref: "John 1:51", note: "Jesus alludes to Jacob's stairway." },
          { ref: "John 4:12", note: "\"Are you greater than our father Jacob?\"" },
        ],
      },
    ],
  },
  {
    id: "dothan",
    title: "Dothan",
    kind: "place",
    subtitle: "Where Joseph was sold",
    matches: ["Dothan"],
    blocks: [
      {
        type: "map",
        heading: "On the caravan road",
        caption: "Dothan sat on the trade route running from Gilead down to Egypt — which is exactly why the Ishmaelite caravan passed by.",
        focus: ["dothan", "shechem", "hebron", "egypt"],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Genesis 37:17", note: "\"They have left here... let's go to Dothan.\"" },
          { ref: "2 Kings 6:13", note: "Elisha at Dothan, surrounded by chariots of fire." },
        ],
      },
    ],
  },
  {
    id: "isaac",
    title: "Isaac",
    kind: "person",
    subtitle: "The child of promise",
    matches: ["Isaac"],
    blocks: [
      {
        type: "prose",
        heading: "Laughter and promise",
        body: [
          "Isaac's name means laughter — Sarah laughed at the promise, then laughed again when it arrived. His life is quieter than his father's or his son's, but the covenant passes through him.",
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Genesis 22:2", note: "\"Take your son, your only son, whom you love.\"" },
          { ref: "Romans 9:7", note: "\"Through Isaac your offspring will be named.\"" },
          { ref: "Hebrews 11:19", note: "Abraham considered that God could raise the dead." },
        ],
      },
    ],
  },
  {
    id: "sodom",
    title: "Sodom",
    kind: "place",
    subtitle: "The cities of the plain",
    matches: ["Sodom", "Gomorrah"],
    blocks: [
      { type: "map", heading: "By the Salt Sea", focus: ["sodom", "hebron", "jericho"] },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Genesis 18:25", note: "\"Shall not the Judge of all the earth do right?\"" },
          { ref: "Ezekiel 16:49", note: "Pride, plenty and neglect of the poor named as Sodom's guilt." },
          { ref: "Luke 17:29", note: "Jesus recalls the day Lot left Sodom." },
        ],
      },
    ],
  },

  /* ───────────────────────── Gospels ───────────────────────── */
  {
    id: "samaria",
    title: "Samaria",
    kind: "place",
    subtitle: "The region Jesus 'had to' pass through",
    matches: ["Samaria", "Samaritan", "Samaritans", "Sychar"],
    blocks: [
      {
        type: "map",
        heading: "Two ways from Judea to Galilee",
        caption: "Many Jewish travellers crossed the Jordan to avoid Samaria. Jesus went straight through it.",
        focus: ["jerusalem", "sychar", "samaria", "capernaum", "jericho", "perea"],
        route: {
          name: "The route Jesus chose",
          stops: [
            { place: "jerusalem", label: "Judea", note: "Leaving Judea for Galilee (John 4:3)." },
            { place: "sychar", label: "Sychar", note: "Resting at Jacob's well about noon (John 4:6)." },
            { place: "samaria", label: "Samaria", note: "Two days spent with the townspeople (John 4:40)." },
            { place: "capernaum", label: "Galilee", note: "Arriving in Galilee (John 4:45)." },
          ],
        },
        compare: [
          {
            name: "The common Jewish detour",
            muted: true,
            stops: [
              { place: "jerusalem", label: "Jerusalem" },
              { place: "jericho", label: "Jericho" },
              { place: "perea", label: "Perea" },
              { place: "capernaum", label: "Galilee" },
            ],
          },
        ],
      },
      {
        type: "facts",
        heading: "Walking distance compared",
        items: [
          { label: "Through Samaria", value: "About 110 km — roughly three days on foot" },
          { label: "Around by the Jordan", value: "About 140 km — commonly four to five days" },
          { label: "The point", value: "The detour cost time; John says Jesus 'had to' go through Samaria" },
        ],
      },
      {
        type: "prose",
        heading: "Why Jews and Samaritans avoided each other",
        body: [
          "After the northern kingdom fell in 722 BC, the population of Samaria was mixed with settlers from other nations. Samaritans kept the five books of Moses but worshipped at Mount Gerizim rather than Jerusalem.",
          "By the first century the hostility was old and mutual: rival temples, rival claims to Abraham and Jacob, and centuries of insult. \"Jews have no dealings with Samaritans,\" John explains — which is why the woman is startled that Jesus speaks to her at all.",
        ],
      },
      {
        type: "prose",
        heading: "Why this moment is significant",
        body: [
          "Jesus asks a favour of a woman his contemporaries would have avoided on three counts — Samaritan, female, and living outside respectable marriage — and then offers her living water.",
          "It is to her, not to the religious leaders of Jerusalem, that he says plainly, \"I am he.\" The first town to believe on the word of a witness in John's Gospel is a Samaritan town.",
        ],
      },
      {
        type: "refs",
        heading: "Samaria in the Old Testament",
        items: [
          { ref: "Genesis 33:19", note: "Jacob buys the field near which the well stands." },
          { ref: "Genesis 48:22", note: "The land Jacob gives to Joseph." },
          { ref: "2 Kings 17:24", note: "Resettlement of Samaria after the Assyrian conquest." },
        ],
      },
      {
        type: "refs",
        heading: "Samaria in the New Testament",
        items: [
          { ref: "Luke 10:33", note: "The parable of the good Samaritan." },
          { ref: "Luke 17:16", note: "The one grateful leper was a Samaritan." },
          { ref: "John 4:42", note: "\"This is indeed the Christ, the Saviour of the world.\"" },
          { ref: "Acts 1:8", note: "\"In Jerusalem, in all Judea and Samaria, and to the ends of the earth.\"" },
          { ref: "Acts 8:5", note: "Philip preaches in a Samaritan city — Acts 1:8 beginning to happen." },
        ],
      },
    ],
  },
  {
    id: "jesus",
    title: "Jesus",
    kind: "person",
    subtitle: "The one the whole story has been moving toward",
    matches: ["Jesus", "Christ", "Messiah"],
    blocks: [
      {
        type: "timeline",
        heading: "Promise and fulfilment",
        items: [
          { label: "Genesis 3:15", detail: "The offspring of the woman who crushes the serpent.", accent: true },
          { label: "Genesis 12:3", detail: "Blessing for all nations through Abraham's family." },
          { label: "Isaiah 7:14", detail: "Immanuel — God with us." },
          { label: "Micah 5:2", detail: "The ruler from Bethlehem." },
          { label: "Matthew 1:1", detail: "Son of David, son of Abraham.", accent: true },
          { label: "1 Corinthians 15:20", detail: "Raised as the firstfruits of those who sleep.", accent: true },
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Luke 24:27", note: "He explained everything concerning himself in all the Scriptures." },
          { ref: "John 5:39", note: "\"These are they which testify about me.\"" },
        ],
      },
    ],
  },
  {
    id: "jerusalem",
    title: "Jerusalem",
    kind: "place",
    subtitle: "City of the temple, the cross and the first church",
    matches: ["Jerusalem", "Zion"],
    blocks: [
      { type: "map", heading: "In the Judean hills", focus: ["jerusalem", "bethlehem", "jericho", "hebron", "caesarea"] },
      {
        type: "timeline",
        heading: "Jerusalem in the story",
        items: [
          { label: "Salem", when: "Genesis 14:18", detail: "Melchizedek, king of Salem, blesses Abram." },
          { label: "Moriah", when: "Genesis 22:2", detail: "The mountain of Abraham's test." },
          { label: "David's city", when: "2 Samuel 5:7", detail: "Captured and made the capital." },
          { label: "Crucifixion", when: "Luke 23", detail: "Outside the city wall.", accent: true },
          { label: "Pentecost", when: "Acts 2", detail: "The church begins here.", accent: true },
        ],
      },
    ],
  },

  /* ───────────────────────── Acts ───────────────────────── */
  {
    id: "paul",
    title: "Paul",
    kind: "person",
    subtitle: "From persecutor to apostle to the nations",
    matches: ["Paul", "Saul of Tarsus"],
    scope: [{ book: "acts" }],
    blocks: [
      {
        type: "map",
        heading: "The missionary journeys",
        caption: "Antioch was the sending church for each journey.",
        focus: ["antioch", "cyprus", "ephesus", "philippi", "corinth", "athens", "rome", "jerusalem"],
        route: {
          name: "Outline of the journeys",
          stops: [
            { place: "jerusalem", label: "Jerusalem", note: "Where Saul first appears, approving Stephen's death." },
            { place: "damascus", label: "Damascus", note: "Blinded on the road; called by Christ." },
            { place: "tarsus", label: "Tarsus", note: "His home city." },
            { place: "antioch", label: "Antioch", note: "Base for the missionary journeys." },
            { place: "cyprus", label: "Cyprus", note: "First journey with Barnabas." },
            { place: "philippi", label: "Philippi", note: "The gospel crosses into Europe." },
            { place: "thessalonica", label: "Thessalonica" },
            { place: "athens", label: "Athens", note: "The speech at the Areopagus." },
            { place: "corinth", label: "Corinth", note: "Eighteen months of teaching." },
            { place: "ephesus", label: "Ephesus", note: "Over two years in Asia." },
            { place: "caesarea", label: "Caesarea", note: "Two years imprisoned." },
            { place: "rome", label: "Rome", note: "Preaching under guard." },
          ],
        },
      },
      {
        type: "timeline",
        heading: "Timeline",
        items: [
          { label: "Stephen's death", when: "Acts 7:58", detail: "Saul guards the coats of the witnesses." },
          { label: "Damascus road", when: "Acts 9", detail: "\"Saul, Saul, why do you persecute me?\"", accent: true },
          { label: "First journey", when: "Acts 13–14", detail: "Cyprus and southern Asia Minor." },
          { label: "Council", when: "Acts 15", detail: "Gentile believers welcomed without circumcision." },
          { label: "Second journey", when: "Acts 16–18", detail: "Philippi, Thessalonica, Athens, Corinth." },
          { label: "Third journey", when: "Acts 19–21", detail: "Ephesus at the centre." },
          { label: "Rome", when: "Acts 28", detail: "Teaching openly, unhindered.", accent: true },
        ],
      },
      {
        type: "refs",
        heading: "Letters connected to the journeys",
        items: [
          { ref: "Romans 1:7", note: "Written ahead of his visit to Rome, likely from Corinth." },
          { ref: "1 Corinthians 1:2", note: "To the church founded in Acts 18." },
          { ref: "Philippians 1:1", note: "To the church founded in Acts 16." },
          { ref: "Ephesians 1:1", note: "To the province where he spent three years." },
        ],
      },
    ],
  },
  {
    id: "antioch",
    title: "Antioch",
    kind: "place",
    subtitle: "Where believers were first called Christians",
    matches: ["Antioch"],
    blocks: [
      { type: "map", heading: "The sending city", focus: ["antioch", "tarsus", "jerusalem", "cyprus"] },
      {
        type: "facts",
        heading: "Arrival and departure",
        items: [
          { label: "Founded by", value: "Believers scattered after Stephen's death (Acts 11:19)" },
          { label: "Named here", value: "\"The disciples were first called Christians\" (Acts 11:26)" },
          { label: "Sent from here", value: "Barnabas and Saul, on all three journeys" },
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Acts 11:26", note: "A year of teaching with Barnabas and Saul." },
          { ref: "Acts 13:2", note: "\"Set apart for me Barnabas and Saul.\"" },
          { ref: "Galatians 2:11", note: "Paul confronts Peter at Antioch." },
        ],
      },
    ],
  },
  {
    id: "ephesus",
    title: "Ephesus",
    kind: "place",
    subtitle: "Great port city of Asia, home of the temple of Artemis",
    matches: ["Ephesus", "Ephesian", "Ephesians"],
    blocks: [
      { type: "map", heading: "On the Aegean coast", focus: ["ephesus", "corinth", "athens", "antioch"] },
      {
        type: "facts",
        heading: "Paul in Ephesus",
        items: [
          { label: "Stay", value: "Over two years — his longest recorded ministry in one city" },
          { label: "Events", value: "Daily teaching in the hall of Tyrannus; the riot of the silversmiths" },
          { label: "Miracles", value: "Extraordinary healings (Acts 19:11)" },
          { label: "Letter", value: "Ephesians; also 1 and 2 Timothy address this church" },
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Acts 19:10", note: "All Asia heard the word." },
          { ref: "Acts 20:17", note: "Paul's farewell to the Ephesian elders." },
          { ref: "Revelation 2:1", note: "The first of the seven letters." },
        ],
      },
    ],
  },
  {
    id: "philippi",
    title: "Philippi",
    kind: "place",
    subtitle: "The first church in Europe",
    matches: ["Philippi", "Philippians"],
    blocks: [
      { type: "map", heading: "Into Macedonia", focus: ["philippi", "thessalonica", "athens", "corinth"] },
      {
        type: "facts",
        heading: "Paul in Philippi",
        items: [
          { label: "Arrival", value: "After the vision of a man of Macedonia (Acts 16:9)" },
          { label: "First convert", value: "Lydia, a dealer in purple cloth" },
          { label: "Events", value: "A slave girl freed; imprisonment; an earthquake at midnight" },
          { label: "Letter", value: "Philippians, written later from prison" },
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Acts 16:31", note: "\"Believe in the Lord Jesus, and you will be saved.\"" },
          { ref: "Philippians 1:5", note: "Partnership in the gospel from the first day." },
        ],
      },
    ],
  },
  {
    id: "corinth",
    title: "Corinth",
    kind: "place",
    subtitle: "A wealthy, restless port on the isthmus",
    matches: ["Corinth", "Corinthians"],
    blocks: [
      { type: "map", heading: "Between two seas", focus: ["corinth", "athens", "ephesus", "philippi"] },
      {
        type: "facts",
        heading: "Paul in Corinth",
        items: [
          { label: "Stay", value: "A year and six months (Acts 18:11)" },
          { label: "Worked with", value: "Aquila and Priscilla, making tents" },
          { label: "Letters", value: "1 and 2 Corinthians; Romans likely written from here" },
        ],
      },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Acts 18:9", note: "\"Don't be afraid, but speak.\"" },
          { ref: "1 Corinthians 2:2", note: "\"Jesus Christ, and him crucified.\"" },
        ],
      },
    ],
  },
  {
    id: "rome",
    title: "Rome",
    kind: "place",
    subtitle: "The end of Acts, and the beginning of something else",
    matches: ["Rome", "Roman", "Romans"],
    blocks: [
      { type: "map", heading: "To the ends of the earth", focus: ["rome", "corinth", "ephesus", "jerusalem"] },
      {
        type: "refs",
        heading: "Related passages",
        items: [
          { ref: "Acts 23:11", note: "\"You must testify also at Rome.\"" },
          { ref: "Acts 28:31", note: "Preaching openly and unhindered — the last words of Acts." },
        ],
      },
    ],
  },
];

ATLAS_ENTRIES.push(...ARTIFACT_ENTRIES);

export const ENTRY_BY_ID: Record<string, AtlasEntry> = Object.fromEntries(
  ATLAS_ENTRIES.map((e) => [e.id, e]),
);
