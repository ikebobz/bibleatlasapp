/**
 * Hand-written context for the people and places that carry the biblical
 * story. Anything listed here is treated as publishable: it gets indexed and
 * appears in the sitemap. Names outside this file still render a page (the
 * reader links to them) but are marked `noindex, follow`, so a thin page never
 * competes with a real one.
 */

/** A passage worth reading first, linked straight into the reader. */
export type KeyPassage = { reference: string; book: string; chapter: number; note?: string };

export type CuratedPerson = {
  /** Two or three sentences of genuine context. Never boilerplate. */
  summary: string;
  /** Where the person sits in the storyline, e.g. "Patriarchs, c. 2000 BC". */
  era?: string;
  /** What they are chiefly known as. */
  role?: string;
  /** Other names Scripture uses for the same person. */
  also?: string[];
  /** Concordance query when the display name is not a single searchable word. */
  search?: string;
  /** A handful of passages that carry the story. */
  passages?: KeyPassage[];
  /** Slugs of other people in `PEOPLE_COPY` worth reading next. */
  people?: string[];
  /** Slugs of places in `PLACES_COPY` bound up with this person. */
  places?: string[];
  /** Map place id, so a person can open the canonical interactive map. */
  mapPlace?: string;
  /** What Scripture states, what tradition adds, and what remains debated. */
  certainty?: string;
  /** Shown when the verse list is broader than the person, e.g. every Pharaoh. */
  versesNote?: string;
};


export type CuratedPlace = {
  summary: string;
  /** Region or territory the site belongs to. */
  region?: string;
  /** Where it stands today. */
  modern?: string;
  /** What excavation and survey have actually turned up. */
  archaeology?: string;
  also?: string[];
  search?: string;
};

export const PEOPLE_COPY: Record<string, CuratedPerson> = {
  adam: {
    era: "Primeval history",
    role: "The first man",
    summary:
      "Adam is the first human being in the biblical account, formed from the ground and placed in Eden to work and keep it. His disobedience introduces death and exile into the story, and Paul later reads him as the head of the old humanity that Christ reverses.",
  },
  eve: {
    era: "Primeval history",
    role: "The first woman",
    summary:
      "Eve is made as a companion answering to Adam and is named 'mother of all living' after the fall. Her conversation with the serpent and the promise about her offspring set up the long conflict that runs through the rest of Scripture.",
  },
  cain: {
    era: "Primeval history",
    role: "First-born of Adam and Eve",
    summary:
      "Cain is a farmer whose offering is not accepted, and whose jealousy ends in the first murder. Sent east as a restless wanderer, he builds the first city named in Scripture, so human culture and human violence begin in the same chapter.",
  },
  abel: {
    era: "Primeval history",
    role: "Shepherd, first victim",
    summary:
      "Abel brings the firstborn of his flock and is commended for it. His death at his brother's hand makes him the Bible's first martyr, and Hebrews holds him up as an early example of faith whose blood 'still speaks'.",
  },
  noah: {
    era: "Primeval history",
    role: "Builder of the ark",
    summary:
      "Noah is the one righteous man of his generation, told to build a vessel that carries his household and the animals through the flood. The covenant God makes with him afterwards — never again to destroy the earth by water — is the first covenant in Scripture with all creation as its partner.",
  },
  abraham: {
    era: "Patriarchs, c. 2000 BC",
    role: "Father of the covenant people",
    summary:
      "Abraham leaves Ur and Haran for a land he has never seen, on nothing more than a promise of land, offspring and blessing for all nations. His long wait for Isaac, the covenant of circumcision, and the near-sacrifice on Moriah make him the model of faith for Jews, Christians and Muslims alike.",
    also: ["Abram"],
  },
  sarah: {
    era: "Patriarchs, c. 2000 BC",
    role: "Wife of Abraham, mother of Isaac",
    summary:
      "Sarah waits decades for the child she was promised, laughs at the announcement, and gives birth to Isaac in old age. Her insistence that Hagar and Ishmael be sent away shapes the family conflict that follows the covenant line.",
    also: ["Sarai"],
  },
  hagar: {
    era: "Patriarchs, c. 2000 BC",
    role: "Mother of Ishmael",
    summary:
      "Hagar is Sarah's Egyptian servant, given to Abraham and then driven into the wilderness. She is the first person in Scripture to give God a name — 'the God who sees me' — and is promised that her son too will become a great nation.",
  },
  isaac: {
    era: "Patriarchs, c. 1900 BC",
    role: "Son of promise",
    summary:
      "Isaac is the child born to Abraham and Sarah long past hope, and the son carried up Moriah. His own life is quieter than his father's or his son's: he redigs Abraham's wells, prospers in Gerar, and passes the covenant blessing on to Jacob.",
  },
  rebekah: {
    era: "Patriarchs, c. 1900 BC",
    role: "Wife of Isaac",
    summary:
      "Rebekah is found at a well in Haran and chooses to leave for a marriage she has never seen. Told before their birth that the elder of her twins would serve the younger, she engineers the blessing that sends Jacob into exile and Esau into fury.",
  },
  jacob: {
    era: "Patriarchs, c. 1850 BC",
    role: "Father of the twelve tribes",
    summary:
      "Jacob takes his brother's blessing by deception, meets God on a stairway at Bethel, works fourteen years for Rachel, and wrestles through the night at the Jabbok until he is renamed Israel. His twelve sons become the tribes that carry the nation's name.",
    also: ["Israel"],
  },
  esau: {
    era: "Patriarchs, c. 1850 BC",
    role: "Jacob's twin, ancestor of Edom",
    summary:
      "Esau sells his birthright for a bowl of stew and loses his father's blessing to Jacob. Their reunion twenty years later is one of the most generous scenes in Genesis, though his descendants in Edom remain Israel's long-running rivals.",
  },
  joseph: {
    era: "Patriarchs, c. 1800 BC",
    role: "Vizier of Egypt",
    summary:
      "Joseph is sold into Egypt by his brothers, imprisoned on a false charge, and raised to govern the country after interpreting Pharaoh's dreams. His verdict on the whole affair — 'you meant evil against me, but God meant it for good' — is one of Scripture's clearest statements about providence.",
  },
  judah: {
    era: "Patriarchs, c. 1800 BC",
    role: "Fourth son of Jacob",
    summary:
      "Judah proposes selling Joseph, is confronted by Tamar over his own failure, and later offers himself in Benjamin's place. Jacob's blessing gives his tribe the sceptre, and both David and Jesus are reckoned in his line.",
  },
  moses: {
    era: "Exodus, c. 1400–1200 BC",
    role: "Prophet and lawgiver",
    summary:
      "Rescued from the Nile and raised in Pharaoh's household, Moses flees to Midian and is called back at the burning bush to lead Israel out of Egypt. He receives the law at Sinai, intercedes for a people who repeatedly turn away, and dies in sight of a land he never enters.",
  },
  aaron: {
    era: "Exodus, c. 1400–1200 BC",
    role: "First high priest",
    summary:
      "Aaron speaks for Moses before Pharaoh and becomes Israel's first high priest, with the priesthood passing to his sons. He also makes the golden calf, so the office of priest begins with a man who has already needed atonement himself.",
  },
  miriam: {
    era: "Exodus, c. 1400–1200 BC",
    role: "Prophetess, sister of Moses",
    summary:
      "Miriam watches over the basket in the reeds and later leads Israel's women in song after the sea crossing. Her challenge to Moses' authority at Hazeroth and the leprosy that follows show even leadership close to Moses under judgement.",
  },
  joshua: {
    era: "Conquest, c. 1400–1200 BC",
    role: "Successor to Moses",
    summary:
      "Joshua is one of only two spies who urge Israel to go up into Canaan, and he leads the nation across the Jordan a generation later. The book bearing his name records the fall of Jericho, the division of the land, and his closing charge at Shechem to choose whom to serve.",
  },
  caleb: {
    era: "Conquest, c. 1400–1200 BC",
    role: "Faithful spy",
    summary:
      "Caleb brings back a minority report from Canaan and is promised the land he walked on. Forty-five years later, at eighty-five, he asks for the hill country of Hebron and takes it.",
  },
  rahab: {
    era: "Conquest, c. 1400–1200 BC",
    role: "Innkeeper of Jericho",
    summary:
      "Rahab hides Israel's spies in Jericho and hangs a scarlet cord from her window. A Canaanite outsider, she is spared with her household and appears in Matthew's genealogy of Jesus and in Hebrews' roll of faith.",
  },
  deborah: {
    era: "Judges, c. 1200–1050 BC",
    role: "Judge and prophetess",
    summary:
      "Deborah judges Israel from beneath a palm in the hill country and summons Barak to face Sisera's chariots. The victory song in Judges 5 is among the oldest poetry in the Bible.",
  },
  gideon: {
    era: "Judges, c. 1200–1050 BC",
    role: "Judge",
    summary:
      "Gideon is threshing wheat in a winepress when he is called a mighty man of valour. He tears down his father's altar, tests God with a fleece, and routs Midian with three hundred men — then makes an ephod that Israel treats as an idol.",
  },
  samson: {
    era: "Judges, c. 1100 BC",
    role: "Nazirite judge",
    summary:
      "Samson's strength is tied to a Nazirite vow he treats carelessly. Betrayed by Delilah, blinded and set to grind at Gaza, he brings down the temple of Dagon in a final act that kills more Philistines than his whole life had.",
  },
  ruth: {
    era: "Judges, c. 1100 BC",
    role: "Moabite ancestor of David",
    summary:
      "Ruth refuses to leave Naomi and gleans in the fields of Boaz, who redeems the family land and marries her. A foreigner from Moab, she becomes the great-grandmother of David.",
  },
  naomi: {
    era: "Judges, c. 1100 BC",
    role: "Mother-in-law of Ruth",
    summary:
      "Naomi loses her husband and both sons in Moab and returns to Bethlehem asking to be called Mara, 'bitter'. The book ends with a grandson in her lap and the neighbours declaring her restored.",
  },
  boaz: {
    era: "Judges, c. 1100 BC",
    role: "Kinsman-redeemer",
    summary:
      "Boaz protects Ruth in his fields and settles the redemption of Elimelech's land at the town gate. His role as kinsman-redeemer becomes a standing picture of redemption in later Christian reading.",
  },
  samuel: {
    era: "United monarchy, c. 1050 BC",
    role: "Last judge, first of the prophets",
    summary:
      "Given to the sanctuary at Shiloh as a boy, Samuel hears God speak when 'the word of the Lord was rare'. He anoints both Saul and David and warns Israel what a king will cost them.",
  },
  hannah: {
    era: "United monarchy, c. 1075 BC",
    role: "Mother of Samuel",
    summary:
      "Hannah prays at Shiloh so intently that Eli takes her for drunk, then gives the son she is granted back to the sanctuary. Her song of reversal is echoed centuries later in Mary's Magnificat.",
  },
  saul: {
    era: "United monarchy, c. 1050–1010 BC",
    role: "Israel's first king",
    summary:
      "Saul is anointed as the king Israel demanded and begins well, but his impatience at Gilgal and disobedience over Amalek cost him the dynasty. His decline into jealousy of David and the night visit to the medium at Endor end at Gilboa.",
  },
  david: {
    era: "United monarchy, c. 1010–970 BC",
    role: "Shepherd, poet, king",
    summary:
      "David is anointed as a shepherd boy, kills Goliath, spends years as a fugitive from Saul, and unites the tribes with his capital at Jerusalem. The covenant promising him an everlasting throne, and the psalms attributed to him, make his name the one the New Testament reaches for when it calls Jesus 'son of David'.",
  },
  jonathan: {
    era: "United monarchy, c. 1010 BC",
    role: "Son of Saul",
    summary:
      "Jonathan attacks a Philistine garrison with only his armour-bearer and later shields David from his own father, knowing it costs him the throne. He dies with Saul at Gilboa, and David's lament for him is one of the Bible's great elegies.",
  },
  goliath: {
    era: "United monarchy, c. 1020 BC",
    role: "Philistine champion",
    summary:
      "Goliath of Gath taunts Israel's army for forty days before being killed by a shepherd with a sling. The encounter in the Valley of Elah became the Bible's standard image of an impossible fight won by faith.",
  },
  bathsheba: {
    era: "United monarchy, c. 990 BC",
    role: "Wife of David, mother of Solomon",
    summary:
      "Bathsheba is taken by David while her husband Uriah is at the front, and Uriah is killed to hide it. She later secures the succession for Solomon and is named, obliquely, in Matthew's genealogy.",
  },
  nathan: {
    era: "United monarchy, c. 990 BC",
    role: "Court prophet",
    summary:
      "Nathan brings David the promise of an enduring house, and later the parable of the ewe lamb that traps the king into condemning himself. He also acts decisively to have Solomon crowned.",
  },
  absalom: {
    era: "United monarchy, c. 980 BC",
    role: "Son of David",
    summary:
      "Absalom kills his half-brother Amnon, wins the hearts of Israel at the gate, and drives his father from Jerusalem. He dies caught in an oak against Joab's orders, and David's cry over him is one of Scripture's rawest lines of grief.",
  },
  solomon: {
    era: "United monarchy, c. 970–930 BC",
    role: "King and temple builder",
    summary:
      "Solomon asks for wisdom rather than long life or wealth and receives all three. He builds the first temple in Jerusalem and presides over Israel's widest borders, but his foreign alliances and their shrines set up the split that follows his death.",
  },
  rehoboam: {
    era: "Divided kingdom, c. 930 BC",
    role: "King of Judah",
    summary:
      "Rehoboam answers the northern tribes' plea for lighter burdens with a threat, and ten tribes walk away. His reign begins the two-kingdom era that dominates the rest of Israel's history.",
  },
  jeroboam: {
    era: "Divided kingdom, c. 930 BC",
    role: "First king of the northern kingdom",
    summary:
      "Jeroboam leads the northern secession and sets up golden calves at Bethel and Dan so his people will not travel to Jerusalem. 'The sin of Jeroboam' becomes the standard charge against every later northern king.",
  },
  elijah: {
    era: "Divided kingdom, c. 870 BC",
    role: "Prophet",
    summary:
      "Elijah announces a drought to Ahab, is fed by ravens, defeats the prophets of Baal on Carmel, and then collapses under a broom tree asking to die. He hears God not in wind, earthquake or fire but in a low whisper, and leaves in a chariot of fire.",
  },
  elisha: {
    era: "Divided kingdom, c. 850 BC",
    role: "Prophet, successor to Elijah",
    summary:
      "Elisha asks for a double portion of Elijah's spirit and spends his ministry among ordinary people: a widow's oil, a Shunammite's son, a floating axe head, and Naaman washing in the Jordan.",
  },
  ahab: {
    era: "Divided kingdom, c. 874–853 BC",
    role: "King of Israel",
    summary:
      "Ahab marries Jezebel of Sidon and gives Baal worship royal backing. His seizure of Naboth's vineyard draws Elijah's sharpest judgement, and he dies from a stray arrow at Ramoth Gilead.",
  },
  jezebel: {
    era: "Divided kingdom, c. 870 BC",
    role: "Queen of Israel",
    summary:
      "Jezebel imports the prophets of Baal and Asherah, hunts down the prophets of the Lord, and arranges Naboth's judicial murder. Her name became a byword long before the letter to Thyatira used it that way.",
  },
  hezekiah: {
    era: "Divided kingdom, c. 715–686 BC",
    role: "King of Judah",
    summary:
      "Hezekiah removes the high places, cuts a tunnel to secure Jerusalem's water, and survives Sennacherib's siege after taking the Assyrian letter into the temple and spreading it before God. His fifteen added years and the display of his treasury to Babylon's envoys close his reign on a warning.",
  },
  josiah: {
    era: "Divided kingdom, c. 640–609 BC",
    role: "Reforming king of Judah",
    summary:
      "Josiah is eight when he becomes king, and the book of the law found during temple repairs triggers the deepest reform in Judah's history. He dies at Megiddo confronting Pharaoh Neco, and the reform does not outlive him.",
  },
  isaiah: {
    era: "Divided kingdom, c. 740–700 BC",
    role: "Prophet",
    summary:
      "Isaiah's call comes in a vision of the Lord high and lifted up in the temple. He counsels kings through the Assyrian crisis, and his book holds both the harshest judgement oracles and the servant songs the New Testament reads as pointing to Christ.",
  },
  jeremiah: {
    era: "Exile, c. 627–580 BC",
    role: "Prophet of the fall of Jerusalem",
    summary:
      "Jeremiah is called young and told he will be opposed by everyone, and he is: beaten, put in stocks, lowered into a cistern. He watches Jerusalem fall, buys a field as a sign that the land will be lived in again, and promises a new covenant written on the heart.",
  },
  ezekiel: {
    era: "Exile, c. 593–571 BC",
    role: "Priest-prophet in Babylon",
    summary:
      "Ezekiel prophesies among the exiles by the Chebar canal, using sign-acts and vast visions: the wheels and living creatures, the glory leaving the temple, the valley of dry bones, and a new temple with a river flowing from it.",
  },
  daniel: {
    era: "Exile, c. 605–535 BC",
    role: "Exile and statesman in Babylon",
    summary:
      "Taken to Babylon as a youth, Daniel serves under Babylonian and Persian kings while refusing to compromise. The court tales — the furnace, the writing on the wall, the lions' den — sit beside visions of successive empires and one 'like a son of man'.",
  },
  esther: {
    era: "Persian period, c. 480 BC",
    role: "Queen of Persia",
    summary:
      "Esther conceals her Jewish identity until Haman's decree threatens her people, then risks an uninvited approach to the king. The book never names God, but its turn of events founds the feast of Purim.",
  },
  nehemiah: {
    era: "Persian period, c. 445 BC",
    role: "Governor, rebuilder of Jerusalem's wall",
    summary:
      "Cupbearer to Artaxerxes, Nehemiah returns to a city with broken walls and rebuilds them in fifty-two days against constant obstruction. He then tackles debt-slavery, sabbath trading and mixed loyalties among the returned community.",
  },
  ezra: {
    era: "Persian period, c. 458 BC",
    role: "Priest and scribe",
    summary:
      "Ezra returns from Babylon with a commission to teach the law, and reads it aloud from a wooden platform while Levites explain it to the crowd. His reform work centres on Scripture being understood, not merely recited.",
  },
  jonah: {
    era: "Divided kingdom, c. 780 BC",
    role: "Reluctant prophet",
    summary:
      "Jonah is sent to Nineveh and sails the opposite way. Swallowed by a great fish and delivered, he preaches, the city repents, and he sulks under a withered plant — the book's real subject is the prophet's anger at mercy, not the fish.",
  },
  job: {
    era: "Patriarchal setting",
    role: "The suffering righteous man",
    summary:
      "Job loses his children, wealth and health, and refuses both his friends' tidy explanations and his wife's advice to curse God. The answer he finally receives from the whirlwind is not an argument but a tour of creation.",
  },
  jesus: {
    era: "First century AD",
    role: "The Christ",
    summary:
      "Jesus of Nazareth is the centre of the New Testament: born in Bethlehem, raised in Galilee, teaching in parables, healing, crucified under Pontius Pilate and, the Gospels insist, raised on the third day. Every earlier thread in Bible Atlas — covenant, exodus, temple, kingship, prophecy — is read by the New Testament as arriving at him.",
    also: ["Christ", "Messiah", "Immanuel"],
  },
  mary: {
    era: "First century AD",
    role: "Mother of Jesus",
    summary:
      "Mary receives Gabriel's announcement with a question and then a consent, and answers with the Magnificat's song of reversal. She appears at Cana, at the cross, and among the disciples praying before Pentecost.",
  },
  "john-the-baptist": {
    era: "First century AD",
    role: "Forerunner",
    summary:
      "John preaches repentance in the Judean wilderness and baptises in the Jordan, including Jesus himself. Imprisoned by Herod Antipas for confronting his marriage, he sends from his cell the honest question 'are you the one who is to come?'",
    search: "Baptist",
  },
  peter: {
    era: "First century AD",
    role: "Apostle",
    summary:
      "A Galilean fisherman renamed Cephas, Peter walks on water and sinks, confesses Jesus as the Christ and is rebuked minutes later, denies him three times and is restored on the shore. At Pentecost he preaches the sermon that starts the church, and at Caesarea he is the one sent to a Gentile household.",
    also: ["Simon Peter", "Cephas"],
  },
  paul: {
    era: "First century AD",
    role: "Apostle to the Gentiles",
    summary:
      "Trained under Gamaliel and a persecutor of the church, Paul is stopped on the road to Damascus and spends the rest of his life planting congregations across Asia Minor and Greece. Thirteen New Testament letters carry his name, and Acts ends with him under house arrest in Rome, still teaching.",
    also: ["Saul of Tarsus"],
  },
  john: {
    era: "First century AD",
    role: "Apostle",
    summary:
      "John and his brother James are called from their nets and nicknamed 'sons of thunder'. Christian tradition connects him with the fourth Gospel, three letters on love and truth, and the visions of Revelation received on Patmos.",
  },
  "mary-magdalene": {
    era: "First century AD",
    role: "Disciple, first witness of the resurrection",
    summary:
      "Delivered of seven demons, Mary Magdalene follows Jesus from Galilee and stays at the cross when most have gone. She is the first person the risen Jesus speaks to, and the first sent to tell the others.",
    search: "Magdalene",
  },
  thomas: {
    era: "First century AD",
    role: "Apostle",
    summary:
      "Thomas offers to go and die with Jesus in Judea, asks the question that draws out 'I am the way', and refuses second-hand testimony about the resurrection. A week later he gives the Gospel's fullest confession: 'my Lord and my God'.",
  },
  stephen: {
    era: "First century AD",
    role: "First Christian martyr",
    summary:
      "Chosen to serve the neglected widows, Stephen argues Israel's whole history before the council and is stoned for it. Saul of Tarsus stands guarding the coats.",
  },
  barnabas: {
    era: "First century AD",
    role: "Apostle and encourager",
    summary:
      "Barnabas sells a field for the church, vouches for the newly converted Saul when no one else will, and fetches him from Tarsus to Antioch. Their split over John Mark sends two missions out instead of one.",
  },
  timothy: {
    era: "First century AD",
    role: "Paul's coworker",
    summary:
      "Timothy joins Paul at Lystra, the son of a Jewish mother and a Greek father, and becomes his most trusted delegate. Two letters address him as a young leader facing older opponents.",
  },
  lydia: {
    era: "First century AD",
    role: "Merchant of Philippi",
    summary:
      "A dealer in purple cloth from Thyatira, Lydia hears Paul at a riverside prayer meeting and is baptised with her household. Her home becomes the first church in Europe.",
  },
  priscilla: {
    era: "First century AD",
    role: "Teacher and tentmaker",
    summary:
      "Priscilla and her husband Aquila work alongside Paul in Corinth and Ephesus and host a church in their house. Together they take the eloquent Apollos aside and explain the way of God more accurately.",
  },
  cornelius: {
    era: "First century AD",
    role: "Roman centurion",
    summary:
      "A God-fearing officer at Caesarea, Cornelius sends for Peter after a vision. The Spirit falling on his Gentile household settles, in practice, the question the Jerusalem council later settles in principle.",
  },
  "pontius-pilate": {
    era: "First century AD",
    role: "Roman prefect of Judea",
    summary:
      "Pilate finds no fault in Jesus, tries repeatedly to release him, and hands him over anyway. His question 'what is truth?' and the washing of his hands have outlived every other act of his governorship.",
    search: "Pilate",
  },
  herod: {
    era: "First century BC–AD",
    role: "Ruling dynasty of Judea",
    summary:
      "The Herods run through the New Testament: Herod the Great orders the killing at Bethlehem, Antipas beheads John and questions Jesus, Agrippa I executes James, and Agrippa II hears Paul's defence.",
  },

  // ---- Pharaoh: a title, not a single man -------------------------------
  pharaoh: {
    era: "Genesis to Jeremiah",
    role: "Title of the kings of Egypt",
    summary:
      "\"Pharaoh\" is a title rather than a personal name: it renders an Egyptian phrase meaning \"great house\", the palace standing for the king who lived in it. Scripture uses it for a whole sequence of rulers across roughly a thousand years — the king who takes Sarai, the king who raises Joseph, the king who enslaves Israel, and later kings named outright, such as Shishak and Neco. In Egypt the pharaoh was held to be divine, which is why the contest of the plagues reads as a contest between gods.",
    certainty:
      "Scripture names only a few Egyptian kings (Shishak, So, Tirhakah, Neco, Hophra). Where it simply says \"Pharaoh\", the individual is not identified, and any match to a king known from Egyptian records is a historical proposal rather than something the Bible states.",
    versesNote:
      "These verses cover every use of the title, so they span several different kings.",
    passages: [
      { reference: "Genesis 12:15", book: "genesis", chapter: 12, note: "Sarai taken into Pharaoh's house" },
      { reference: "Genesis 41:38", book: "genesis", chapter: 41, note: "Joseph set over Egypt" },
      { reference: "Exodus 5:2", book: "exodus", chapter: 5, note: "\"Who is the LORD, that I should obey his voice?\"" },
      { reference: "1 Kings 14:25", book: "1-kings", chapter: 14, note: "Shishak plunders Jerusalem" },
    ],
    people: ["pharaoh-of-joseph", "pharaoh-of-the-exodus", "shishak", "pharaoh-neco", "joseph", "moses"],
    places: ["egypt", "goshen", "red-sea"],
    mapPlace: "egypt",
  },
  "pharaoh-of-joseph": {
    era: "Patriarchs",
    role: "The king who raised Joseph",
    summary:
      "Troubled by two dreams no one can read, this Pharaoh brings a Hebrew prisoner out of the dungeon, hears him credit the interpretation to God, and hands him the administration of Egypt. He settles Jacob's family in Goshen and gives Joseph leave to bury his father in Canaan.",
    certainty:
      "Genesis never names him. Suggestions range from a Hyksos ruler to a king of the Twelfth Dynasty; the Bible offers no detail that settles it, and no Egyptian record of Joseph has been found.",
    versesNote: "The list shows every verse using the title \"Pharaoh\", not only this king.",
    search: "Pharaoh",
    passages: [
      { reference: "Genesis 41", book: "genesis", chapter: 41, note: "The dreams and Joseph's rise" },
      { reference: "Genesis 45", book: "genesis", chapter: 45, note: "Joseph's family invited to Egypt" },
      { reference: "Genesis 47", book: "genesis", chapter: 47, note: "Jacob blesses Pharaoh" },
    ],
    people: ["joseph", "jacob", "judah", "pharaoh"],
    places: ["egypt", "goshen", "hebron"],
    mapPlace: "egypt",
  },
  "pharaoh-of-the-exodus": {
    era: "The Exodus",
    role: "The king who opposed Moses",
    summary:
      "The Pharaoh of Exodus meets Moses' demand with contempt, doubles Israel's workload, and endures ten plagues aimed squarely at the gods of Egypt. The text says both that he hardened his own heart and that God hardened it. He releases Israel after the death of the firstborn, then pursues them to the sea.",
    certainty:
      "Exodus does not name him. Rameses II is the popular identification, and Thutmose III and Amenhotep II are also argued; each rests on a reconstruction of the date of the Exodus, not on anything the text says. Whether he died in the sea is not stated outright.",
    versesNote: "The list shows every verse using the title \"Pharaoh\", not only this king.",
    search: "Pharaoh",
    passages: [
      { reference: "Exodus 5", book: "exodus", chapter: 5, note: "\"Let my people go\"" },
      { reference: "Exodus 7", book: "exodus", chapter: 7, note: "The first plague" },
      { reference: "Exodus 12", book: "exodus", chapter: 12, note: "Passover and the release" },
      { reference: "Exodus 14", book: "exodus", chapter: 14, note: "The pursuit and the sea" },
    ],
    people: ["moses", "aaron", "miriam", "pharaoh"],
    places: ["egypt", "goshen", "red-sea", "mount-sinai"],
    mapPlace: "egypt",
  },
  shishak: {
    era: "Divided kingdom, c. 925 BC",
    role: "King of Egypt named in Scripture",
    summary:
      "Shishak shelters Jeroboam from Solomon, and five years into Rehoboam's reign marches on Jerusalem and strips the treasures of the temple and palace, including Solomon's gold shields. Rehoboam replaces them with bronze.",
    certainty:
      "Widely identified with Shoshenq I, whose campaign list at Karnak names towns in Israel and Judah. The identification is well supported but is a historical conclusion, not a biblical statement.",
    passages: [
      { reference: "1 Kings 14:25", book: "1-kings", chapter: 14, note: "Jerusalem plundered" },
      { reference: "2 Chronicles 12", book: "2-chronicles", chapter: 12, note: "The fuller account" },
    ],
    people: ["rehoboam", "jeroboam", "solomon", "pharaoh"],
    places: ["jerusalem", "egypt"],
    mapPlace: "egypt",
  },
  "pharaoh-neco": {
    era: "Late monarchy, c. 609 BC",
    role: "King of Egypt named in Scripture",
    summary:
      "Marching north to the Euphrates, Neco is intercepted by Josiah at Megiddo and kills him there. He then deposes Jehoahaz, sets Jehoiakim on the throne of Judah and taxes the land, until Babylon breaks Egyptian power at Carchemish.",
    certainty:
      "Identified with Necho II of the Twenty-sixth Dynasty; Babylonian chronicles record the campaigns the biblical account describes.",
    search: "Necho",
    also: ["Pharaohnechoh", "Necho"],
    passages: [
      { reference: "2 Kings 23:29", book: "2-kings", chapter: 23, note: "Josiah killed at Megiddo" },
      { reference: "2 Chronicles 35:20", book: "2-chronicles", chapter: 35, note: "Josiah warned and ignoring it" },
    ],
    people: ["josiah", "jeremiah", "pharaoh"],
    places: ["megiddo", "egypt", "jerusalem"],
    mapPlace: "egypt",
  },

  // ---- Patriarchal era ---------------------------------------------------
  lot: {
    era: "Patriarchs",
    role: "Abraham's nephew",
    summary:
      "Given first choice of land, Lot picks the well-watered plain and ends up inside Sodom. Angels drag him out the night the city falls; his wife looks back, and his daughters' desperate scheme produces Moab and Ammon, nations Israel meets again and again.",
    versesNote: "The King James text also uses \"lot\" for casting lots, so some verses below are unrelated.",
    passages: [
      { reference: "Genesis 13", book: "genesis", chapter: 13, note: "Lot chooses the plain" },
      { reference: "Genesis 19", book: "genesis", chapter: 19, note: "Sodom destroyed" },
    ],
    people: ["abraham", "sarah"],
    places: ["sodom", "dead-sea", "hebron"],
    mapPlace: "sodom",
  },
  ishmael: {
    era: "Patriarchs",
    role: "Abraham's firstborn son",
    summary:
      "Born to Hagar when the promise seemed slow in coming, Ishmael is circumcised in Abraham's household and then sent away with his mother. God's promise to make him a great nation is kept; he and Isaac bury their father together.",
    passages: [
      { reference: "Genesis 16", book: "genesis", chapter: 16, note: "Hagar and the angel" },
      { reference: "Genesis 21", book: "genesis", chapter: 21, note: "Sent away, and provided for" },
    ],
    people: ["abraham", "hagar", "isaac", "sarah"],
    places: ["beersheba", "egypt"],
  },
  leah: {
    era: "Patriarchs",
    role: "Jacob's first wife",
    summary:
      "Married to Jacob by her father's deception and never the wife he chose, Leah bears six of the twelve tribes, including Levi and Judah — the priestly line and the royal one. She is buried in the cave at Machpelah with Abraham, Sarah, Isaac and Rebekah.",
    people: ["jacob", "rachel", "judah", "rebekah"],
    places: ["haran", "hebron", "shechem"],
  },
  rachel: {
    era: "Patriarchs",
    role: "Jacob's beloved wife",
    summary:
      "Jacob works fourteen years for Rachel. She is long childless before Joseph is born, and dies giving birth to Benjamin on the road to Bethlehem. Jeremiah later hears her weeping for exiled children, a line Matthew takes up after the killing at Bethlehem.",
    passages: [
      { reference: "Genesis 29", book: "genesis", chapter: 29, note: "Jacob meets Rachel at the well" },
      { reference: "Genesis 35:19", book: "genesis", chapter: 35, note: "Her death near Bethlehem" },
    ],
    people: ["jacob", "leah", "joseph"],
    places: ["haran", "bethlehem"],
  },
  melchizedek: {
    era: "Patriarchs",
    role: "Priest-king of Salem",
    summary:
      "He appears in three verses, brings out bread and wine, blesses Abram and receives a tenth of the spoil — and then disappears. Psalm 110 and Hebrews make that abruptness the point: a priesthood with no recorded beginning or end, older than Levi.",
    also: ["Melchisedec"],
    passages: [
      { reference: "Genesis 14:18", book: "genesis", chapter: 14 },
      { reference: "Hebrews 7", book: "hebrews", chapter: 7, note: "The argument built on him" },
    ],
    people: ["abraham", "jesus"],
    places: ["jerusalem"],
  },
  jethro: {
    era: "The Exodus",
    role: "Priest of Midian, Moses' father-in-law",
    summary:
      "Moses spends forty years keeping Jethro's flocks before the burning bush. After the Exodus, Jethro brings Zipporah and the boys back to him, worships with Israel's elders, and tells Moses plainly that judging every dispute alone will wear him out — the first delegation of authority in Israel.",
    also: ["Reuel"],
    passages: [{ reference: "Exodus 18", book: "exodus", chapter: 18, note: "The advice about judges" }],
    people: ["moses", "aaron"],
    places: ["mount-sinai", "egypt"],
  },
  korah: {
    era: "Wilderness",
    role: "Levite who led a rebellion",
    summary:
      "Korah gathers 250 leaders against Moses and Aaron, arguing that the whole congregation is holy. The ground opens. His sons do not die with him, and the psalms of the sons of Korah are still sung.",
    passages: [{ reference: "Numbers 16", book: "numbers", chapter: 16 }],
    people: ["moses", "aaron"],
  },
  balaam: {
    era: "Wilderness",
    role: "Prophet hired to curse Israel",
    summary:
      "Balak pays Balaam to curse Israel; every attempt comes out as blessing, including a promise of a star out of Jacob. His donkey sees what he does not. Later Scripture treats him as a warning: he could not curse Israel, so he taught Balak how to corrupt them.",
    passages: [{ reference: "Numbers 22", book: "numbers", chapter: 22, note: "The donkey and the angel" }],
    people: ["moses"],
  },

  // ---- Judges and the early monarchy ------------------------------------
  barak: {
    era: "Judges",
    role: "Commander under Deborah",
    summary:
      "Barak will go to war only if Deborah goes with him, and is told the honour of the victory will go to a woman. Sisera's chariots bog down at the Kishon; Barak's name stands in Hebrews among those who conquered kingdoms by faith.",
    passages: [{ reference: "Judges 4", book: "judges", chapter: 4 }],
    people: ["deborah", "jael"],
    places: ["megiddo", "mount-carmel"],
  },
  jael: {
    era: "Judges",
    role: "The woman who killed Sisera",
    summary:
      "Sisera flees on foot to a tent he believes is friendly. Jael gives him milk, covers him, and drives a tent peg through his temple while he sleeps. Deborah's song calls her blessed among women.",
    passages: [{ reference: "Judges 4:17", book: "judges", chapter: 4 }],
    people: ["deborah", "barak"],
  },
  jephthah: {
    era: "Judges",
    role: "Judge of Gilead",
    summary:
      "Driven out as the son of a prostitute, Jephthah is called back when Ammon attacks. He wins, and is met at the door by his only daughter — the consequence of a vow the text records without approving.",
    passages: [{ reference: "Judges 11", book: "judges", chapter: 11 }],
    people: ["gideon", "samson"],
  },
  delilah: {
    era: "Judges",
    role: "The woman who betrayed Samson",
    summary:
      "Paid by the Philistine lords, Delilah asks Samson four times where his strength lies. He lies three times and tells the truth the fourth. The strength was never in the hair; it was in the vow the hair stood for.",
    passages: [{ reference: "Judges 16", book: "judges", chapter: 16 }],
    people: ["samson"],
    places: ["gaza"],
  },
  eli: {
    era: "Late judges",
    role: "High priest at Shiloh",
    summary:
      "Eli mistakes Hannah's silent prayer for drunkenness, then blesses her, and raises the son she gives back to God. He cannot restrain his own sons, and dies falling backwards when he hears the ark has been captured.",
    passages: [{ reference: "1 Samuel 3", book: "1-samuel", chapter: 3, note: "\"Speak, for thy servant heareth\"" }],
    people: ["samuel", "hannah"],
    places: ["shiloh"],
    mapPlace: "shiloh",
  },
  abner: {
    era: "United monarchy",
    role: "Commander of Saul's army",
    summary:
      "Saul's cousin and general, Abner keeps Ish-bosheth on the throne after Saul's death, then negotiates to bring Israel over to David. Joab murders him at the gate of Hebron in revenge, and David mourns him publicly.",
    people: ["saul", "david", "joab"],
    places: ["hebron"],
  },
  joab: {
    era: "United monarchy",
    role: "David's commander",
    summary:
      "Ruthless, effective and impossible to control, Joab takes Jerusalem, wins David's wars, arranges Uriah's death on orders, and kills Absalom against them. Solomon has him executed at the altar he clings to.",
    people: ["david", "absalom", "uriah", "solomon"],
    places: ["jerusalem"],
  },
  michal: {
    era: "United monarchy",
    role: "Saul's daughter, David's first wife",
    summary:
      "Michal loves David, lowers him through a window to save his life, and is given to another man while he is a fugitive. When she sees him dancing before the ark, something between them is finished.",
    people: ["david", "saul", "jonathan"],
    places: ["jerusalem"],
  },
  abigail: {
    era: "United monarchy",
    role: "Nabal's wife, then David's",
    summary:
      "With David riding to kill her household, Abigail loads provisions and meets him on the road, talking him out of bloodshed in one of the shrewdest speeches in Scripture. Nabal dies ten days later and David sends for her.",
    passages: [{ reference: "1 Samuel 25", book: "1-samuel", chapter: 25 }],
    people: ["david", "bathsheba"],
  },
  uriah: {
    era: "United monarchy",
    role: "Hittite soldier in David's army",
    summary:
      "Loyal enough to refuse the comfort of his own house while the ark and the army are in tents, Uriah carries the letter ordering his own death. Matthew's genealogy will not let the story go: Solomon is born \"of her that had been the wife of Urias\".",
    people: ["david", "bathsheba", "nathan", "joab"],
    places: ["jerusalem"],
  },

  // ---- Later kings and the exile ----------------------------------------
  athaliah: {
    era: "Divided kingdom, c. 841 BC",
    role: "Queen of Judah",
    summary:
      "Daughter of Ahab and Jezebel, Athaliah destroys the royal family of Judah and rules six years. One infant, Joash, is hidden in the temple by his aunt, and produced by the priest Jehoiada in a coup that costs Athaliah her life.",
    people: ["ahab", "jezebel", "jehu"],
    places: ["jerusalem"],
  },
  jehu: {
    era: "Divided kingdom, c. 841 BC",
    role: "King of Israel",
    summary:
      "Anointed by one of Elisha's men, Jehu drives to Jezreel \"furiously\", kills two kings and Jezebel, and wipes out Baal worship with a violence Hosea later names as guilt. The Black Obelisk of Shalmaneser III shows a king labelled Jehu bowing to Assyria.",
    people: ["elisha", "ahab", "jezebel", "athaliah"],
    places: ["samaria", "megiddo"],
  },
  naaman: {
    era: "Divided kingdom",
    role: "Syrian commander healed of leprosy",
    summary:
      "A captive Israelite girl sends her master to a prophet. Naaman, insulted by being told to wash seven times in the muddy Jordan, is talked into obedience by his servants and comes up clean. Jesus cites him in Nazareth, and the congregation tries to throw him off a cliff.",
    passages: [{ reference: "2 Kings 5", book: "2-kings", chapter: 5 }],
    people: ["elisha"],
    places: ["damascus", "jordan", "samaria"],
    mapPlace: "damascus",
  },
  hosea: {
    era: "Eighth century BC",
    role: "Prophet to the northern kingdom",
    summary:
      "Hosea is told to marry a wife who will be unfaithful, and to take her back when she is. The marriage is the message: Israel's idolatry read as adultery, and God's refusal to let go read as a husband buying back his own wife.",
    people: ["amos", "isaiah", "micah"],
    places: ["samaria"],
  },
  amos: {
    era: "Eighth century BC",
    role: "Shepherd-prophet of Tekoa",
    summary:
      "A herdsman from Judah sent north to a prosperous Israel, Amos indicts a religion of full festivals and crushed poor: \"let judgment run down as waters\". He is told to go home, and answers that he was no prophet by trade.",
    people: ["hosea", "isaiah"],
    places: ["bethel", "samaria"],
  },
  micah: {
    era: "Eighth century BC",
    role: "Prophet of Judah",
    summary:
      "Micah names Bethlehem as the place a ruler will come from, seven centuries early, and sums up religion in one line: do justly, love mercy, walk humbly with your God. Jeremiah's defenders cite him a century later as the prophet Hezekiah listened to.",
    people: ["isaiah", "hezekiah", "jeremiah"],
    places: ["bethlehem", "jerusalem", "lachish"],
  },
  zechariah: {
    era: "After the exile, c. 520 BC",
    role: "Prophet of the second temple",
    summary:
      "Zechariah urges the returned exiles to finish the temple through eight night visions, and looks beyond them: a king coming lowly on a donkey, thirty pieces of silver, one they pierced, a fountain opened for sin. The Gospels quote him repeatedly in Passion week.",
    people: ["haggai", "zerubbabel", "ezra"],
    places: ["jerusalem"],
  },
  haggai: {
    era: "After the exile, 520 BC",
    role: "Prophet of the rebuilding",
    summary:
      "In four dated messages across a single autumn, Haggai asks why the people live in panelled houses while the temple lies waste, and promises that the glory of this latter house will be greater than the former. Building resumes within a month.",
    people: ["zechariah", "zerubbabel"],
    places: ["jerusalem"],
  },
  malachi: {
    era: "After the exile",
    role: "The last Old Testament prophet",
    summary:
      "Malachi argues with a tired people in a series of questions and answers: blemished offerings, broken marriages, withheld tithes. He closes the Old Testament promising a messenger to prepare the way and Elijah before the day of the LORD.",
    people: ["john-the-baptist", "elijah", "ezra", "nehemiah"],
    places: ["jerusalem"],
  },
  zerubbabel: {
    era: "After the exile, c. 538–516 BC",
    role: "Governor who rebuilt the temple",
    summary:
      "A descendant of David leading the first return from Babylon, Zerubbabel lays the foundation of the second temple amid weeping from those who remember the first, and finishes it under prophetic pressure — \"not by might, nor by power, but by my spirit\".",
    people: ["haggai", "zechariah", "ezra", "cyrus"],
    places: ["jerusalem", "babylon"],
  },
  nebuchadnezzar: {
    era: "Babylonian empire, 605–562 BC",
    role: "King of Babylon",
    summary:
      "He takes Jerusalem three times, burns the temple, deports Judah, and dominates the book of Daniel: the dream of the statue, the furnace, and seven years living like an animal before he acknowledges that heaven rules. Babylonian records confirm the campaigns and the capture of the city.",
    people: ["daniel", "jeremiah", "ezekiel", "belshazzar"],
    places: ["babylon", "jerusalem"],
  },
  belshazzar: {
    era: "Babylonian empire, 539 BC",
    role: "Co-regent of Babylon",
    summary:
      "Drinking from the vessels taken from the temple, Belshazzar sees a hand writing on the plaster. Daniel reads it: numbered, weighed, divided. The city falls that night. Cuneiform texts name him as son of Nabonidus, ruling in his father's absence — which explains the offer of third place in the kingdom.",
    people: ["daniel", "nebuchadnezzar", "darius", "cyrus"],
    places: ["babylon"],
  },
  darius: {
    era: "Persian empire",
    role: "King over Babylon in Daniel",
    summary:
      "Tricked by his own officials into a decree he cannot revoke, Darius spends a sleepless night at the mouth of the lions' den. A later Darius orders the search of the archives that lets the temple be finished.",
    certainty:
      "Daniel's \"Darius the Mede\" is not securely matched to a ruler known from Persian records; several identifications are proposed. Darius I of Ezra 6 is well attested.",
    people: ["daniel", "cyrus", "zerubbabel"],
    places: ["babylon"],
  },
  cyrus: {
    era: "Persian empire, 539 BC",
    role: "King of Persia who ended the exile",
    summary:
      "Cyrus takes Babylon and issues the decree that sends Judah home with the temple vessels. Isaiah names him as God's shepherd and anointed; the Cyrus Cylinder records the same imperial policy of restoring deported peoples and their sanctuaries.",
    people: ["isaiah", "zerubbabel", "ezra", "daniel"],
    places: ["babylon", "jerusalem"],
  },
  mordecai: {
    era: "Persian empire",
    role: "Esther's cousin and guardian",
    summary:
      "Mordecai uncovers a plot against the king, refuses to bow to Haman, and tells Esther she may have come to the kingdom for such a time as this. He ends the book second only to the king.",
    people: ["esther", "haman"],
  },
  haman: {
    era: "Persian empire",
    role: "The enemy of the Jews",
    summary:
      "Enraged by one man who will not bow, Haman buys a decree to destroy every Jew in the empire and builds a gallows for Mordecai. He is hanged on it. Purim keeps the reversal in the calendar.",
    people: ["esther", "mordecai"],
  },

  // ---- Gospels -----------------------------------------------------------
  elizabeth: {
    era: "First century AD",
    role: "Mother of John the Baptist",
    summary:
      "Old, childless and of the priestly line, Elizabeth conceives after Gabriel's word to Zechariah. When Mary arrives, the child leaps in her womb and she is the first to call Mary the mother of her Lord.",
    search: "Elisabeth",
    also: ["Elisabeth"],
    people: ["john-the-baptist", "mary", "jesus"],
    places: ["jerusalem"],
  },
  andrew: {
    era: "First century AD",
    role: "Apostle, Peter's brother",
    summary:
      "A disciple of John the Baptist first, Andrew hears \"Behold the Lamb of God\" and immediately fetches his brother. He is the one who finds the boy with five loaves, and who brings the enquiring Greeks to Jesus.",
    people: ["peter", "philip", "jesus"],
    places: ["capernaum", "sea-of-galilee", "bethsaida"],
    mapPlace: "capernaum",
  },
  james: {
    era: "First century AD",
    role: "Apostle, son of Zebedee",
    summary:
      "One of the three taken up the mountain and into Gethsemane, James asks for fire on a Samaritan village and for a throne at Jesus' side. He is the first apostle martyred, killed with the sword by Herod Agrippa.",
    versesNote: "Several men named James appear in the New Testament, including the Lord's brother.",
    people: ["john", "peter", "jesus"],
    places: ["sea-of-galilee", "jerusalem"],
  },
  philip: {
    era: "First century AD",
    role: "Apostle from Bethsaida",
    summary:
      "Philip finds Nathanael and answers his scepticism with \"come and see\". Tested before the feeding of the five thousand, he does the arithmetic and gives up; at the last supper he asks to be shown the Father.",
    versesNote: "Philip the evangelist of Acts 8 is a different man.",
    people: ["andrew", "thomas", "jesus"],
    places: ["capernaum", "samaria"],
  },
  matthew: {
    era: "First century AD",
    role: "Tax collector and apostle",
    summary:
      "Called from the customs post at Capernaum, Matthew throws a feast for his colleagues that draws the first complaint about the company Jesus keeps. The Gospel bearing his name is the one most concerned with showing Scripture fulfilled.",
    also: ["Levi"],
    people: ["jesus", "peter", "zacchaeus"],
    places: ["capernaum", "sea-of-galilee"],
    mapPlace: "capernaum",
  },
  "judas-iscariot": {
    era: "First century AD",
    role: "The disciple who betrayed Jesus",
    summary:
      "Trusted with the money bag and stealing from it, Judas objects to the waste of ointment at Bethany and sells his information for thirty pieces of silver. He returns the money, and hangs himself. The field bought with it was still known by the story when Acts was written.",
    search: "Iscariot",
    people: ["jesus", "peter", "caiaphas"],
    places: ["jerusalem", "gethsemane", "bethany"],
  },
  martha: {
    era: "First century AD",
    role: "Sister of Mary and Lazarus",
    summary:
      "Martha runs the house at Bethany and says so. She is also the one who meets Jesus on the road when her brother is four days dead and makes the clearest confession in John's Gospel outside Peter's.",
    people: ["lazarus", "jesus", "mary"],
    places: ["bethany", "jerusalem"],
  },
  lazarus: {
    era: "First century AD",
    role: "Raised from the dead at Bethany",
    summary:
      "Jesus deliberately waits until Lazarus has been in the tomb four days, weeps at it anyway, and calls him out by name. The raising fills Bethany with witnesses and hardens the council's decision to kill Jesus — and Lazarus with him.",
    passages: [{ reference: "John 11", book: "john", chapter: 11 }],
    people: ["martha", "jesus", "caiaphas"],
    places: ["bethany", "jerusalem"],
    mapPlace: "bethany",
  },
  nicodemus: {
    era: "First century AD",
    role: "Pharisee and member of the council",
    summary:
      "He comes at night with a compliment and is told he must be born again. He later reminds the council that the law hears a man first, and finally brings a hundredweight of myrrh and aloes to a burial that ends his cover.",
    passages: [{ reference: "John 3", book: "john", chapter: 3 }],
    people: ["jesus", "joseph-of-arimathea"],
    places: ["jerusalem", "golgotha"],
  },
  zacchaeus: {
    era: "First century AD",
    role: "Chief tax collector of Jericho",
    summary:
      "Short, rich and widely despised, Zacchaeus climbs a sycamore to see over the crowd and is called down by name to host the visitor. Half his goods go to the poor and fourfold restitution to anyone he has cheated.",
    passages: [{ reference: "Luke 19", book: "luke", chapter: 19 }],
    people: ["jesus", "matthew"],
    places: ["jericho"],
    mapPlace: "jericho",
  },
  caiaphas: {
    era: "First century AD",
    role: "High priest at the trial of Jesus",
    summary:
      "Caiaphas reasons that it is expedient for one man to die for the people, and John reads the sentence as unintended prophecy. He presides at the night hearing and later warns Peter and John to stop speaking in the name.",
    people: ["pontius-pilate", "jesus", "peter"],
    places: ["jerusalem", "gethsemane"],
  },
  barabbas: {
    era: "First century AD",
    role: "The prisoner released instead of Jesus",
    summary:
      "A rebel held for insurrection and murder, Barabbas is the name the crowd shouts when Pilate offers the Passover release. The substitution is exact enough that the Gospels simply let it stand.",
    people: ["pontius-pilate", "jesus"],
    places: ["jerusalem"],
  },
  "joseph-of-arimathea": {
    era: "First century AD",
    role: "Councillor who buried Jesus",
    summary:
      "A rich member of the council who had not consented to its decision, Joseph goes in boldly to Pilate for the body and gives up his own new tomb. The Roman grant of the corpse is what makes the empty tomb a public fact three days later.",
    search: "Arimathaea",
    also: ["Arimathaea"],
    people: ["nicodemus", "jesus", "pontius-pilate"],
    places: ["jerusalem", "golgotha"],
    mapPlace: "golgotha",
  },

  // ---- Acts and the letters ---------------------------------------------
  gamaliel: {
    era: "First century AD",
    role: "Pharisee and teacher of the law",
    summary:
      "With the council ready to kill the apostles, Gamaliel advises restraint: if this work is of men it will collapse, and if it is of God they cannot overthrow it. Paul later names him as the teacher he was trained under.",
    people: ["peter", "paul", "stephen"],
    places: ["jerusalem"],
  },
  silas: {
    era: "First century AD",
    role: "Paul's companion on the second journey",
    summary:
      "Chosen after the split with Barnabas, Silas is beaten and jailed with Paul at Philippi and sings at midnight. As a Roman citizen he is owed the same apology Paul demands, and he carries the Jerusalem letter to the churches.",
    people: ["paul", "timothy", "barnabas", "lydia"],
    places: ["philippi", "thessalonica", "corinth", "antioch"],
    mapPlace: "philippi",
  },
  titus: {
    era: "First century AD",
    role: "Greek co-worker of Paul",
    summary:
      "An uncircumcised Gentile Paul deliberately does not circumcise, Titus becomes the test case at Jerusalem. He carries the hard letter to Corinth and returns with good news, and is left in Crete to appoint elders.",
    people: ["paul", "timothy"],
    places: ["corinth", "ephesus"],
  },
  luke: {
    era: "First century AD",
    role: "Physician, Gospel writer and travelling companion",
    summary:
      "\"The beloved physician\" writes a Gospel for Theophilus and then its sequel, and quietly joins the story in Acts when the narrative switches to \"we\". He is with Paul to the last letter, when everyone else has gone.",
    people: ["paul", "mark", "timothy"],
    places: ["philippi", "caesarea", "rome"],
  },
  mark: {
    era: "First century AD",
    role: "Gospel writer, once the one who turned back",
    summary:
      "Mark abandons the first journey at Perga and becomes the reason Paul and Barnabas part company. Years later Paul asks for him: profitable to me for the ministry. His Gospel moves at a run, and tradition ties it to Peter's preaching.",
    also: ["John Mark"],
    people: ["barnabas", "paul", "peter"],
    places: ["jerusalem", "antioch", "rome"],
  },
  apollos: {
    era: "First century AD",
    role: "Alexandrian teacher at Ephesus and Corinth",
    summary:
      "Eloquent and mighty in the Scriptures but knowing only John's baptism, Apollos is taken aside by Priscilla and Aquila and taught more accurately. At Corinth his followers form a faction he never asked for.",
    people: ["priscilla", "paul"],
    places: ["ephesus", "corinth"],
    mapPlace: "ephesus",
  },
  phoebe: {
    era: "First century AD",
    role: "Deacon of the church at Cenchrea",
    summary:
      "Paul commends her as a servant of the church and a helper of many, including himself. Romans is addressed from Corinth and she is the one going to Rome — in all likelihood the carrier of the letter itself.",
    search: "Phebe",
    also: ["Phebe"],
    people: ["paul", "priscilla"],
    places: ["corinth", "rome"],
  },
  felix: {
    era: "First century AD",
    role: "Roman governor of Judea",
    summary:
      "Felix keeps Paul in custody at Caesarea for two years, sends for him often hoping for a bribe, and trembles when the talk turns to righteousness and judgment to come — then sends him away for a convenient season that never arrives.",
    people: ["paul", "agrippa"],
    places: ["caesarea", "jerusalem"],
    mapPlace: "caesarea",
  },
  agrippa: {
    era: "First century AD",
    role: "Herod Agrippa II",
    summary:
      "Brought in by Festus to help frame a charge, Agrippa hears Paul's defence and answers, \"almost thou persuadest me to be a Christian\". His verdict — this man might have been freed if he had not appealed to Caesar — is what sends Paul to Rome.",
    people: ["paul", "felix", "herod"],
    places: ["caesarea", "rome"],
  },
};


export const PLACES_COPY: Record<string, CuratedPlace> = {
  jerusalem: {
    region: "Judea, central hill country",
    modern: "Jerusalem",
    summary:
      "Jerusalem enters the story as a Jebusite stronghold David captures and makes his capital, and it never leaves it. Temple, monarchy, siege, exile, return, and the death and resurrection of Jesus all happen here, and Revelation closes with a new Jerusalem coming down.",
    archaeology:
      "The Broad Wall from Hezekiah's day, the Siloam tunnel and its inscription, the stepped stone structure in the City of David, and the Herodian street and ritual baths below the Temple Mount are all visible today. The Pilate inscription from Caesarea and the Caiaphas ossuary anchor the Gospel accounts to named officials.",
    also: ["Zion"],
  },
  bethlehem: {
    region: "Judea, about 8 km south of Jerusalem",
    modern: "Bethlehem, West Bank",
    summary:
      "Bethlehem is where Rachel is buried, where Ruth gleans and marries Boaz, and where David is anointed among the sheep. Micah names it as the origin of a ruler in Israel, and Matthew and Luke place the birth of Jesus there.",
    archaeology:
      "The Church of the Nativity preserves a fourth-century foundation over a cave venerated at least as early as the second century, one of the oldest continuously used church sites anywhere.",
  },
  nazareth: {
    region: "Lower Galilee",
    modern: "Nazareth, Israel",
    summary:
      "Nazareth is an obscure Galilean village — 'can anything good come out of Nazareth?' — where Jesus grows up and first reads Isaiah aloud in the synagogue, to a reception that turns violent.",
    archaeology:
      "Excavation shows a small agricultural settlement of perhaps a few hundred people in the first century, with rock-cut tombs, wine and olive presses and at least one first-century house preserved beneath later churches.",
  },
  capernaum: {
    region: "North shore of the Sea of Galilee",
    modern: "Kfar Nahum, Israel",
    summary:
      "Capernaum becomes Jesus' base in Galilee: the calling of fishermen and a tax collector, the healing of the centurion's servant and Peter's mother-in-law, and the bread of life discourse in its synagogue.",
    archaeology:
      "A fourth- or fifth-century white limestone synagogue stands on black basalt foundations of an earlier building, and an octagonal Byzantine church covers a first-century house venerated from an early date as Peter's.",
  },
  jericho: {
    region: "Jordan valley, north of the Dead Sea",
    modern: "Tell es-Sultan / Jericho, West Bank",
    summary:
      "Jericho is the first city Israel faces west of the Jordan, taken after seven days of circling. It reappears as the setting of the good Samaritan's road, Zacchaeus in his sycamore, and blind Bartimaeus by the roadside.",
    archaeology:
      "Tell es-Sultan is among the oldest continuously occupied sites known, with a Neolithic tower and wall thousands of years older than Israel. The dating of its Bronze Age destruction remains one of the most argued questions in biblical archaeology.",
  },
  hebron: {
    region: "Judean hill country",
    modern: "Hebron, West Bank",
    summary:
      "Hebron is where Abraham settles by the oaks of Mamre and buys the cave of Machpelah as a burial place. Centuries later it is David's first capital, where he reigns over Judah for seven years before taking Jerusalem.",
    archaeology:
      "The Haram el-Khalil enclosure over the traditional cave of Machpelah is Herodian masonry, closely comparable to the Temple Mount walls in Jerusalem.",
  },
  bethel: {
    region: "Ephraimite hill country",
    modern: "Beitin, West Bank",
    summary:
      "Bethel — 'house of God' — is where Jacob dreams of a stairway and sets up a stone pillar. After the kingdom splits, Jeroboam installs one of his golden calves there, and Amos later denounces it as a royal sanctuary.",
  },
  shechem: {
    region: "Between Mount Ebal and Mount Gerizim",
    modern: "Tell Balata, near Nablus",
    summary:
      "Shechem is Abraham's first stop in Canaan and the place where Joshua gathers Israel to renew the covenant. The northern tribes reject Rehoboam here, and Jacob's well nearby is where Jesus talks with a Samaritan woman.",
    archaeology:
      "Tell Balata preserves a massive Middle Bronze fortress temple and city gate, matching the scale of the 'house of Baal-berith' mentioned in Judges.",
  },
  shiloh: {
    region: "Ephraimite hill country",
    modern: "Khirbet Seilun, West Bank",
    summary:
      "Shiloh houses the tabernacle through the period of the judges, and is where Hannah prays and Samuel grows up. Its destruction becomes Jeremiah's warning to anyone who trusts the temple as a lucky charm.",
    archaeology:
      "Excavation has found a substantial Iron Age I settlement destroyed by fire in the mid-eleventh century BC, consistent with the biblical picture of Shiloh's end.",
  },
  samaria: {
    region: "Northern kingdom of Israel",
    modern: "Sebastia, West Bank",
    summary:
      "Samaria is the capital Omri builds and Ahab adorns, and the target of prophetic anger over ivory houses and injustice. After the Assyrian conquest, the mixed population of the region becomes the Samaritans of the Gospels.",
    archaeology:
      "The acropolis has yielded hundreds of carved ivory fragments and a group of administrative ostraca recording shipments of oil and wine — the 'houses of ivory' Amos names.",
  },
  "sea-of-galilee": {
    region: "Northern Israel",
    modern: "Lake Kinneret",
    summary:
      "A freshwater lake ringed by fishing towns, the Sea of Galilee is the setting for the calling of the first disciples, the calming of the storm, walking on water, and the breakfast on the shore after the resurrection.",
    archaeology:
      "A first-century fishing boat recovered from the lakebed near Ginosar in 1986 is the best physical evidence for the kind of craft the Gospels describe.",
    also: ["Sea of Chinnereth"],
    search: "Galilee",
  },
  jordan: {
    region: "Rift valley from Hermon to the Dead Sea",
    modern: "Jordan River",
    summary:
      "The Jordan is the boundary Israel crosses to enter the land, the river where Naaman washes and is healed, and where John baptises and Jesus is baptised.",
    search: "Jordan",
  },
  "mount-sinai": {
    region: "Sinai peninsula (location debated)",
    summary:
      "Sinai is where Moses meets God at the burning bush and where Israel receives the law amid smoke and trumpet blast. Elijah later travels back to the same mountain to hear the low whisper.",
    archaeology:
      "No inscription fixes the site. Jebel Musa in the southern Sinai carries the strongest tradition, preserved at Saint Catherine's monastery, while several northern and Arabian candidates continue to be argued.",
    also: ["Mount Horeb"],
    search: "Sinai",
  },
  egypt: {
    region: "Nile valley",
    modern: "Egypt",
    summary:
      "Egypt is refuge and prison by turns: grain in famine for Jacob's family, four centuries of slavery, the exodus, and later the country Joseph and Mary flee to with the child. Prophets keep warning Judah not to lean on it.",
    archaeology:
      "The Merneptah stele of about 1208 BC carries the earliest known mention of Israel outside the Bible, and Semitic settlement in the eastern Delta at Tell el-Dab'a matches the Goshen described in Genesis.",
  },
  babylon: {
    region: "Mesopotamia, on the Euphrates",
    modern: "near Hillah, Iraq",
    summary:
      "Babylon is the tower of Genesis, the empire that burns Jerusalem and deports Judah, and finally the New Testament's symbol for every proud city that sets itself against God.",
    archaeology:
      "The Ishtar Gate, Nebuchadnezzar's ration tablets naming King Jehoiachin of Judah among those receiving oil, and the Babylonian Chronicle's account of Jerusalem's capture in 597 BC all survive.",
  },
  nineveh: {
    region: "Assyria, on the Tigris",
    modern: "Mosul, Iraq",
    summary:
      "Nineveh is the great Assyrian capital Jonah is sent to and Nahum announces the fall of. Its repentance in Jonah is the book's scandal; its destruction in 612 BC is the prophets' vindication.",
    archaeology:
      "Sennacherib's palace at Kuyunjik produced the Lachish reliefs showing the siege of a Judean city, and the library of Ashurbanipal preserved tens of thousands of cuneiform tablets.",
  },
  ur: {
    region: "Southern Mesopotamia",
    modern: "Tell el-Muqayyar, Iraq",
    summary:
      "Ur of the Chaldeans is where Abraham's family begins, before Terah leads them north to Haran. Joshua's farewell speech reminds Israel that their ancestors served other gods beyond the river.",
    archaeology:
      "Woolley's excavations uncovered the great ziggurat and the royal cemetery with its lyres, jewellery and mass burials, showing a sophisticated city in the third millennium BC.",
  },
  haran: {
    region: "Upper Mesopotamia",
    modern: "Harran, Turkey",
    summary:
      "Haran is where Terah's family settles and Abraham receives his call to leave. Jacob returns there to work for Laban and marry Leah and Rachel.",
  },
  damascus: {
    region: "Aram / Syria",
    modern: "Damascus, Syria",
    summary:
      "Damascus is Aram's capital and a long-standing rival to Israel, the city Naaman comes from, and the destination Saul never reaches as a persecutor — stopped on its road and led in blind.",
  },
  antioch: {
    region: "Syria, on the Orontes",
    modern: "Antakya, Turkey",
    summary:
      "Antioch is where Greeks first hear the gospel in numbers, where believers are first called Christians, and the base from which Paul and Barnabas are sent out on every missionary journey.",
  },
  ephesus: {
    region: "Roman province of Asia",
    modern: "near Selçuk, Turkey",
    summary:
      "Paul spends over two years in Ephesus, until the silversmiths riot in the theatre over lost trade in shrines of Artemis. The city receives one of Paul's letters and the first of Revelation's seven.",
    archaeology:
      "The theatre where the riot took place seats around 25,000 and still stands, along with the Library of Celsus and the foundations of the temple of Artemis, one of the seven wonders.",
  },
  corinth: {
    region: "Achaia, Greece",
    modern: "Korinthos, Greece",
    summary:
      "A wealthy port city straddling two harbours, Corinth hosts Paul for eighteen months and receives his most practical letters — on divisions, lawsuits, meat, worship, spiritual gifts and resurrection.",
    archaeology:
      "The bema where Gallio dismissed the case against Paul survives in the forum, and the Gallio inscription from Delphi dates his proconsulship to AD 51–52, one of the firmest dates in New Testament chronology.",
  },
  athens: {
    region: "Achaia, Greece",
    modern: "Athens, Greece",
    summary:
      "Paul waits in Athens 'provoked' by its idols and ends up before the council on the Areopagus, quoting Greek poets back to philosophers and preaching the resurrection to a divided hearing.",
  },
  rome: {
    region: "Capital of the empire",
    modern: "Rome, Italy",
    summary:
      "Rome is the horizon of Acts: Paul writes his longest letter to the church there before he has ever visited, and finally arrives as a prisoner, teaching for two years under guard.",
  },
  philippi: {
    region: "Macedonia",
    modern: "near Kavala, Greece",
    summary:
      "A Roman colony where Paul's first European converts include Lydia and a jailer converted after an earthquake. The letter he later writes from prison to this church is his warmest.",
  },
  thessalonica: {
    region: "Macedonia",
    modern: "Thessaloniki, Greece",
    summary:
      "Paul preaches three sabbaths in the synagogue at Thessalonica before a mob drives him out. Two of his earliest letters answer this young church's questions about the return of Christ.",
  },
  caesarea: {
    region: "Mediterranean coast of Judea",
    modern: "Caesarea Maritima, Israel",
    summary:
      "Herod's harbour city is the Roman administrative capital of Judea: Cornelius' household is baptised here, Herod Agrippa dies here, and Paul is held here for two years before sailing for Rome.",
    archaeology:
      "The stone bearing Pontius Pilate's name and title was found reused in the theatre here in 1961 — the only inscription naming Pilate from his own lifetime. The submerged harbour works are a landmark of Roman engineering.",
  },
  joppa: {
    region: "Mediterranean coast",
    modern: "Jaffa, Tel Aviv",
    summary:
      "Joppa is the port Jonah sails from to avoid Nineveh, and the town where Peter raises Tabitha and then sees the sheet let down from heaven that sends him to a Gentile house.",
  },
  sodom: {
    region: "Plain of the Jordan / southern Dead Sea",
    summary:
      "Sodom is the city Lot settles in and Abraham bargains for, destroyed with Gomorrah in fire and sulphur. Later prophets name its sin as arrogance and neglect of the poor as much as anything else.",
    archaeology:
      "No site is certain. Bab edh-Dhra and Numeira southeast of the Dead Sea, both destroyed in the Early Bronze Age, are the most discussed candidates, with Tall el-Hammam argued more recently.",
  },
  "mount-carmel": {
    region: "Coastal ridge of northern Israel",
    modern: "Mount Carmel, Israel",
    summary:
      "Carmel is where Elijah confronts the prophets of Baal and calls down fire on a soaked altar, then climbs to the summit to wait for a cloud the size of a man's hand.",
    search: "Carmel",
  },
  "mount-of-olives": {
    region: "East of Jerusalem",
    modern: "Mount of Olives, Jerusalem",
    summary:
      "The ridge across the Kidron from the temple is where David flees weeping from Absalom, where Jesus teaches about the end, prays in Gethsemane, and from where Acts places the ascension.",
    search: "Olives",
  },
  golgotha: {
    region: "Outside the city wall of Jerusalem",
    summary:
      "Golgotha, 'the place of a skull', is where Jesus is crucified between two others. Its exact location is debated between the Church of the Holy Sepulchre and the Garden Tomb.",
    archaeology:
      "The Holy Sepulchre site lay outside the first-century city wall and contains rock-cut tombs of the right period, which is the strongest argument in its favour.",
    also: ["Calvary"],
  },
  bethany: {
    region: "Eastern slope of the Mount of Olives",
    modern: "al-Eizariya, West Bank",
    summary:
      "Bethany is the home of Martha, Mary and Lazarus, where Jesus stays during his last week, where Lazarus is raised, and where a woman anoints him for burial.",
  },
  gaza: {
    region: "Philistine coastal plain",
    modern: "Gaza",
    summary:
      "Gaza is one of the five Philistine cities, where Samson carries off the gates and dies bringing down the temple of Dagon. The road down from Jerusalem toward Gaza is where Philip meets the Ethiopian official.",
  },
  "dead-sea": {
    region: "Lowest point on earth",
    modern: "Dead Sea",
    summary:
      "The Salt Sea marks Judah's eastern border and the desolation left after Sodom. Ezekiel's closing vision has a river from the temple running down to it and making its waters fresh.",
    archaeology:
      "The caves at Qumran on its northwestern shore produced the Dead Sea Scrolls, including a complete Isaiah scroll a thousand years older than any previously known Hebrew manuscript.",
    also: ["Salt Sea"],
  },
  patmos: {
    region: "Aegean island",
    modern: "Patmos, Greece",
    summary:
      "John receives the visions of Revelation on Patmos, where he says he was 'on account of the word of God and the testimony of Jesus' — most read that as exile.",
  },
  megiddo: {
    region: "Jezreel valley",
    modern: "Tel Megiddo, Israel",
    summary:
      "Megiddo guards the pass on the main highway between Egypt and Mesopotamia, and armies fought over it for millennia. Josiah dies here, and its name lies behind Revelation's Armageddon.",
    archaeology:
      "Twenty-six occupation layers, a monumental six-chambered gate, and a water system cut through rock to a spring outside the walls make it one of the most excavated sites in Israel.",
  },
  lachish: {
    region: "Judean lowlands",
    modern: "Tel Lachish, Israel",
    summary:
      "Lachish is Judah's second city, besieged by Sennacherib and later by Nebuchadnezzar. Its fall is the warning Jerusalem is given twice.",
    archaeology:
      "Sennacherib's own palace reliefs at Nineveh depict the siege in detail, and a siege ramp, arrowheads and the Lachish letters — ostraca written as Babylon closed in — were found at the site.",
  },
  dan: {
    region: "Northern limit of Israel",
    modern: "Tel Dan, Israel",
    summary:
      "Dan marks the north in the phrase 'from Dan to Beersheba'. Jeroboam sets up his second golden calf here, at a sanctuary beside one of the Jordan's sources.",
    archaeology:
      "The Tel Dan stele, found in 1993, refers to the 'house of David' — the earliest known reference to David's dynasty outside the Bible.",
  },
  beersheba: {
    region: "Northern Negev",
    modern: "Tel Sheva / Be'er Sheva, Israel",
    summary:
      "Beersheba is where Abraham and Isaac dig wells and swear treaties, and the southern marker of the land. Elijah leaves his servant here before walking on into the wilderness.",
  },
  gilgal: {
    region: "Near Jericho, in the Jordan valley",
    summary:
      "Gilgal is Israel's first camp in the land, where twelve stones from the riverbed are set up and the manna stops. It becomes Saul's coronation site and later a target of prophetic criticism.",
  },
  tyre: {
    region: "Phoenician coast",
    modern: "Sour, Lebanon",
    summary:
      "Tyre supplies Solomon with cedar and craftsmen, and grows rich enough to draw long oracles from Isaiah and Ezekiel. Jesus travels to its region and meets a Syrophoenician woman there.",
  },
  goshen: {
    region: "Eastern Nile delta",
    summary:
      "Goshen is the pastureland Pharaoh grants Jacob's family, where Israel multiplies for four centuries and where the plagues pass over them.",
  },
  "red-sea": {
    region: "Between Egypt and Sinai",
    summary:
      "The sea Israel crosses on dry ground while the pursuing chariots are lost behind them. It becomes the standard reference point for God's rescue in psalms and prophets alike.",
    search: "Red sea",
  },
  gethsemane: {
    region: "Foot of the Mount of Olives",
    summary:
      "The olive grove where Jesus prays before his arrest, asking that the cup pass while accepting that it will not. Judas arrives with a crowd from the chief priests.",
  },
};
