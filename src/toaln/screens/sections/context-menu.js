import {
  conditional as c,
  node as n,
} from '@doars/staark'
import {
  translate as t,
} from '../../data/translations'
import { createMessage } from '../../../shared/apis/apis'

const removeContextMenu = (
  event,
  state,
) => {
  event.preventDefault()

  state.contextMenu = null
  state.selection = null
}

const handleBack = (
  event,
  state,
) => {
  window.history.back()
  removeContextMenu(event, state)
}

const handleCopy = (
  event,
  state,
) => {
  navigator.clipboard.writeText(
    state.selection.text,
  )
  removeContextMenu(event, state)
}

const handleExplain = (
  event,
  state,
) => {
  state.popupModal = {
    messages: [{
      role: 'user',
      content: (
        t(state, 'popup-explain')
        + "\r\n\r\n"
        + state.selection.text
      ),
    }],
    pending: true,
  }

  createMessage(
    state,
    [{
      role: 'user',
      content: t(state, 'prompt-explain-user'),
    }, ...(
      state.selection.text === state.selection.context
        ? []
        : [{
          role: 'context',
          content: t(state, 'prompt-explain-context'),
        }]
    )],
    t(state, 'prompt-context'),
    t(state, 'prompt-explain'),
  ).then(([error, _response, result]) => {
    state.popupModal.pending = false
    if (error) {
      state.popupModal.error = error.toString()
      return
    }
    state.popupModal.messages.push(result)
  })

  removeContextMenu(event, state)
}

const handleReload = (
  event,
  state,
) => {
  window.location.reload()
  removeContextMenu(event, state)
}

const handleTranslate = (
  event,
  state,
) => {
  state.popupModal = {
    messages: [{
      role: 'user',
      content: (
        t(state, 'popup-translate')
        + "\r\n\r\n"
        + state.selection.text
      ),
    }],
    pending: true,
  }

  createMessage(
    state,
    [{
      role: 'user',
      content: t(state, 'prompt-translate-user'),
    }, ...(
      state.selection.text === state.selection.context
        ? []
        : [{
          role: 'context',
          content: t(state, 'prompt-translate-context'),
        }]
    )],
    t(state, 'prompt-context'),
    t(state, 'prompt-translate'),
  ).then(([error, _response, result]) => {
    state.popupModal.pending = false
    if (error) {
      state.popupModal.error = error.toString()
      return
    }
    state.popupModal.messages.push(result)
  })

  removeContextMenu(event, state)
}

export const contextMenu = (
  state,
) => c(
  state.contextMenu && state.selection,
  () => {
    let top = state.contextMenu.pointerY <= (window.innerHeight / 2)
    let left = state.contextMenu.pointerX <= (window.innerWidth / 2)
    let anchor = (
      top
        ? 'Top'
        : 'Bottom'
    ) + (
        left
          ? 'Left'
          : 'Right'
      )

    return n('div', {
      class: 'context-menu',
      style: {
        ['border' + anchor + 'Radius']: '0',
        ...(
          left
            ? {
              left: state.contextMenu.pointerX + 'px',
            }
            : {
              right: (window.innerWidth - state.contextMenu.pointerX + 'px'),
            }
        ),
        ...(
          top
            ? {
              top: state.contextMenu.pointerY + 'px',
            }
            : {
              bottom: (window.innerHeight - state.contextMenu.pointerY + 'px'),
            }
        )
      }
    }, [
      ...c(
        state.selection.text.length > 0,
        [
          n('button', {
            click: handleCopy,
          }, t(state, 'context-copy')),

          n('button', {
            click: handleTranslate,
          }, t(state, 'context-translate')),

          n('button', {
            click: handleExplain,
          }, t(state, 'context-explain')),

          n('div', {
            class: 'margin',
          }),
        ],
      ),

      n('button', {
        disabled: !window.history.length,
        click: handleBack,
      }, t(state, 'button-go_back')),

      n('button', {
        click: handleReload,
      }, t(state, 'button-reload')),
    ])
  }
)
