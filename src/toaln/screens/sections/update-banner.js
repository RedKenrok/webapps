import {
  conditional as c,
  node as n,
} from '@doars/staark'

import { translate as t } from '../../data/translations.js'

const handleClick = (
) => {
  window.location.reload()
}

export const updateBanner = (
  state,
) => c(
  state.appUpdateAvailable,
  () => [
    n('button', {
      click: handleClick,
    }, t(state, 'banner-update_now')),

    n('div', {
      class: 'margin',
    }),
  ],
)
