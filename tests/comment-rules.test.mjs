import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeComment, matchTrigger, pickReply, makePrivateReply, isSelfOrThreadReply } from '../src/comment-rules.mjs';

test('normalization strips invisible characters and separates punctuation', () => {
  assert.equal(normalizeComment('L\u200bINK, please!'), 'link please');
});
test('match prefers longest keyword', () => {
  assert.equal(matchTrigger('Can I get the startup guide?', ['guide','startup guide']), 'startup guide');
});
test('deterministic template on a stable comment ID', () => {
  const a = pickReply(['Hi', 'Hello', 'Sent'], '123');
  assert.equal(a, pickReply(['Hi', 'Hello', 'Sent'], '123'));
});
test('button title capped and long message falls back to link text', () => {
  const button = makePrivateReply({ text: 'Here you go', linkUrl: 'https://example.org', linkLabel: 'This title is far longer than twenty characters' });
  assert.equal(button.attachment.payload.buttons[0].title, 'Open link');
  const text = makePrivateReply({ text: 'x'.repeat(641), linkUrl: 'https://example.org' });
  assert.equal(text.text, 'x'.repeat(641) + '\n\nhttps://example.org');
});
test('self-comments and nested replies ignored', () => {
  assert.equal(isSelfOrThreadReply({from:{id:'42'}}, '42'), true);
  assert.equal(isSelfOrThreadReply({from:{id:'12'},parent_id:'22'}, '42'), true);
  assert.equal(isSelfOrThreadReply({from:{id:'12'}}, '42'), false);
});
