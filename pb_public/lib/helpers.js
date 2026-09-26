// The drawer: small helpers that have no subject of their own yet. When three of them
// gather around one topic, move those into a file named after it, beside format.js.
//
// Import one wherever you need it. If a template has to call it, add it to app.js the
// way formatDate is added there, and every page and partial can reach it.

export const slugify = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Only the readable half of the round trip: a slug has thrown away case and punctuation,
// so this makes one presentable rather than restoring what it was made from.
export const humanize = (slug) =>
  slug.replace(/-/g, ' ').replace(/^./, (first) => first.toUpperCase());
