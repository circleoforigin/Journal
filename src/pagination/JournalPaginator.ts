import type {
  JournalEntry,
} from '../models/JournalEntry'

import type {
  JournalFieldDefinition,
} from '../models/JournalFieldDefinition'

import type {
  JournalFieldItem,
} from '../models/JournalField'

import {
  resolveJournalItemText,
} from './JournalTextResolver'

import type {
  JournalTextResolverOptions,
} from './JournalTextResolver'

import type {
  JournalRenderableTextRun,
} from './JournalRenderableText'

import type {
  JournalEntryPagination,
  JournalItemFragment,
  JournalPageLayout,
} from './JournalPagination'

export interface JournalPaginationMetrics {
  pageWidth: number
  pageHeight: number

  firstPageReservedHeight: number

  fieldGap: number
  itemGap: number

  measureText: (
    text: string,
    fontFamily: string,
    fontSize: number,
  ) => number

  getLineHeight: (
    fontFamily: string,
    fontSize: number,
  ) => number
}

interface RunSlice {
  startOffset: number
  endOffset: number
  lineCount: number
}

function createPage(
  pageIndex: number,
): JournalPageLayout {
  return {
    pageIndex,
    fragments: [],
  }
}

function getItemText(
  item: JournalFieldItem,
) {
  return typeof item.value ===
    'string'
    ? item.value
    : String(
        item.value ?? '',
      )
}

function findRunSlice(
  run: JournalRenderableTextRun,
  availableWidth: number,
  availableHeight: number,
  metrics:
    JournalPaginationMetrics,
): RunSlice {
  const lineHeight =
    metrics.getLineHeight(
      run.fontFamily,
      run.fontSize,
    )

  const availableLines =
    Math.floor(
      availableHeight /
      lineHeight,
    )

  if (
    availableLines <= 0 ||
    !run.text
  ) {
    return {
      startOffset: 0,
      endOffset: 0,
      lineCount: 0,
    }
  }

  let offset = 0
  let lineStart = 0
  let linesUsed = 1

  let lastBreakOffset = 0

  while (
    offset <
    run.text.length
  ) {
    const character =
      run.text[offset]

    if (
      character === ' ' ||
      character === '\t' ||
      character === '-' ||
      character === '\n'
    ) {
      lastBreakOffset =
        offset + 1
    }

    if (
      character === '\n'
    ) {
      if (
        linesUsed >=
        availableLines
      ) {
        return {
          startOffset: 0,

          endOffset:
            lastBreakOffset ||
            offset,

          lineCount:
            linesUsed,
        }
      }

      linesUsed += 1
      offset += 1
      lineStart = offset
      lastBreakOffset = offset

      continue
    }

    const candidate =
      run.text.slice(
        lineStart,
        offset + 1,
      )

    const width =
      metrics.measureText(
        candidate,
        run.fontFamily,
        run.fontSize,
      )

    if (
      width >
      availableWidth
    ) {
      if (
        linesUsed >=
        availableLines
      ) {
        const preferredBreak =
          lastBreakOffset >
          lineStart
            ? lastBreakOffset
            : offset

        return {
          startOffset: 0,

          endOffset:
            Math.max(
              preferredBreak,
              1,
            ),

          lineCount:
            linesUsed,
        }
      }

      linesUsed += 1

      if (
        lastBreakOffset >
        lineStart
      ) {
        lineStart =
          lastBreakOffset
      } else {
        lineStart =
          offset
      }
    }

    offset += 1
  }

  return {
    startOffset: 0,

    endOffset:
      run.text.length,

    lineCount:
      linesUsed,
  }
}

export function paginateJournalEntry(
  entry: JournalEntry,
  fieldDefinitions:
    JournalFieldDefinition[],
  resolverOptions:
    JournalTextResolverOptions,
  metrics:
    JournalPaginationMetrics,
): JournalEntryPagination {
  const pages:
    JournalPageLayout[] = [
      createPage(0),
    ]

  let currentPage =
    pages[0]

  let usedHeight = metrics.firstPageReservedHeight

  const titleDefinition =
  fieldDefinitions.find(
    (definition) =>
      definition.isSystem &&
      definition.name ===
        'Title',
  )

const titleItem =
  titleDefinition
    ? entry.fields[
        titleDefinition.id
      ]?.items[0]
    : undefined

const titleValue =
  titleItem?.value

const titleText =
  typeof titleValue ===
    'string' &&
  titleValue.trim()
    ? titleValue
    : 'New Entry'

currentPage.fragments.push({
  type: 'entryTitle',
  entryId: entry.id,
  text: titleText,
})

  function nextPage() {
    currentPage =
      createPage(
        pages.length,
      )

    pages.push(
      currentPage,
    )

    usedHeight = 0
  }

  const normalLineHeight =
    metrics.getLineHeight(
      resolverOptions
        .readability
        .fontFamily,

      resolverOptions
        .readability
        .fontSize,
    )

  const orderedFields =
    fieldDefinitions
      .filter(
        (definition) =>
          !definition.isSystem &&
          entry.fields[
            definition.id
          ],
      )
      .sort(
        (left, right) =>
          left.order -
          right.order,
      )

  for (
    const fieldDefinition
    of orderedFields
  ) {
    const field =
      entry.fields[
        fieldDefinition.id
      ]

    if (!field) {
      continue
    }

    if (
      usedHeight > 0 &&
      usedHeight +
        normalLineHeight >
        metrics.pageHeight
    ) {
      nextPage()
    }

    currentPage.fragments.push({
      type: 'fieldStart',

      fieldDefinitionId:
        fieldDefinition.id,

      fieldDefinition,
    })

    usedHeight +=
      normalLineHeight

    const items =
  [...field.items].sort(
    (left, right) => {
      if (
        left.source !==
        right.source
      ) {
        return left.source ===
          'master'
          ? -1
          : 1
      }

      return (
        left.order -
        right.order
      )
    },
  )

    for (
      let itemIndex = 0;
      itemIndex <
      items.length;
      itemIndex += 1
    ) {
      const item =
        items[itemIndex]

      const rawItemText =
        getItemText(item)

      if (
        !rawItemText.trim()
      ) {
        continue
      }

      if (
        itemIndex > 0
      ) {
        usedHeight +=
          metrics.itemGap
      }

      const renderableItem =
        resolveJournalItemText(
          fieldDefinition.id,
          item,
          resolverOptions,
        )

      for (
        const run
        of renderableItem.runs
      ) {
        let remainingText =
          run.text

        let runOffset = 0

        while (
          remainingText.length >
          0
        ) {
          const availableHeight =
            metrics.pageHeight -
            usedHeight

          const workingRun:
            JournalRenderableTextRun = {
            ...run,
            text:
              remainingText,
          }

          const slice =
            findRunSlice(
              workingRun,
              metrics.pageWidth,
              availableHeight,
              metrics,
            )

          if (
            slice.endOffset <= 0
          ) {
            nextPage()
            continue
          }

          const fragmentText =
            remainingText.slice(
              slice.startOffset,
              slice.endOffset,
            )

          const fragment:
            JournalItemFragment = {
            type: 'item',

            fieldDefinitionId:
              fieldDefinition.id,

            itemId:
              item.id,

            runId:
              run.id,

            text:
              fragmentText,

            fontFamily:
              run.fontFamily,

            fontSize:
              run.fontSize,

            sourceType:
              run.sourceType,

            languageId:
              run.languageId,

            translated:
              run.translated,

            startOffset:
              runOffset,

            endOffset:
              runOffset +
              fragmentText.length,

            isFirstFragment:
              runOffset === 0,

            isLastFragment:
              slice.endOffset ===
              remainingText.length,

            item,
          }

          currentPage
            .fragments
            .push(
              fragment,
            )

          const lineHeight =
            metrics.getLineHeight(
              run.fontFamily,
              run.fontSize,
            )

          usedHeight +=
            slice.lineCount *
            lineHeight

          runOffset +=
            fragmentText.length

          remainingText =
            remainingText.slice(
              slice.endOffset,
            )

          if (
            remainingText.length >
            0
          ) {
            nextPage()
          }
        }
      }
    }

    usedHeight +=
      metrics.fieldGap
  }

  return {
    entryId:
      entry.id,

    pages,
  }
}