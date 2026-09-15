import type { RefObject } from 'react'

import type {
  JournalPageLayout,
} from '../pagination/JournalPagination'

interface JournalPageProps {
  page:
    JournalPageLayout | null

  pageNumber: number

  side:
    | 'left'
    | 'right'

  contentRef?:
    RefObject<HTMLDivElement | null>
}

export function JournalPage({
  page,
  pageNumber,
  side,
  contentRef,
}: JournalPageProps) {
  return (
    <div
      className={
        `journal-page journal-page-${side}`
      }
    >
      <div
        ref={contentRef}
        className="journal-page-content"
      >
        {page?.fragments.map(
          (
            fragment,
            index,
          ) => {
            if (
              fragment.type ===
              'fieldStart'
            ) {
              return (
                <div
                  key={
                    `field:${fragment.fieldDefinitionId}:${index}`
                  }
                  className="journal-page-field-label"
                >
                  {
                    fragment
                      .fieldDefinition
                      .name
                  }
                </div>
              )
            }

            return (
              <span
                key={
                  `${fragment.itemId}:${fragment.runId}:${fragment.startOffset}:${index}`
                }
                className={
                  fragment.sourceType ===
                  'language'
                    ? 'journal-page-text-run journal-page-language-run'
                    : 'journal-page-text-run'
                }
                style={{
                  fontFamily:
                    fragment.fontFamily,

                  fontSize:
                    `${fragment.fontSize}px`,
                }}
                data-item-id={
                  fragment.itemId
                }
                data-run-id={
                  fragment.runId
                }
              >
                {fragment.text}
              </span>
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