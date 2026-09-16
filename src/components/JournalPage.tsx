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
                  {fragment.text}
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