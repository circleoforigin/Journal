import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import type {
  JournalFieldDefinition,
} from '../models/JournalFieldDefinition'

interface JournalFieldEditorProps {
  fieldDefinition:
    JournalFieldDefinition

  value: string

  onCommit: (
    value: string,
  ) => void
}

export function JournalFieldEditor({
  fieldDefinition,
  value,
  onCommit,
}: JournalFieldEditorProps) {
  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    )

  const [
    isBlock,
    setIsBlock,
  ] = useState(false)

  const [
    draft,
    setDraft,
  ] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  function measure() {
    const textarea =
      textareaRef.current

    if (!textarea) {
      return
    }

    /*
     * First measure the value using
     * the available inline width.
     */
    textarea.style.height = 'auto'

    const lineHeight =
      Number.parseFloat(
        window
          .getComputedStyle(textarea)
          .lineHeight,
      )

    const needsBlock =
      textarea.scrollHeight >
      lineHeight + 2

    setIsBlock(needsBlock)
  }

  useLayoutEffect(() => {
    measure()
  }, [
    draft,
    isBlock,
  ])

  useEffect(() => {
    const handleResize = () => {
      measure()
    }

    window.addEventListener(
      'resize',
      handleResize,
    )

    return () => {
      window.removeEventListener(
        'resize',
        handleResize,
      )
    }
  }, [])

  useLayoutEffect(() => {
    const textarea =
      textareaRef.current

    if (
      !textarea ||
      !isBlock
    ) {
      return
    }

    textarea.style.height = 'auto'

    textarea.style.height =
      `${textarea.scrollHeight}px`
  }, [
    draft,
    isBlock,
  ])

  return (
    <div
      className={
        isBlock
          ? 'journal-entry-field block'
          : 'journal-entry-field inline'
      }
    >
      <strong className="journal-entry-field-label">
        {fieldDefinition.name}
        {!isBlock && ' -'}
      </strong>

      <textarea
        ref={textareaRef}
        className="journal-entry-field-input"
        value={draft}
        rows={1}
        onChange={(event) => {
          setDraft(
            event.target.value,
          )
        }}
        onBlur={() => {
          onCommit(draft)
        }}
        aria-label={
          fieldDefinition.name
        }
      />
    </div>
  )
}