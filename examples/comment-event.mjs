import { matchTrigger, pickReply, makePrivateReply, isSelfOrThreadReply } from '../src/comment-rules.mjs';

const rule = {
  mediaId: 'EXAMPLE_MEDIA_ID', keywords: ['guide', 'startup guide'],
  replies: ['Sent you the guide!', 'Check your inbox for the guide.'],
  dmMessage: 'Here is the guide you requested.', link: 'https://example.org/guide',
};
const comment = { id: 'EXAMPLE_COMMENT_ID', mediaId: rule.mediaId, text: 'Startup guide please!', from: { id: 'OTHER_USER' } };
if (!isSelfOrThreadReply(comment, 'YOUR_OWN_IG_USER_ID')) {
  const matched = matchTrigger(comment.text, rule.keywords);
  if (matched) console.log(JSON.stringify({ matched, publicReply: pickReply(rule.replies, comment.id),
    privateReply: makePrivateReply({ text: rule.dmMessage, linkUrl: rule.link, linkLabel: 'Open guide' }),
    IMPORTANT: 'Store unique comment ID and unique action type before dispatch to prevent duplicates.' }, null, 2));
}
// On live events, DO NOT call Meta inline in the webhook request. Queue first.
