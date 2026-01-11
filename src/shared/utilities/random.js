/**
 * Return true randomly at the given odds.
 * @param {number} odds To chance of getting true. Where one is always and zero is never.
 * @returns {boolean}
 */
export const randomBool = (
  odds,
) => {
  odds = Math.abs(odds)
  return Math.random() < (1 / odds)
}

/**
 * Returns a random item from the list.
 * @param {Array<T>} items The list to get an item from.
 * @returns {T | null}
 */
export const randomItem = (
  items,
) => {
  if (
    !Array.isArray(items)
    || items.length === 0
  ) {
    return null
  }
  const index = Math.floor(Math.random() * items.length)
  return items[index]
}
