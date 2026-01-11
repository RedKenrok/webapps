export const trimEnds = (
  text,
  queries,
) => {
  for (const query of queries) {
    if (text.startsWith(query)) {
      text = text.substring(query.length, text.length - query.length)
    }
    if (text.endsWith(query)) {
      text = text.substring(0, text.length - query.length)
    }
  }
  return text
}
