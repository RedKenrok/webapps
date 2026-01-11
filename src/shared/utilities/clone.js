export const cloneRecursive = (
  value,
) => {
  if (typeof (value) === 'object') {
    if (Array.isArray(value)) {
      const clone = []
      for (let i = 0; i < value.length; i++) {
        clone.push(cloneRecursive(value[i]))
      }
      value = clone
    } else {
      const clone = {}
      for (const key in value) {
        clone[key] = cloneRecursive(value[key])
      }
      value = clone
    }
  }
  return value
}
