export const callOnce = (
  method,
) => {
  let called = false
  let result = null
  return () => {
    if (!called) {
      called = true
      result = method()
    }
    return result
  }
}
