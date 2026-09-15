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

  onItemsChange: (
    items: JournalFieldItem[],
  ) => void
}

interface ItemEditorProps {
  item: JournalFieldItem

  autoFocus?: boolean

  className?: string

  onHeightChange?: (
    height: number,
  ) => void

  onChange: (
    value: string,
  ) => void

  onBlur: () => void

  onCreateAfter: () => void
}

function ItemEditor({
  item,
  autoFocus = false,
  className = '',
  onChange,
  onBlur,
  onCreateAfter,
  onHeightChange,
}: ItemEditorProps) {
  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    )

  const value =
    typeof item.value === 'string'
      ? item.value
      : ''

 function resizeTextarea(
  textarea:
    HTMLTextAreaElement,
) {
  textarea.style.height = 'auto'

  const height =
    textarea.scrollHeight

  textarea.style.height =
    `${height}px`

  onHeightChange?.(height)
}

useLayoutEffect(() => {
  const textarea =
    textareaRef.current

  if (!textarea) {
    return
  }

  resizeTextarea(textarea)
}, [value])

  function insertIndentedLineBreak() {
    const textarea =
      textareaRef.current

    if (
      !textarea ||
      !value.trim()
    ) {
      return
    }

    const start =
      textarea.selectionStart

    const end =
      textarea.selectionEnd

    const lineStart =
      value.lastIndexOf(
        '\n',
        start - 1,
      ) + 1

    const currentLine =
      value.slice(
        lineStart,
        start,
      )

    const indentation =
      currentLine.match(
        /^[\t ]*/,
      )?.[0] ?? ''

    const nextValue =
      value.slice(0, start) +
      '\n' +
      indentation +
      value.slice(end)

    const nextCursor =
      start +
      1 +
      indentation.length

    onChange(nextValue)

    requestAnimationFrame(() => {
      textarea.selectionStart =
        nextCursor

      textarea.selectionEnd =
        nextCursor
    })
  }

  return (
    <textarea
      ref={textareaRef}
      className={
        `journal-entry-field-input ${className}`
          .trim()
      }
      value={value}
      rows={1}
      autoFocus={autoFocus}
      onChange={(event) => {
  const textarea =
    event.currentTarget

  resizeTextarea(textarea)

  onChange(
    textarea.value,
  )
}}
      onBlur={onBlur}
      onKeyDown={(event) => {
        if (
          event.key !== 'Enter'
        ) {
          return
        }

        event.preventDefault()

        if (!value.trim()) {
          return
        }

        if (event.shiftKey) {
          insertIndentedLineBreak()
          return
        }

        onCreateAfter()
      }}
    />
  )
}

export function JournalFieldEditor({
  fieldDefinition,
  items,
  onItemsChange,
}: JournalFieldEditorProps) 
{
  const [
    firstItemHeight,
    setFirstItemHeight,
  ] = useState(21)
  
  const firstRowRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const labelRef =
    useRef<HTMLElement | null>(
      null,
    )

  const [
    focusedItemId,
    setFocusedItemId,
  ] = useState<string | null>(
    null,
  )

  const temporaryItemRef =
    useRef<JournalFieldItem | null>(
      null,
    )

  if (!temporaryItemRef.current) {
    const now =
      new Date().toISOString()

    temporaryItemRef.current = {
      id: crypto.randomUUID(),
      order: 0,
      value: '',
      source: 'master',
      createdAt: now,
      updatedAt: now,
    }
  }

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
          temporaryItemRef.current,
        ]

  const firstItem =
    displayItems[0]

  const remainingItems =
    displayItems.slice(1)  

  const isBlock = firstItemHeight > 24;

  function changeItem(
    item: JournalFieldItem,
    value: string,
  ) {
    const now =
      new Date().toISOString()

    if (
      item.id ===
      temporaryItemRef.current?.id
    ) {
      if (!value) {
        return
      }

      const newItem:
        JournalFieldItem = {
        id: crypto.randomUUID(),
        order: 0,
        value,
        source: 'master',
        createdAt: now,
        updatedAt: now,
      }

      temporaryItemRef.current =
        null

      setFocusedItemId(
        newItem.id,
      )

      onItemsChange([
        newItem,
      ])

      return
    }

    onItemsChange(
      sortedItems.map(
        (existingItem) =>
          existingItem.id ===
          item.id
            ? {
                ...existingItem,
                value,
                updatedAt: now,
              }
            : existingItem,
      ),
    )
  }

  function removeIfEmpty(
    item: JournalFieldItem,
  ) {
    if (
      item.id ===
      temporaryItemRef.current?.id
    ) {
      return
    }

    const value =
      typeof item.value === 'string'
        ? item.value
        : ''

    if (value.trim()) {
      return
    }

    onItemsChange(
      sortedItems
        .filter(
          (existingItem) =>
            existingItem.id !==
            item.id,
        )
        .map(
          (existingItem, index) => ({
            ...existingItem,
            order: index,
          }),
        ),
    )
  }

  function createAfter(
    item: JournalFieldItem,
  ) {
    const value =
      typeof item.value === 'string'
        ? item.value
        : ''

    if (!value.trim()) {
      return
    }

    const itemIndex =
      sortedItems.findIndex(
        (existingItem) =>
          existingItem.id ===
          item.id,
      )

    if (itemIndex < 0) {
      return
    }

    const now =
      new Date().toISOString()

    const newItem:
      JournalFieldItem = {
      id: crypto.randomUUID(),
      order: itemIndex + 1,
      value: '',
      source: 'master',
      createdAt: now,
      updatedAt: now,
    }

    const nextItems = [
      ...sortedItems.slice(
        0,
        itemIndex + 1,
      ),

      newItem,

      ...sortedItems
        .slice(
          itemIndex + 1,
        )
        .map(
          (existingItem) => ({
            ...existingItem,
            order:
              existingItem.order + 1,
          }),
        ),
    ]

    setFocusedItemId(
      newItem.id,
    )

    onItemsChange(
      nextItems,
    )
  }

  function renderItem(
  item: JournalFieldItem,
  className = '',
  onHeightChange?: (
    height: number,
  ) => void,
) {
    return (
      <ItemEditor
        key={item.id}
        item={item}
        className={className}
        onHeightChange={
            onHeightChange
        }
        autoFocus={
          item.id ===
          focusedItemId
        }
        onChange={(value) => {
          changeItem(
            item,
            value,
          )
        }}
        onBlur={() => {
          removeIfEmpty(
            item,
          )
        }}
        onCreateAfter={() => {
          createAfter(
            item,
          )
        }}
      />
    )
  }

  return (
    <div className="journal-field">
      <div
        ref={firstRowRef}
        className={
          isBlock
            ? 'journal-field-first-row block'
            : 'journal-field-first-row inline'
        }
      >
        <strong
          ref={labelRef}
          className="journal-entry-field-label"
        >
          {fieldDefinition.name}
          {!isBlock && ' -'}
        </strong>

        {renderItem(
            firstItem,
            'journal-field-first-item',
            setFirstItemHeight,
        )}      
      </div>

      {remainingItems.length > 0 && (
        <div className="journal-field-following-items">
          {remainingItems.map(
            (item) =>
              renderItem(
                item,
                'journal-field-following-item',
              ),
          )}
        </div>
      )}
    </div>
  )
}