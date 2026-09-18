import {
  useEffect,
  useRef,
} from 'react'

interface JournalItemEditorProps {
  value: string

  onChange: (
    value: string,
  ) => void

  onConfirm: () => void

  onClose: () => void
}

export function JournalItemEditor({
  value,
  onChange,
  onConfirm,
  onClose,
}: JournalItemEditorProps)
{
  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    )

    function applyMarkup(
  tag: 'b' | 'i' | 'u',
) {
  const textarea =
    textareaRef.current

  if (!textarea) {
    return
  }

  const start =
    textarea.selectionStart

  const end =
    textarea.selectionEnd

  if (start === end) {
    return
  }

  const selectedText =
    value.slice(start, end)

  const openTag =
    `<${tag}>`

  const closeTag =
    `</${tag}>`

  const replacement =
    openTag +
    selectedText +
    closeTag

  const nextValue =
    value.slice(0, start) +
    replacement +
    value.slice(end)

  onChange(nextValue)

  requestAnimationFrame(() => {
    textarea.focus()

    textarea.setSelectionRange(
      start + openTag.length,
      end + openTag.length,
    )
  })
}

  useEffect(() => {
    textareaRef.current?.focus()
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
            applyMarkup('b')
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
            applyMarkup('i')
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
            applyMarkup('u')
          }}
        >
          <u>U</u>
        </button>

      <textarea
        ref={textareaRef}
        className="journal-item-editor-input"
        value={value}
        onChange={(event) => {
          onChange(
            event.target.value,
          )
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') {
            return
          }

          event.preventDefault()
          const textarea = event.currentTarget
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const nextValue =
            value.slice(0, start) +
            '\t' +
            value.slice(end)

          onChange(nextValue)

          requestAnimationFrame(() => {
            const position = start + 1

            textarea.setSelectionRange(
              position,
              position,
            )
          })
        }}
      />

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