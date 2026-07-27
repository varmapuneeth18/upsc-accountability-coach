// Rule-based mnemonic generator: no external AI call, just a curated
// word bank per letter so the same input always produces the same output.
const WORD_BANK: Record<string, string[]> = {
  A: ["Angry", "Ancient", "Awkward", "Ambitious"],
  B: ["Brave", "Bouncy", "Blue", "Busy"],
  C: ["Curious", "Clumsy", "Crazy", "Calm"],
  D: ["Dancing", "Daring", "Dusty", "Dizzy"],
  E: ["Eager", "Elegant", "Enormous", "Excited"],
  F: ["Furious", "Funky", "Fearless", "Friendly"],
  G: ["Giant", "Grumpy", "Golden", "Greedy"],
  H: ["Happy", "Hairy", "Hungry", "Honest"],
  I: ["Icy", "Itchy", "Invisible", "Iron"],
  J: ["Jolly", "Jumpy", "Jealous", "Jazzy"],
  K: ["Kind", "Kooky", "Keen", "Klutzy"],
  L: ["Lazy", "Loud", "Lucky", "Lively"],
  M: ["Mighty", "Messy", "Magic", "Moody"],
  N: ["Noisy", "Nervous", "Nifty", "Naughty"],
  O: ["Odd", "Old", "Orange", "Outrageous"],
  P: ["Proud", "Purple", "Playful", "Peculiar"],
  Q: ["Quiet", "Quick", "Quirky", "Quarrelsome"],
  R: ["Restless", "Rusty", "Royal", "Rowdy"],
  S: ["Sleepy", "Silly", "Sneaky", "Shiny"],
  T: ["Tiny", "Tricky", "Thirsty", "Tough"],
  U: ["Unlucky", "Upset", "Unusual", "Urgent"],
  V: ["Vast", "Vain", "Vivid", "Villainous"],
  W: ["Wild", "Weary", "Witty", "Wobbly"],
  X: ["Xenial"],
  Y: ["Young", "Yawning", "Yappy"],
  Z: ["Zany", "Zealous", "Zippy"],
};

function pick(letter: string, seed: number): string {
  const key = letter.toUpperCase();
  const options = WORD_BANK[key] ?? [letter.toUpperCase()];
  return options[seed % options.length];
}

/**
 * Given an ordered list of items (e.g. state names, dynasties, articles),
 * builds an acronym from first letters plus a silly-but-memorable sentence
 * using those same letters, deterministically from the input.
 */
export function generateMnemonic(topic: string, items: string[]): string {
  const cleanItems = items.map((i) => i.trim()).filter(Boolean);
  if (cleanItems.length === 0) return "";

  const letters = cleanItems.map((i) => i[0].toUpperCase());
  const acronym = letters.join("");

  const sentenceWords = letters.map((letter, idx) => pick(letter, idx + topic.length));
  const sentence = sentenceWords.join(" ") + ".";

  const legend = cleanItems
    .map((item, idx) => `${letters[idx]} = ${item}`)
    .join(", ");

  return `Acronym: ${acronym}\nSentence: "${sentence}"\n(${legend})`;
}
