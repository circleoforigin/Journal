import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import type {
  JournalFieldDefinition,
} from '../models/JournalFieldDefinition'

import type {
  JournalFieldItem,
} from '../models/JournalField'

interface JournalFieldEditorProps {
  fieldDefinition:
    JournalFieldDefinition

  items: JournalFieldItem[]

  onSaveItem: (
    item: JournalFieldItem,
  ) => void

  onRemoveItem: (
    itemId: string,
  ) => void
}

interface JournalFieldItemEditorProps {
  fieldDefinition:
    JournalFieldDefinition

  item: JournalFieldItem

  onSave: (
    item: JournalFieldItem,
  ) => void

  onRemove: (
    itemId: string,
  ) => void

  onCreateAfter: (
    item: JournalFieldItem,
  ) => void
}

function JournalFieldItemEditor({
  fieldDefinition,
  item,
  onSave,
  onRemove,
  onCreateAfter,
}: JournalFieldItemEditorProps) {
  const fieldRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const labelRef =
    useRef<HTMLElement | null>(
      null,
    )

  const measureRef =
    useRef<HTMLSpanElement | null>(
      null,
    )

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
  ] = useState(
    typeof item.value === 'string'
      ? item.value
      : '',
  )

  useEffect(() => {
    setDraft(
      typeof item.value === 'string'
        ? item.value
        : '',
    )
  }, [
    item.id,
    item.value,
  ])

  function measureLayout() {
    const field =
      fieldRef.current

    const label =
      labelRef.current

    const measure =
      measureRef.current

    if (
      !field ||
      !label ||
      !measure
    ) {
      return
    }

    const requiredWidth =
      label.scrollWidth +
      4 +
      measure.scrollWidth

    const nextIsBlock =
      requiredWidth >
      field.clientWidth

    setIsBlock(
      (current) =>
        current === nextIsBlock
          ? current
          : nextIsBlock,
    )
  }

  useLayoutEffect(() => {
    measureLayout()
  }, [draft])

  useEffect(() => {
    const field =
      fieldRef.current

    if (!field) {
      return
    }

    const observer =
      new ResizeObserver(() => {
        measureLayout()
      })

    observer.observe(field)

    return () => {
      observer.disconnect()
    }
  }, [])

  useLayoutEffect(() => {
    const textarea =
      textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height =
      'auto'

    if (isBlock) {
      textarea.style.height =
        `${textarea.scrollHeight}px`
    }
  }, [
    draft,
    isBlock,
  ])

  function commit() {
    if (!draft.trim()) {
      onRemove(item.id)
      return
    }

    onSave({
      ...item,
      value: draft,
      updatedAt:
        new Date().toISOString(),
    })
  }

  function insertIndentedLineBreak() {
    const textarea =
      textareaRef.current

    if (
      !textarea ||
      !draft.trim()
    ) {
      return
    }

    const start =
      textarea.selectionStart

    const end =
      textarea.selectionEnd

    const lineStart =
      draft.lastIndexOf(
        '\n',
        start - 1,
      ) + 1

    const currentLine =
      draft.slice(
        lineStart,
        start,
      )

    const indentation =
      currentLine.match(
        /^[\t ]*/,
      )?.[0] ?? ''

    const nextValue =
      draft.slice(0, start) +
      '\n' +
      indentation +
      draft.slice(end)

    const nextCursor =
      start +
      1 +
      indentation.length

    setDraft(nextValue)

    requestAnimationFrame(() => {
      textarea.selectionStart =
        nextCursor

      textarea.selectionEnd =
        nextCursor
    })
  }

  return (
    <div
      ref={fieldRef}
      className={
        isBlock
          ? 'journal-entry-field block'
          : 'journal-entry-field inline'
      }
    >
      <strong
        ref={labelRef}
        className="journal-entry-field-label"
      >
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
        onBlur={commit}
        onKeyDown={(event) => {
          if (
            event.key !== 'Enter'
          ) {
            return
          }

          event.preventDefault()

          if (!draft.trim()) {
            return
          }

          if (event.shiftKey) {
            insertIndentedLineBreak()
            return
          }

          commit()

          onCreateAfter(item)
        }}
        aria-label={
          fieldDefinition.name
        }
      />

      <span
        ref={measureRef}
        className="journal-field-measure"
        aria-hidden="true"
      >
        {draft || ' '}
      </span>
    </div>
  )
}

export function JournalFieldEditor({
  fieldDefinition,
  items,
  onSaveItem,
  onRemoveItem,
}: JournalFieldEditorProps) {
  const sortedItems =
    [...items].sort(
      (left, right) =>
        left.order -
        right.order,
    )

  const displayItems =
    sortedItems.length > 0
      ? sortedItems
      : [
          {
            id: crypto.randomUUID(),
            order: 0,
            value: '',
            source:
              'master' as const,
            createdAt:
              new Date()
                .toISOString(),
            updatedAt:
              new Date()
                .toISOString(),
          },
        ]

  function createAfter(
    item: JournalFieldItem,
  ) {
    const nextOrder =
      item.order + 1

    const shiftedItems =
      sortedItems.map(
        (existingItem) =>
          existingItem.order >=
          nextOrder
            ? {
                ...existingItem,
                order:
                  existingItem.order +
                  1,
              }
            : existingItem,
      )

    for (
      const shiftedItem
      of shiftedItems
    ) {
      if (
        shiftedItem.order !==
        sortedItems.find(
          (existingItem) =>
            existingItem.id ===
            shiftedItem.id,
        )?.order
      ) {
        onSaveItem(
          shiftedItem,
        )
      }
    }

    const now =
      new Date().toISOString()

    onSaveItem({
      id: crypto.randomUUID(),
      order: nextOrder,
      value: '',
      source: 'master',
      createdAt: now,
      updatedAt: now,
    })
  }

  return (
    <>
      {displayItems.map(
        (item) => (
          <JournalFieldItemEditor
            key={item.id}
            fieldDefinition={
              fieldDefinition
            }
            item={item}
            onSave={
              onSaveItem
            }
            onRemove={
              onRemoveItem
            }
            onCreateAfter={
              createAfter
            }
          />
        ),
      )}
    </>
  )
}