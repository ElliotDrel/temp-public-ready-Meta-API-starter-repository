const INVISIBLE = /[\u200B-\u200D\uFEFF]/g;
const PUNCT = /[\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]/g;
export function normalizeComment(text) {
  return String(text).toLowerCase().replace(INVISIBLE, '').replace(PUNCT, ' ').replace(/\s+/g, ' ').trim();
}
export function matchTrigger(text, keywords) {
  const haystack = normalizeComment(text);
  const list = keywords.map((original) => ({ original, normalized: normalizeComment(original) }))
    .filter(({ normalized }) => normalized.length > 0)
    .sort((a, b) => b.normalized.length - a.normalized.length);
  return list.find(({ normalized }) => haystack.includes(normalized))?.original ?? null;
}
export function pickReply(templates, commentId) {
  const usable = templates.map((t) => t.trim()).filter(Boolean);
  if (!usable.length) return null;
  let hash = 0;
  for (const char of String(commentId)) hash = (hash * 31 + char.charCodeAt(0)) % 2147483647;
  return usable[hash % usable.length];
}
/** Meta's button template text/title limits: 640 / 20 characters, respectively.
 * If copy is too long, send text with a URL rather than silently losing the button.
 */
export function makePrivateReply({ text, linkUrl = null, linkLabel = null }) {
  const clean = text?.trim();
  if (!clean) return null;
  if (!linkUrl) return { text: clean };
  if (clean.length > 640) return { text: `${clean}\n\n${linkUrl}` };
  const title = linkLabel?.trim();
  return { attachment: { type: 'template', payload: {
    template_type: 'button', text: clean,
    buttons: [{ type: 'web_url', url: linkUrl, title: title && title.length <= 20 ? title : 'Open link' }],
  } } };
}
export function isSelfOrThreadReply(comment, ownIgUserId) {
  return String(comment?.from?.id ?? '') === String(ownIgUserId) || Boolean(comment?.parent_id);
}
