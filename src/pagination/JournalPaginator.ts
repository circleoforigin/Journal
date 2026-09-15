import type {
  JournalDocument,
  JournalDocumentBlock,
} from './JournalDocument'

import type {
  JournalPageFragment,
  JournalPageLayout,
  JournalPaginationResult,
} from './JournalPagination'

export interface JournalPaginationMetrics {
  pageWidth: number
  pageHeight: number
  fontFamily: string
  fontSize: number
  lineHeight: number
  titleFontSize: number
  titleLineHeight: number
  fieldFontSize: number
  fieldLineHeight: number
  titleBottomGap: number
  fieldTopGap: number
  fieldBottomGap: number
  itemBottomGap: number
}

interface WrappedLine {
  text: string
}

function createPage(
  pageIndex: number,
): JournalPageLayout {
  return {
    pageIndex,
    fragments: [],
  }
}

function createContext():
  CanvasRenderingContext2D {
  const canvas =
    document.createElement('canvas')

  const context =
    canvas.getContext('2d')

  if (!context) {
    throw new Error(
      'Unable to create Journal text measurement context.',
    )
  }

  return context
}

function setFont(
  context:
    CanvasRenderingContext2D,
  fontFamily: string,
  fontSize: number,
  fontWeight = '400',
): void {
  context.font =
    `${fontWeight} ${fontSize}px ${fontFamily}`
}

function wrapText(
  context:
    CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): WrappedLine[] {
  const paragraphs =
    text.split('\n')

  const lines:
    WrappedLine[] = []

  for (
    let paragraphIndex = 0;
    paragraphIndex <
    paragraphs.length;
    paragraphIndex += 1
  ) {
    const paragraph =
      paragraphs[paragraphIndex]

    if (!paragraph) {
      lines.push({
        text: '',
      })
      continue
    }

    const words =
      paragraph.split(/\s+/)

    let currentLine = ''

    for (const word of words) {
      const candidate =
        currentLine
          ? `${currentLine} ${word}`
          : word

      if (
        context.measureText(
          candidate,
        ).width <= maxWidth
      ) {
        currentLine =
          candidate
        continue
      }

      if (currentLine) {
        lines.push({
          text: currentLine,
        })
      }

      currentLine = word
    }

    if (currentLine) {
      lines.push({
        text: currentLine,
      })
    }
  }

  return lines.length
    ? lines
    : [{ text: '' }]
}

export function paginateJournalDocument(
  journalDocument:
    JournalDocument,
  metrics:
    JournalPaginationMetrics,
): JournalPaginationResult {
  const context =
    createContext()

  const pages:
    JournalPageLayout[] = [
      createPage(0),
    ]

  let currentPage =
    pages[0]

  let usedHeight = 0

  const startNextPage = () => {
    currentPage =
      createPage(
        pages.length,
      )

    pages.push(
      currentPage,
    )

    usedHeight = 0
  }

  const ensureHeight = (
    requiredHeight: number,
  ) => {
    if (
      usedHeight > 0 &&
      usedHeight +
        requiredHeight >
        metrics.pageHeight
    ) {
      startNextPage()
    }
  }

  const addSingleBlock = (
    block:
      JournalDocumentBlock,
    fontSize: number,
    lineHeight: number,
    fontWeight: string,
    topGap: number,
    bottomGap: number,
  ) => {
    setFont(
      context,
      metrics.fontFamily,
      fontSize,
      fontWeight,
    )

    const lines =
      wrapText(
        context,
        block.text,
        metrics.pageWidth,
      )

    const blockHeight =
      lines.length *
      lineHeight

    ensureHeight(
      topGap +
        blockHeight +
        bottomGap,
    )

    usedHeight +=
      topGap

    const text =
      lines
        .map(
          (line) =>
            line.text,
        )
        .join('\n')

    const fragment:
      JournalPageFragment = {
        ...block,
        text,
        top: usedHeight,
        height: blockHeight,
      }

    currentPage.fragments.push(
      fragment,
    )

    usedHeight +=
      blockHeight +
      bottomGap
  }

  const addItemBlock = (
    block:
      Extract<
        JournalDocumentBlock,
        { type: 'item' }
      >,
  ) => {
    setFont(
      context,
      metrics.fontFamily,
      metrics.fontSize,
    )

    const lines =
      wrapText(
        context,
        block.text,
        metrics.pageWidth,
      )

    let lineIndex = 0

    while (
      lineIndex <
      lines.length
    ) {
      const remainingHeight =
        metrics.pageHeight -
        usedHeight

      const linesThatFit =
        Math.floor(
          remainingHeight /
            metrics.lineHeight,
        )

      if (
        linesThatFit <= 0
      ) {
        startNextPage()
        continue
      }

      const fragmentLines =
        lines.slice(
          lineIndex,
          lineIndex +
            linesThatFit,
        )

      const fragmentHeight =
        fragmentLines.length *
        metrics.lineHeight

      currentPage.fragments.push({
        ...block,
        text:
          fragmentLines
            .map(
              (line) =>
                line.text,
            )
            .join('\n'),
        top: usedHeight,
        height:
          fragmentHeight,
      })

      usedHeight +=
        fragmentHeight

      lineIndex +=
        fragmentLines.length

      if (
        lineIndex <
        lines.length
      ) {
        startNextPage()
      }
    }

    usedHeight +=
      metrics.itemBottomGap
  }

  for (
    const block
    of journalDocument.blocks
  ) {
    switch (block.type) {
      case 'title':
        addSingleBlock(
          block,
          metrics.titleFontSize,
          metrics.titleLineHeight,
          '600',
          0,
          metrics.titleBottomGap,
        )
        break

      case 'field':
        addSingleBlock(
          block,
          metrics.fieldFontSize,
          metrics.fieldLineHeight,
          '700',
          metrics.fieldTopGap,
          metrics.fieldBottomGap,
        )
        break

      case 'item':
        addItemBlock(
          block,
        )
        break
    }
  }

  if (
    pages.length % 2 !== 0
  ) {
    pages.push(
      createPage(
        pages.length,
      ),
    )
  }

  return {
    pages,
  }
}