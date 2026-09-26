// Helpers exposed to templates through app.js. Formatting follows the visitor's locale.

export function formatDate(value, options = { dateStyle: 'medium' }, locale) {
  return new Date(value).toLocaleString(locale, options);
}
