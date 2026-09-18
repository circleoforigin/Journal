import type {
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

  onMoveItem: (
    entryId: string,
    fieldDefinitionId: string,
    itemId: string,
    direction: 'up' | 'down',
  ) => void
}

export function JournalPage({
  page,
  pageNumber,
  contentRef,
  fontFamily,
  fontSize,
  titleFontSize,
  titleLineHeight,
  searchHighlight,
  showEditNode,
  onAddItem,
  onEditItem,
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
    <div className="journal-page">
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
                >
                  {nodeVisible && (
                    <button
                      type="button"
                      className="journal-page-item-node journal-page-title-node"
                      aria-label="Edit entry title"
                      onClick={() =>
                        onEditItem(
                          fragment.entryId,
                          fragment.fieldDefinitionId,
                          fragment.itemId,
                        )
                      }
                    />
                  )}

                  {renderText(
                    fragment.text,
                    index,
                  )}
                </div>
              )
            }

            if (
              fragment.type ===
              'field'
            ) {
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

            if (
              fragment.type ===
              'addItem'
            ) {
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
                  <span>+</span>
                </button>
              )
            }

            const nodeVisible =
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
                {nodeVisible && (
                  <div
                    className="journal-page-item-controls"
                    style={
                      fragment.inline
                        ? {
                            left:
                              'auto',

                            right:
                              `calc(100% + ${
                                (
                                  fragment.left ??
                                  0
                                ) +
                                12
                              }px)`,
                          }
                        : undefined
                    }
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
                      className="journal-page-item-node"
                      aria-label="Edit field item"
                      onClick={() =>
                        onEditItem(
                          fragment.entryId,
                          fragment.fieldDefinitionId,
                          fragment.itemId,
                        )
                      }
                    />

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
                        paragraph
                          .text.length

                      if (
                        paragraphIndex <
                        fragment
                          .paragraphs
                          .length -
                          1
                      ) {
                        paragraphOffset +=
                          1
                      }

                      return (
                        <div
                          key={
                            paragraphIndex
                          }
                          style={{
                            margin: 0,
                            padding: 0,

                            textIndent:
                              paragraph
                                .indented
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