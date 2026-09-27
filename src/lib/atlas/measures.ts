/**
 * Biblical economy: currency, weights and measures detected in the text and
 * converted into modern equivalents for the small inline overlay.
 *
 * Money is given two ways because both are honest and neither alone is:
 *  - metal value: what the silver or bronze in the coin is worth today
 *  - wage value: what the same purchasing power costs in labour today
 * Wage values assume a US day's unskilled labour at roughly $150.
 */

export type MeasureKind = "money" | "length" | "weight" | "volume";

export type Measure = {
  id: string;
  label: string;
  kind: MeasureKind;
  /** Phrases in the text that trigger the overlay. */
  matches: string[];
  /** Ancient definition in one line. */
  ancient: string;
  /** Modern metric / imperial equivalent. */
  modern: string;
  /** Headline modern value shown large — USD for money, metric for measures. */
  headline: string;
  /** Optional secondary figure. */
  secondary?: string;
  /** How the number was reached. */
  basis: string;
  note: string;
};

export const DAY_WAGE_USD = 150;

export const MEASURES: Measure[] = [
  {
    id: "denarius",
    label: "Denarius",
    kind: "money",
    matches: ["denarius", "denarii", "a day's wages", "a penny", "pennies"],
    ancient: "Roman silver coin, ~3.9 g — one day's pay for a field labourer",
    modern: "≈ 3.9 g of .900 silver, 19 mm across",
    headline: "≈ $150 USD",
    secondary: "Silver content today: ≈ $3.50",
    basis: "Matthew 20:2 sets a denarius as a full day in the vineyard; priced here at a US day's unskilled wage.",
    note: "The coin carried Tiberius' portrait — the one Jesus asked to see when questioned about tax.",
  },
  {
    id: "talent",
    label: "Talent",
    kind: "money",
    matches: ["talent", "talents"],
    ancient: "A weight, not a coin: ~34 kg of silver, or 6,000 denarii",
    modern: "≈ 34 kg / 75 lb of silver",
    headline: "≈ $900,000 USD",
    secondary: "Silver metal value today: ≈ $33,000",
    basis: "6,000 denarii × a day's wage. A talent of gold would be roughly 70× that again.",
    note: "The servant in Matthew 18 owed 10,000 talents — deliberately absurd, around 200,000 years of wages.",
  },
  {
    id: "shekel",
    label: "Shekel",
    kind: "money",
    matches: ["shekel", "shekels"],
    ancient: "Standard silver weight, ~11.4 g; the Tyrian coin weighed ~14 g",
    modern: "≈ 11.4 g of silver — about four days' wages",
    headline: "≈ $600 USD",
    secondary: "Silver content today: ≈ $11",
    basis: "Four denarii of purchasing power, priced at a US day's wage each.",
    note: "Thirty pieces of silver — the price of Jesus — was the legal compensation for a slave killed by an ox.",
  },
  {
    id: "mina",
    label: "Mina",
    kind: "money",
    matches: ["mina", "minas", "pound of silver"],
    ancient: "50 shekels, or 60 Greek drachmas — about three months' wages",
    modern: "≈ 570 g of silver",
    headline: "≈ $9,000 USD",
    secondary: "Silver content today: ≈ $550",
    basis: "60 denarii-equivalent days of labour.",
    note: "In Luke 19 each servant is entrusted with one mina — a serious but survivable sum.",
  },
  {
    id: "lepton",
    label: "Lepton (\"mite\")",
    kind: "money",
    matches: ["mite", "mites", "lepta", "lepton", "small copper coins"],
    ancient: "Smallest bronze coin in circulation — 1/128 of a denarius",
    modern: "≈ 2 g bronze, 15 mm across",
    headline: "≈ $1.20 USD",
    secondary: "Two lepta ≈ $2.40 — the widow's whole living",
    basis: "A denarius day-wage divided by 128.",
    note: "Jesus said her two coins outweighed every large gift dropped in that day.",
  },
  {
    id: "cubit",
    label: "Cubit",
    kind: "length",
    matches: ["cubit", "cubits"],
    ancient: "Elbow to fingertip — the common cubit; a royal cubit was longer",
    modern: "≈ 45 cm / 18 in (royal cubit ≈ 52 cm / 20.6 in)",
    headline: "≈ 45 cm / 18 in",
    secondary: "10 cubits ≈ 4.5 m · 100 cubits ≈ 45 m",
    basis: "Standard archaeological value for the Hebrew common cubit.",
    note: "Noah's ark at 300 cubits is roughly 135 m — longer than a football pitch.",
  },
  {
    id: "span",
    label: "Span",
    kind: "length",
    matches: ["span", "spans"],
    ancient: "Thumb tip to little finger, spread — half a cubit",
    modern: "≈ 22.5 cm / 9 in",
    headline: "≈ 22.5 cm / 9 in",
    basis: "Half of a 45 cm cubit.",
    note: "The high priest's breastpiece was a span square when folded double.",
  },
  {
    id: "handbreadth",
    label: "Handbreadth",
    kind: "length",
    matches: ["handbreadth", "handbreadths", "palm"],
    ancient: "Width of four fingers — one sixth of a cubit",
    modern: "≈ 7.5 cm / 3 in",
    headline: "≈ 7.5 cm / 3 in",
    basis: "One sixth of a 45 cm cubit.",
    note: "\"You have made my days as handbreadths\" — a life measured in finger widths.",
  },
  {
    id: "gerah",
    label: "Gerah",
    kind: "weight",
    matches: ["gerah", "gerahs"],
    ancient: "One twentieth of a shekel — the smallest weight unit",
    modern: "≈ 0.57 g",
    headline: "≈ 0.57 g",
    secondary: "≈ $30 USD of purchasing power",
    basis: "A shekel divided by twenty.",
    note: "Used for precise temple assessments where a fraction mattered.",
  },
  {
    id: "ephah",
    label: "Ephah",
    kind: "volume",
    matches: ["ephah", "ephahs"],
    ancient: "Dry measure of grain — ten omers",
    modern: "≈ 22 litres / 20 dry quarts",
    headline: "≈ 22 litres",
    secondary: "About 17 kg of wheat — a fortnight's bread for one person",
    basis: "Standard reconstruction from Iron Age storage jars.",
    note: "Ruth gleaned about an ephah of barley in a single day — an unusually generous harvest.",
  },
  {
    id: "omer",
    label: "Omer",
    kind: "volume",
    matches: ["omer", "omers"],
    ancient: "One tenth of an ephah — the daily manna ration",
    modern: "≈ 2.2 litres",
    headline: "≈ 2.2 litres",
    secondary: "Roughly 1.7 kg of grain per person per day",
    basis: "Exodus 16:36 defines the omer as a tenth of an ephah.",
    note: "A jar of manna, one omer, was kept beside the Ark as a memorial.",
  },
  {
    id: "hin",
    label: "Hin",
    kind: "volume",
    matches: ["hin", "hins"],
    ancient: "Liquid measure for oil and wine — one sixth of a bath",
    modern: "≈ 3.7 litres / 1 US gallon",
    headline: "≈ 3.7 litres",
    basis: "One sixth of a 22-litre bath.",
    note: "A quarter hin of wine accompanied the daily lamb offering.",
  },
  {
    id: "bath",
    label: "Bath",
    kind: "volume",
    matches: ["baths of oil", "baths of wine", "a bath of"],
    ancient: "Liquid equivalent of the ephah",
    modern: "≈ 22 litres / 5.8 US gallons",
    headline: "≈ 22 litres",
    basis: "Matched to the ephah by Ezekiel 45:11.",
    note: "Solomon's bronze sea held about two thousand baths — some 44,000 litres.",
  },
];

export const MEASURE_BY_ID: Record<string, Measure> = Object.fromEntries(
  MEASURES.map((m) => [m.id, m]),
);

export const MEASURE_KIND_LABEL: Record<MeasureKind, string> = {
  money: "Currency",
  length: "Length",
  weight: "Weight",
  volume: "Volume",
};
