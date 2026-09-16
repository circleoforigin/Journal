import type {
  RefObject,
} from 'react'

import type {
  JournalPageLayout,
} from '../pagination/JournalPagination'

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
  showEditNode: (
    source: 'master' | 'user',
  ) => boolean
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
  showEditNode,
  onEditItem,
  onMoveItem,
}: JournalPageProps) {
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
        fontSize: titleFontSize,
        lineHeight:`${titleLineHeight}px`,
      }}
    >
      {nodeVisible && (
  <div className="journal-page-item-controls">
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

      {fragment.text}
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
                  {fragment.text}
                </div>
              )
            }

            const nodeVisible =
              showEditNode(
                fragment.source,
              )

            return (
              <div
                key={`item-${fragment.itemId}-${index}`}
                className="journal-page-item-fragment"
                style={{
                  top:
                    fragment.top,
                  height:
                    fragment.height,
                }}
              >
                {nodeVisible && (
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
                )}

                <div
  className="journal-page-item-text"
>
  {fragment.paragraphs.map(
    (
      paragraph,
      paragraphIndex,
    ) => (
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
        {paragraph.text ||
          '\u00a0'}
      </div>
    ),
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