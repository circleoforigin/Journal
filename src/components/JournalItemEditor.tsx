import {
  useEffect,
  useRef,
} from 'react'

interface JournalItemEditorProps {
  value: string

  onChange: (
    value: string,
  ) => void

  onClose: () => void
}

export function JournalItemEditor({
  value,
  onChange,
  onClose,
}: JournalItemEditorProps) {
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
          className="journal-item-editor-close"
          title="Close editor"
          onClick={onClose}
        >
          ×
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
      />
    </div>
  )
}