import {
  conditional as c,
  node as n,
} from '@doars/staark'
import {
  translate as t,
} from '../../data/translations'

const handleBack = (
  _event,
  state,
) => {
  state.popupModal = null
}

export const popupModal = (
  state,
) => c(
  state.popupModal,
  () => n('div', {
    class: 'popup-modal',
  }, [
    ...c(
      state.popupModal.messages
      && state.popupModal.messages.length > 0,
      n('div', {
        class: 'messages',
      }, state.popupModal.messages.map(
        (message) => n('p', {
          class: 'message-' + message?.role
        }, message?.content?.split('\n')?.flatMap(
          (content, index, results) =>
            index === results.length - 1 ? [content] : [content, n('br')]
        )),
      )),
    ),

    ...c(
      state.popupModal.error,
      n('p', state.popupModal.error),
    ),

    ...c(
      state.popupModal.pending,
      n('p', {
        class: 'pending',
      }),
    ),

    n('button', {
      type: 'button',
      click: handleBack,
    }, t(state, 'button-close')),
  ]),
)
