import {
  useEffect,
  useRef,
} from 'react'

interface JournalItemEditorProps {
  value: string
  fontFamily: string
  fontSize: number

  onChange: (
    value: string,
  ) => void

  onConfirm: () => void

  onClose: () => void
}

function markupToHtml(
  value: string,
): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /&lt;b&gt;/gi,
      '<strong>',
    )
    .replace(
      /&lt;\/b&gt;/gi,
      '</strong>',
    )
    .replace(
      /&lt;i&gt;/gi,
      '<em>',
    )
    .replace(
      /&lt;\/i&gt;/gi,
      '</em>',
    )
    .replace(
      /&lt;u&gt;/gi,
      '<u>',
    )
    .replace(
      /&lt;\/u&gt;/gi,
      '</u>',
    )
    .replace(/\n/g, '<br>')
    .replace(/\t/g, '&#9;')
}

function nodeToMarkup(
  node: Node,
): string {
  if (
    node.nodeType ===
    Node.TEXT_NODE
  ) {
    return (
      node.textContent ?? ''
    )
  }

  if (
    node.nodeType !==
    Node.ELEMENT_NODE
  ) {
    return ''
  }

  const element =
    node as HTMLElement

  const tagName =
    element.tagName
      .toLowerCase()

  if (tagName === 'br') {
    return '\n'
  }

  const content =
    Array.from(
      element.childNodes,
    )
      .map(nodeToMarkup)
      .join('')

  if (
    tagName === 'b' ||
    tagName === 'strong'
  ) {
    return (
      '<b>' +
      content +
      '</b>'
    )
  }

  if (
    tagName === 'i' ||
    tagName === 'em'
  ) {
    return (
      '<i>' +
      content +
      '</i>'
    )
  }

  if (tagName === 'u') {
    return (
      '<u>' +
      content +
      '</u>'
    )
  }

  if (tagName === 'div') {
    return (
      '\n' +
      content
    )
  }

  return content
}

function editorToMarkup(
  editor: HTMLDivElement,
): string {
  return Array.from(
    editor.childNodes,
  )
    .map(nodeToMarkup)
    .join('')
    .replace(/^\n/, '')
}

export function JournalItemEditor({
  value,
  fontFamily,
  fontSize,
  onChange,
  onConfirm,
  onClose,
}: JournalItemEditorProps)
{
  const editorRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const internalValueRef =
    useRef(value)

  function syncValue() {
    const editor =
      editorRef.current

    if (!editor) {
      return
    }

    const nextValue =
      editorToMarkup(
        editor,
      )

    internalValueRef.current =
      nextValue

    onChange(nextValue)
  }

  function applyFormatting(
    command:
      | 'bold'
      | 'italic'
      | 'underline',
  ) {
    const editor =
      editorRef.current

    if (!editor) {
      return
    }

    editor.focus()

    document.execCommand(
      command,
      false,
    )

    syncValue()
  }

  function insertTab() {
    const selection =
      window.getSelection()

    if (
      !selection ||
      selection.rangeCount === 0
    ) {
      return
    }

    const range =
      selection.getRangeAt(0)

    range.deleteContents()

    const tab =
      document.createTextNode(
        '\t',
      )

    range.insertNode(tab)

    range.setStartAfter(tab)
    range.collapse(true)

    selection.removeAllRanges()
    selection.addRange(range)

    syncValue()
  }

  function trimSelectedWhitespace() {
  requestAnimationFrame(() => {
    const selection =
      window.getSelection()

    if (
      !selection ||
      selection.rangeCount === 0 ||
      selection.isCollapsed
    ) {
      return
    }

    const range =
      selection.getRangeAt(0)

    const selectedText =
      range.toString()

    const trailingWhitespace =
      selectedText.match(/\s+$/)?.[0]
        .length ?? 0

    if (
      trailingWhitespace === 0
    ) {
      return
    }

    const endContainer =
      range.endContainer

    if (
      endContainer.nodeType !==
      Node.TEXT_NODE
    ) {
      return
    }

    const nextEnd =
      range.endOffset -
      trailingWhitespace

    if (nextEnd < 0) {
      return
    }

    range.setEnd(
      endContainer,
      nextEnd,
    )

    selection.removeAllRanges()
    selection.addRange(range)
  })
}

  useEffect(() => {
    const editor =
      editorRef.current

    if (!editor) {
      return
    }

    editor.innerHTML =
      markupToHtml(value)

    internalValueRef.current =
      value

    editor.focus()
  }, [])

  return (
    <div className="journal-item-editor">
      <div className="journal-item-editor-toolbar">
        <button
          type="button"
          title="Bold"
          onMouseDown={(event) => {
            event.preventDefault()
          }}
          onClick={() => {
            applyFormatting(
              'bold',
            )
          }}
        >
          <strong>B</strong>
        </button>

        <button
          type="button"
          title="Italic"
          onMouseDown={(event) => {
            event.preventDefault()
          }}
          onClick={() => {
            applyFormatting(
              'italic',
            )
          }}
        >
          <em>I</em>
        </button>

        <button
          type="button"
          title="Underline"
          onMouseDown={(event) => {
            event.preventDefault()
          }}
          onClick={() => {
            applyFormatting(
              'underline',
            )
          }}
        >
          <u>U</u>
        </button>
      </div>

      <div
        ref={editorRef}
        className="journal-item-editor-input"
        contentEditable
        suppressContentEditableWarning
        spellCheck
        onDoubleClick={() => {
          trimSelectedWhitespace()
        }}
        style={{
          fontFamily,
          fontSize:
            `${fontSize}px`,
        }}
        onInput={() => {
          syncValue()
        }}
        onKeyDown={(event) => {
          if (
            event.key !== 'Tab'
          ) {
            return
          }

          event.preventDefault()

          insertTab()
        }}
      />

      <div className="journal-item-editor-actions">
        <button
          type="button"
          className="journal-item-editor-confirm"
          title="Confirm changes"
          onClick={onConfirm}
        >
          Confirm
        </button>

        <button
          type="button"
          className="journal-item-editor-close"
          title="Close editor"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}