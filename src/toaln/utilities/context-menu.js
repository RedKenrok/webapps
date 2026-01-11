const getSelection = () => {
  const selection = window.getSelection()

  let context = ''
  if (selection.anchorNode) {
    if (selection.anchorNode === selection.focusNode) {
      context = selection.anchorNode.textContent.trim()
    } else {
      // Clone selection and set the range to the start of the anchor node and the end of the focus node.
      const range = selection
        .getRangeAt(0)
        .cloneRange()
      range.setStart(
        selection.anchorNode,
        0,
      )
      range.setEnd(
        selection.focusNode,
        selection.focusNode.length,
      )

      const fragment = range.cloneContents()
      context = Array.from(
        fragment.childNodes,
      )
        .map((node) => node.textContent)
        .join(' ')
        .trim()
    }
  }

  return {
    context: context,
    text: selection?.toString().trim() ?? ''
  }
}

export const handleContextMenu = (
  state,
) => {
  document.addEventListener('contextmenu', (
    event,
  ) => {
    event.preventDefault()

    state.contextMenu = {
      pointerX: event.pageX,
      pointerY: event.pageY,
    }
    state.selection = getSelection()

    // Close the context menu when clicking outside of it.
    document.addEventListener('click', () => {
      state.contextMenu = null
      state.selection = null
    }, {
      once: true,
    })
  })
}

