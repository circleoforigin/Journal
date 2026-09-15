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

  className?: string

  autoFocus?: boolean

  onCommit: (
    item: JournalFieldItem,
    value: string,
  ) => void

  onCreateAfter: (
    item: JournalFieldItem,
    value: string,
  ) => void

  onDiscardEmpty: (
    item: JournalFieldItem,
  ) => void

  onHeightChange?: (
    height: number,
  ) => void
}

function getStringValue(
  item: JournalFieldItem,
) {
  return typeof item.value === 'string'
    ? item.value
    : ''
}

function createTransientItem(
  order: number,
): JournalFieldItem {
  const now =
    new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    order,
    value: '',
    source: 'master',
    createdAt: now,
    updatedAt: now,
  }
}

function ItemEditor({
  item,
  className = '',
  autoFocus = false,
  onCommit,
  onCreateAfter,
  onDiscardEmpty,
  onHeightChange,
}: ItemEditorProps) {
  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    )

  const [
    draft,
    setDraft,
  ] = useState(
    getStringValue(item),
  )

  /*
   * If the persisted Item changes from
   * outside this editor, synchronize it.
   *
   * Normal typing does NOT come through
   * here because typing is local draft
   * state now.
   */
  useEffect(() => {
    setDraft(
      getStringValue(item),
    )
  }, [
    item.id,
    item.value,
  ])

  function resizeTextarea() {
    const textarea =
      textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = 'auto'

    const nextHeight =
      textarea.scrollHeight

    textarea.style.height =
      `${nextHeight}px`

    onHeightChange?.(
      nextHeight,
    )
  }

  useLayoutEffect(() => {
    resizeTextarea()
  }, [draft])

  useEffect(() => {
    if (!autoFocus) {
      return
    }

    const textarea =
      textareaRef.current

    if (!textarea) {
      return
    }

    textarea.focus()

    const end =
      textarea.value.length

    textarea.setSelectionRange(
      end,
      end,
    )
  }, [autoFocus])

  useEffect(() => {
    const textarea =
      textareaRef.current

    if (!textarea) {
      return
    }

    const observer =
      new ResizeObserver(() => {
        resizeTextarea()
      })

    observer.observe(
      textarea,
    )

    return () => {
      observer.disconnect()
    }
  }, [])

  function commit() {
    if (!draft.trim()) {
      onDiscardEmpty(
        item,
      )

      return
    }

    if (
      draft ===
      getStringValue(item)
    ) {
      return
    }

    onCommit(
      item,
      draft,
    )
  }

  function insertIndentedLineBreak() {
    const textarea =
      textareaRef.current

    if (!textarea) {
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

    const nextDraft =
      draft.slice(
        0,
        start,
      ) +
      '\n' +
      indentation +
      draft.slice(end)

    const nextCursor =
      start +
      1 +
      indentation.length

    setDraft(
      nextDraft,
    )

    requestAnimationFrame(
      () => {
        textarea.setSelectionRange(
          nextCursor,
          nextCursor,
        )
      },
    )
  }

  return (
    <textarea
      ref={textareaRef}
      className={
        `journal-entry-field-input ${className}`
          .trim()
      }
      value={draft}
      rows={1}
      onChange={(event) => {
        setDraft(
          event.currentTarget.value,
        )
      }}
      onBlur={() => {
        commit()
      }}
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

        onCreateAfter(
          item,
          draft,
        )
      }}
    />
  )
}

export function JournalFieldEditor({
  fieldDefinition,
  items,
  onItemsChange,
}: JournalFieldEditorProps) {
  const [
    transientItems,
    setTransientItems,
  ] = useState<
    JournalFieldItem[]
  >([])

  const [
    focusedItemId,
    setFocusedItemId,
  ] = useState<
    string | null
  >(null)

  const [
    firstItemHeight,
    setFirstItemHeight,
  ] = useState(21)

  const sortedItems =
    [...items].sort(
      (left, right) =>
        left.order -
        right.order,
    )

  /*
   * A completely empty Field still needs
   * one editable Item on screen, but that
   * Item must not exist in persistence yet.
   */
  const emptyFieldItemRef =
    useRef<
      JournalFieldItem | null
    >(null)

  if (
    sortedItems.length === 0 &&
    transientItems.length === 0 &&
    !emptyFieldItemRef.current
  ) {
    emptyFieldItemRef.current =
      createTransientItem(0)
  }

  if (
    sortedItems.length > 0
  ) {
    emptyFieldItemRef.current =
      null
  }

  const displayItems = [
    ...sortedItems,
    ...transientItems,
  ].sort(
    (left, right) =>
      left.order -
      right.order,
  )

  if (
    displayItems.length === 0 &&
    emptyFieldItemRef.current
  ) {
    displayItems.push(
      emptyFieldItemRef.current,
    )
  }

  const firstItem =
    displayItems[0]

  const remainingItems =
    displayItems.slice(1)

  const isBlock =
    firstItemHeight > 24

  function isTransient(
    item: JournalFieldItem,
  ) {
    return (
      transientItems.some(
        (transientItem) =>
          transientItem.id ===
          item.id,
      ) ||
      emptyFieldItemRef
        .current?.id ===
        item.id
    )
  }

  function buildCommittedItem(
    item: JournalFieldItem,
    value: string,
  ): JournalFieldItem {
    const now =
      new Date().toISOString()

    return {
      ...item,
      value,
      updatedAt: now,
    }
  }

  function commitItem(
    item: JournalFieldItem,
    value: string,
  ) {
    const committedItem =
      buildCommittedItem(
        item,
        value,
      )

    if (isTransient(item)) {
      const nextItems = [
        ...sortedItems,
        committedItem,
      ]
        .sort(
          (left, right) =>
            left.order -
            right.order,
        )
        .map(
          (
            existingItem,
            index,
          ) => ({
            ...existingItem,
            order: index,
          }),
        )

      setTransientItems(
        (current) =>
          current.filter(
            (transientItem) =>
              transientItem.id !==
              item.id,
          ),
      )

      if (
        emptyFieldItemRef
          .current?.id ===
        item.id
      ) {
        emptyFieldItemRef.current =
          null
      }

      onItemsChange(
        nextItems,
      )

      return
    }

    onItemsChange(
      sortedItems.map(
        (existingItem) =>
          existingItem.id ===
          item.id
            ? committedItem
            : existingItem,
      ),
    )
  }

  function discardEmpty(
    item: JournalFieldItem,
  ) {
    if (isTransient(item)) {
      setTransientItems(
        (current) =>
          current.filter(
            (transientItem) =>
              transientItem.id !==
              item.id,
          ),
      )

      /*
       * Keep the permanent empty-field
       * editor available when the Field
       * still has no persisted Items.
       */
      return
    }

    const value =
      getStringValue(item)

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
          (
            existingItem,
            index,
          ) => ({
            ...existingItem,
            order: index,
          }),
        ),
    )
  }

  function createAfter(
    item: JournalFieldItem,
    value: string,
  ) {
    if (!value.trim()) {
      return
    }

    /*
     * Enter is a commit boundary.
     *
     * Commit the current Item first if
     * necessary, then create the next Item
     * only in local UI state.
     */
    let baseItems =
      sortedItems

    const committedItem =
      buildCommittedItem(
        item,
        value,
      )

    if (isTransient(item)) {
      baseItems = [
        ...sortedItems,
        committedItem,
      ]
    } else {
      baseItems =
        sortedItems.map(
          (existingItem) =>
            existingItem.id ===
            item.id
              ? committedItem
              : existingItem,
        )
    }

    baseItems =
      [...baseItems]
        .sort(
          (left, right) =>
            left.order -
            right.order,
        )

    const currentIndex =
      baseItems.findIndex(
        (existingItem) =>
          existingItem.id ===
          item.id,
      )

    if (currentIndex < 0) {
      return
    }

    /*
     * Make room in the persisted ordering
     * for the future Item, but do not
     * persist an empty Item.
     */
    const normalizedItems =
      baseItems.map(
        (
          existingItem,
          index,
        ) => ({
          ...existingItem,
          order: index,
        }),
      )

    const newTransientItem =
      createTransientItem(
        currentIndex + 1,
      )

    const shiftedItems =
      normalizedItems.map(
        (existingItem) =>
          existingItem.order >
          currentIndex
            ? {
                ...existingItem,
                order:
                  existingItem.order +
                  1,
              }
            : existingItem,
      )

    if (isTransient(item)) {
      setTransientItems(
        (current) =>
          current.filter(
            (transientItem) =>
              transientItem.id !==
              item.id,
          ),
      )

      if (
        emptyFieldItemRef
          .current?.id ===
        item.id
      ) {
        emptyFieldItemRef.current =
          null
      }
    }

    onItemsChange(
      shiftedItems,
    )

    setTransientItems(
      (current) => [
        ...current.filter(
          (transientItem) =>
            transientItem.id !==
            item.id,
        ),
        newTransientItem,
      ],
    )

    setFocusedItemId(
      newTransientItem.id,
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
        autoFocus={
          item.id ===
          focusedItemId
        }
        onHeightChange={
          onHeightChange
        }
        onCommit={
          commitItem
        }
        onDiscardEmpty={
          discardEmpty
        }
        onCreateAfter={
          createAfter
        }
      />
    )
  }

  return (
    <div className="journal-field">
      <div
        className={
          isBlock
            ? 'journal-field-first-row block'
            : 'journal-field-first-row inline'
        }
      >
        <strong
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

      {remainingItems.length >
        0 && (
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