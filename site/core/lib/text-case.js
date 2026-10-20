/**
 * Title Case for headings, titles, buttons and nav items generated in JS.
 *
 *   titleCase('become a partner')          → 'Become a Partner'
 *   titleCase('partner code of conduct')   → 'Partner Code of Conduct'
 *   titleCase('message us on WhatsApp')    → 'Message Us on WhatsApp'
 *
 * Minor words (articles, short conjunctions and prepositions) stay lower case
 * unless they open or close the title or follow a colon or dash. Words that
 * already carry capitals (WhatsApp, Q&A, CW), digits or brackets are kept as
 * written, so [placeholders] and brand names never change.
 */

const MINOR = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet',
  'as', 'at', 'by', 'in', 'of', 'off', 'on', 'per', 'to', 'up', 'via', 'vs',
]);
const KEEP = /[A-Z\d[\]]|^[^a-z]*$/; // has capitals, digits or brackets, or no letters to change
const BREAK_AFTER = /[:—–]$/;

const capitalise = (word) => word.replace(/^([^a-z]*)([a-z])/, (_, lead, ch) => lead + ch.toUpperCase());

const BRACKETED = /[[\]]/;

function caseWord(word, { first, last, afterBreak }) {
  // Hyphenated parts are cased one by one, so '30-day' → '30-Day' (a [bracket] stays whole).
  if (word.includes('-') && !BRACKETED.test(word)) {
    return word.split('-').map((part) => caseWord(part, { first: true, last, afterBreak })).join('-');
  }
  if (KEEP.test(word)) return word;
  const bare = word.replace(/[^a-z']/g, '');
  if (!first && !last && !afterBreak && MINOR.has(bare)) return word;
  return capitalise(word);
}

export function titleCase(text) {
  const parts = String(text ?? '').split(/(\s+)/);
  const words = parts.filter((p) => p.trim());
  let index = 0;
  let afterBreak = false;
  return parts.map((part) => {
    if (!part.trim()) return part;
    const out = caseWord(part, { first: index === 0, last: index === words.length - 1, afterBreak });
    index += 1;
    afterBreak = BREAK_AFTER.test(part) || part === '·';
    return out;
  }).join('');
}
