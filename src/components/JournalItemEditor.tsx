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

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  return (
    <div className="journal-item-editor">
      <div className="journal-item-editor-toolbar">
        <button
          type="button"
          title="Bold"
        >
          <strong>B</strong>
        </button>

        <button
          type="button"
          title="Italic"
        >
          <em>I</em>
        </button>

        <button
          type="button"
          title="Underline"
        >
          <u>U</u>
        </button>

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
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()

    const textarea = event.currentTarget

    const start = textarea.selectionStart

    const end = textarea.selectionEnd    

    const insertion = '\n\t'

    const nextValue =
      value.slice(0, start) +
      insertion +
      value.slice(end)

    onChange(nextValue)

    requestAnimationFrame(() => {
      const position =
        start +
        insertion.length

      textarea.setSelectionRange(
        position,
        position,
      )
    })
  }}
/>
    </div>
  )
}