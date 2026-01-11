const ONE_HOUR = 60 * 60 * 1000
const ONE_DAY = ONE_HOUR * 24
const TWO_DAYS = ONE_DAY * 2
const GRACE_PERIOD = ONE_HOUR

export const onActivity = (
  state,
) => {
  const lastActivityOn = new Date(state.statisticLastActivityOn)
  const lastActivityUTC = Date.UTC(
    lastActivityOn.getFullYear(),
    lastActivityOn.getMonth(),
    lastActivityOn.getDate()
  )

  const today = new Date()
  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  const deltaTime = (todayUTC - lastActivityUTC)

  if (deltaTime >= (TWO_DAYS + GRACE_PERIOD)) {
    state.statisticCurrentActivityStreak = 1
    state.statisticLastActivityOn = today.toISOString()
  } else if (deltaTime >= ONE_DAY) {
    state.statisticCurrentActivityStreak++
    state.statisticLastActivityOn = today.toISOString()
  }

  if (state.statisticCurrentActivityStreak > state.statisticLongestActivityStreak) {
    state.statisticLongestActivityStreak = state.statisticCurrentActivityStreak
  }
}
