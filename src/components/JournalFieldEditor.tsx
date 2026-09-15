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

  onFocus?: () => void

  onBlurred?: (
    value: string,
  ) => void

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
  onFocus,
  onBlurred,
  onCommit,
  onCreateAfter,
  onDiscardEmpty,
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

    textarea.style.height =
      `${textarea.scrollHeight}px`
  }

  useLayoutEffect(() => {
  const frame =
    requestAnimationFrame(() => {
      resizeTextarea()
    })

  return () => {
    cancelAnimationFrame(
      frame,
    )
  }
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
      onFocus={() => {
        onFocus?.()
      }}
      onBlur={() => {
        commit()

        onBlurred?.(
          draft,
        )
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
    firstItemInline,
    setFirstItemInline,
  ] = useState(false)

  const fieldRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const labelMeasureRef =
    useRef<HTMLSpanElement | null>(
      null,
    )

  const valueMeasureRef =
    useRef<HTMLSpanElement | null>(
      null,
    )

  const emptyFieldItemRef =
    useRef<
      JournalFieldItem | null
    >(null)

  const sortedItems =
    [...items].sort(
      (left, right) =>
        left.order -
        right.order,
    )

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

  function evaluateFirstItemInline(
    value: string,
  ) {
    const field =
      fieldRef.current

    const label =
      labelMeasureRef.current

    const valueMeasure =
      valueMeasureRef.current

    if (
      !field ||
      !label ||
      !valueMeasure
    ) {
      setFirstItemInline(false)

      return
    }

    /*
     * An intentional line break means
     * this Item is inherently multiline.
     */
    if (value.includes('\n')) {
      setFirstItemInline(false)

      return
    }

    valueMeasure.textContent =
      value || ' '

    const availableWidth =
      field.clientWidth

    const requiredWidth =
      label.scrollWidth +
      4 +
      valueMeasure.scrollWidth

    setFirstItemInline(
      requiredWidth <=
        availableWidth,
    )
  }

  /*
   * Reevaluate whenever a different
   * persisted Item becomes Item 0.
   *
   * New/transient Items deliberately
   * remain block until they lose focus.
   */
  useLayoutEffect(() => {
    if (!firstItem) {
      setFirstItemInline(false)

      return
    }

    const isTransientFirst =
      transientItems.some(
        (transientItem) =>
          transientItem.id ===
          firstItem.id,
      ) ||
      emptyFieldItemRef
        .current?.id ===
        firstItem.id

    if (isTransientFirst) {
      setFirstItemInline(false)

      return
    }

    if (
      focusedItemId ===
      firstItem.id
    ) {
      setFirstItemInline(false)

      return
    }

    evaluateFirstItemInline(
      getStringValue(firstItem),
    )
  }, [
    firstItem?.id,
  ])

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
      [...baseItems].sort(
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
    isFirstItem = false,
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
        onFocus={() => {
          setFocusedItemId(
            item.id,
          )

          if (isFirstItem) {
            /*
             * Editing Item 0 always
             * happens beneath the label.
             */
            setFirstItemInline(
              false,
            )
          }
        }}
        onBlurred={(value) => {
          setFocusedItemId(
            (current) =>
              current === item.id
                ? null
                : current,
          )

          if (isFirstItem) {
            /*
             * Only after editing finishes
             * do we decide whether Item 0
             * is short enough to display
             * beside its Field label.
             */
            evaluateFirstItemInline(
              value,
            )
          }
        }}
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
        ref={fieldRef}
        className={
          firstItemInline
            ? 'journal-field-first-row inline'
            : 'journal-field-first-row block'
        }
      >
        <strong
          className="journal-entry-field-label"
        >
          {fieldDefinition.name}
          {firstItemInline && ' -'}
        </strong>

        {renderItem(
          firstItem,
          'journal-field-first-item',
          true,
        )}
      </div>

      <span
        ref={labelMeasureRef}
        className="journal-field-measure"
        aria-hidden="true"
      >
        {fieldDefinition.name} -
      </span>

      <span
        ref={valueMeasureRef}
        className="journal-field-measure"
        aria-hidden="true"
      />

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