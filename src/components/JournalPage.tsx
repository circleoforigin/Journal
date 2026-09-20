import {
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import type {
  ReactNode,
  RefObject,
} from 'react'

import type {
  JournalPageLayout,
  JournalPageTextRun,
} from '../pagination/JournalPagination'

interface JournalSearchHighlight {
  fragmentIndex: number
  start: number
  end: number
}

interface JournalPageProps {
  page:
    JournalPageLayout | undefined
  pageNumber: number
  pageSide: 'left' | 'right'
  readOnly: boolean
  contentRef?:
    RefObject<HTMLDivElement | null>
  fontFamily: string
  fontSize: number
  titleFontSize: number
  titleLineHeight: number

  searchHighlight:
    JournalSearchHighlight | null

  showEditNode: (
    source: 'master' | 'user',
  ) => boolean

  onAddItem: (
    entryId: string,
    fieldDefinitionId: string,
    afterItemId: string,
  ) => void

  onEditItem: (
    entryId: string,
    fieldDefinitionId: string,
    itemId: string,
  ) => void

  onDeleteItem: (
    entryId: string,
    fieldDefinitionId: string,
    itemId: string,
  ) => void

  onMoveItem: (
    entryId: string,
    fieldDefinitionId: string,
    itemId: string,
    direction: 'up' | 'down',
  ) => void
}

interface InlineItemTargetProps {
  children: ReactNode
  editable: boolean
  onEdit: () => void
  onDelete: () => void
}

function InlineItemTarget({
  children,
  editable,
  onEdit,
  onDelete,
}: InlineItemTargetProps) {
  const wrapperRef =
    useRef<HTMLSpanElement>(null)

  const textRef =
    useRef<HTMLSpanElement>(null)

  const [rects, setRects] =
    useState<
      Array<{
        left: number
        top: number
        width: number
        height: number
      }>
    >([])

  useLayoutEffect(() => {
    if (
      !editable ||
      !wrapperRef.current ||
      !textRef.current
    ) {
      setRects([])
      return
    }

    const measure = () => {
      const wrapper =
        wrapperRef.current

      const text =
        textRef.current

      if (!wrapper || !text) {
        return
      }

      const wrapperRect =
        wrapper.getBoundingClientRect()

      const range =
        document.createRange()

      range.selectNodeContents(text)

      const nextRects =
        Array.from(
          range.getClientRects(),
        )
          .filter(
            (rect) =>
              rect.width > 0 &&
              rect.height > 0,
          )
          .map((rect) => ({
            left:
              rect.left -
              wrapperRect.left,
            top:
              rect.top -
              wrapperRect.top,
            width: rect.width,
            height: rect.height,
          }))

      setRects(nextRects)
    }

    measure()

    const resizeObserver =
      new ResizeObserver(measure)

    resizeObserver.observe(
      wrapperRef.current,
    )

    window.addEventListener(
      'resize',
      measure,
    )

    return () => {
      resizeObserver.disconnect()

      window.removeEventListener(
        'resize',
        measure,
      )
    }
  }, [children, editable])

  return (
    <span
      ref={wrapperRef}
      className="journal-page-inline-item-wrapper"
    >
      <span
        ref={textRef}
        className="journal-page-inline-item-text"
      >
        {children}
      </span>

      {editable &&
        rects.map((rect, index) => (
          <button
            key={index}
            type="button"
            className="journal-page-inline-item-target"
            aria-label="Edit field item"
            style={{
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            }}
            onClick={(event) => {
              if (event.shiftKey) {
                onDelete()
                return
              }

              onEdit()
            }}
          />
        ))}
    </span>
  )
}

export function JournalPage({
  page,
  pageNumber,
  pageSide,
  readOnly,
  contentRef,
  fontFamily,
  fontSize,
  titleFontSize,
  titleLineHeight,
  searchHighlight,
  showEditNode,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onMoveItem,
}: JournalPageProps) {
  function renderText(
    text: string,
    fragmentIndex: number,
    textOffset = 0,
  ) {
    if (
      !searchHighlight ||
      searchHighlight
        .fragmentIndex !==
        fragmentIndex
    ) {
      return text || '\u00a0'
    }

    const localStart =
      searchHighlight.start -
      textOffset

    const localEnd =
      searchHighlight.end -
      textOffset

    if (
      localEnd <= 0 ||
      localStart >= text.length
    ) {
      return text || '\u00a0'
    }

    const start =
      Math.max(
        0,
        localStart,
      )

    const end =
      Math.min(
        text.length,
        localEnd,
      )

    return (
      <>
        {text.slice(
          0,
          start,
        )}

        <mark className="journal-search-highlight">
          {text.slice(
            start,
            end,
          )}
        </mark>

        {text.slice(end)}
      </>
    )
  }

  function renderFormattedText(
  runs: JournalPageTextRun[],
  fragmentIndex: number,
  textOffset = 0,
) {
  if (runs.length === 0) {
    return '\u00a0'
  }

  let runOffset = 0

  return runs.map(
    (run, runIndex) => {
      const runStart =
        runOffset

      const runEnd =
        runStart +
        run.text.length

      runOffset =
        runEnd

      const style = {
        fontWeight:
          run.bold
            ? 700
            : undefined,

        fontStyle:
          run.italic
            ? 'italic'
            : undefined,

        textDecoration:
          run.underline
            ? 'underline'
            : undefined,
      }

      const highlightStart =
        searchHighlight &&
        searchHighlight
          .fragmentIndex ===
          fragmentIndex
          ? Math.max(
              runStart,
              searchHighlight.start -
                textOffset,
            )
          : runEnd

      const highlightEnd =
        searchHighlight &&
        searchHighlight
          .fragmentIndex ===
          fragmentIndex
          ? Math.min(
              runEnd,
              searchHighlight.end -
                textOffset,
            )
          : runStart

      if (
        highlightStart >=
        highlightEnd
      ) {
        return (
          <span
            key={runIndex}
            style={style}
          >
            {run.text}
          </span>
        )
      }

      const localStart =
        highlightStart -
        runStart

      const localEnd =
        highlightEnd -
        runStart

      return (
        <span
          key={runIndex}
          style={style}
        >
          {run.text.slice(
            0,
            localStart,
          )}

          <mark className="journal-search-highlight">
            {run.text.slice(
              localStart,
              localEnd,
            )}
          </mark>

          {run.text.slice(
            localEnd,
          )}
        </span>
      )
    },
  )
}

  return (
  <div
    className={`journal-page ${pageSide}-page`}
  >
    <div className="journal-page-inner-gutter" />
      <div
        ref={contentRef}
        className="journal-page-content"
        style={{
          fontFamily,
          fontSize,
        }}
      >
        {page?.fragments.map(
          (fragment, index) => {
            if (
              fragment.type ===
              'title'
            ) {
              const nodeVisible =
                !readOnly &&
                showEditNode(
                  fragment.source,
                )

              return (
                <div
                  key={`title-${fragment.itemId}-${index}`}
                  className="journal-page-entry-title"
                  style={{
                    top:
                      fragment.top,

                    height:
                      fragment.height,

                    fontSize:
                      titleFontSize,

                    lineHeight:
                      `${titleLineHeight}px`,
                  }}
                  role={nodeVisible ? 'button' : undefined}
                  tabIndex={nodeVisible ? 0 : undefined}
                  onClick={nodeVisible ? () => onEditItem(
                    fragment.entryId,
                    fragment.fieldDefinitionId,
                    fragment.itemId,
                  ) : undefined}
                >
                  {renderText(
                    fragment.text,
                    index,
                  )}
                </div>
              )
            }

            if (
  fragment.type ===
  'subtitle'
) {
  return (
    <div
      key={`subtitle-${fragment.itemId}-${index}`}
      className="journal-page-entry-subtitle"
      style={{
        top:
          fragment.top,

        height:
          fragment.height,

        lineHeight:
          `${fragment.height}px`,
      }}
      role={!readOnly ? 'button' : undefined}
      tabIndex={!readOnly ? 0 : undefined}
      onClick={!readOnly ? () => onEditItem(
        fragment.entryId,
        fragment.fieldDefinitionId,
        fragment.itemId,
      ) : undefined}
    >
      {renderText(
        fragment.text,
        index,
      )}
    </div>
  )
}

if (
  fragment.type ===
  'brief'
) {
  return (
    <div
      key={`brief-${fragment.itemId}-${index}`}
      className="journal-page-entry-brief"
      style={{
        top:
          fragment.top,

        height:
          fragment.height,
      }}
      role={!readOnly ? 'button' : undefined}
      tabIndex={!readOnly ? 0 : undefined}
      onClick={!readOnly ? () => onEditItem(
        fragment.entryId,
        fragment.fieldDefinitionId,
        fragment.itemId,
      ) : undefined}
    >
      {renderText(
        fragment.text,
        index,
      )}
    </div>
  )
}

            if (fragment.type === 'field')
              {
              return (
                <div
                  key={`field-${fragment.fieldDefinitionId}-${index}`}
                  className="journal-page-field-label"
                  style={{
                    top:
                      fragment.top,

                    height:
                      fragment.height,
                  }}
                >
                  {renderText(
                    fragment.text,
                    index,
                  )}
                </div>
              )
            }

            if (fragment.type === 'inlineField') {
  let textOffset = fragment.label.length + 3

  return (
    <div
      key={`inline-${fragment.fieldDefinitionId}-${index}`}
      className="journal-page-inline-field"
      style={{
        top: fragment.top,
        height: fragment.height,
      }}
    >
      <strong>{fragment.label} - </strong>

      {fragment.items.map((item, itemIndex) => {
        const offset = textOffset
        textOffset += item.text.length + 2

        const editable =
          !readOnly &&
          showEditNode(item.source)

        return (
  <span key={item.itemId}>
    <InlineItemTarget
      editable={editable}
      onEdit={() =>
        onEditItem(
          fragment.entryId,
          fragment.fieldDefinitionId,
          item.itemId,
        )
      }
      onDelete={() =>
        onDeleteItem(
          fragment.entryId,
          fragment.fieldDefinitionId,
          item.itemId,
        )
      }
    >
      {renderFormattedText(
        item.runs,
        index,
        offset,
      )}
    </InlineItemTarget>

    {itemIndex <
    fragment.items.length - 1
      ? ', '
      : ''}
  </span>
)
      })}
    </div>
  )
}

            if (
              fragment.type === 'addItem'
            ) {
              if (readOnly) {
                return null
              }
              return (
                <button
                  key={`add-item-${fragment.fieldDefinitionId}-${index}`}
                  type="button"
                  className="journal-page-add-item"
                  style={{
                    top:
                      fragment.top,

                    height:
                      fragment.height,
                  }}
                  aria-label="Add field item"
                  onClick={() =>
                    onAddItem(
                      fragment.entryId,
                      fragment.fieldDefinitionId,
                      fragment.afterItemId,
                    )
                  }
                >
                  <span>+ Add Item</span>
                </button>
              )
            }

            const nodeVisible =
              !readOnly &&
              showEditNode(
                fragment.source,
              )

            let paragraphOffset = 0

            return (
              <div
                key={`item-${fragment.itemId}-${index}`}
                className={
                  fragment.inline
                    ? 'journal-page-item-fragment inline'
                    : 'journal-page-item-fragment'
                }
                style={{
                  top:
                    fragment.top,

                  height:
                    fragment.height,

                  left:
                    fragment.left ??
                    0,

                  width:
                    fragment.width ??
                    '100%',
                }}
              >
                {nodeVisible && fragment.presentation === 'multiple' && (
                  <div
                    className="journal-page-item-controls"
                  >
                    <button
                      type="button"
                      className="journal-page-item-move journal-page-item-move-up"
                      aria-label="Move field item up"
                      onClick={() =>
                        onMoveItem(
                          fragment.entryId,
                          fragment.fieldDefinitionId,
                          fragment.itemId,
                          'up',
                        )
                      }
                    >
                      ▲
                    </button>

                    <button
                      type="button"
                      className="journal-page-item-move journal-page-item-move-down"
                      aria-label="Move field item down"
                      onClick={() =>
                        onMoveItem(
                          fragment.entryId,
                          fragment.fieldDefinitionId,
                          fragment.itemId,
                          'down',
                        )
                      }
                    >
                      ▼
                    </button>
                  </div>
                )}

                <div className="journal-page-item-text">
  {fragment.paragraphs.map(
    (
      paragraph,
      paragraphIndex,
    ) => {
      const currentOffset =
        paragraphOffset

      paragraphOffset +=
        paragraph.text.length

      if (
        paragraphIndex <
        fragment.paragraphs.length - 1
      ) {
        paragraphOffset += 1
      }

      return (
        <div
          key={paragraphIndex}
          style={{
            margin: 0,
            padding: 0,

            textIndent:
              paragraph.indented
                ? '2em'
                : 0,
          }}
        >
          {renderFormattedText(
            paragraph.runs,
            index,
            currentOffset,
          )}
        </div>
      )
    },
  )}
</div>

{nodeVisible && (
  <button
    type="button"
    className="journal-page-item-target"
    aria-label="Edit field item"
    onClick={(event) => {
      if (event.shiftKey) {
        onDeleteItem(
          fragment.entryId,
          fragment.fieldDefinitionId,
          fragment.itemId,
        )
        return
      }

      onEditItem(
        fragment.entryId,
        fragment.fieldDefinitionId,
        fragment.itemId,
      )
    }}
  />
)}
              </div>
            )
          },
        )}
      </div>

      <div className="journal-page-number">
        {pageNumber}
      </div>
    </div>
  )
}
