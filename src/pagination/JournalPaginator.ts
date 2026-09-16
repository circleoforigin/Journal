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
  endsParagraph: boolean
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

  const tabText = '    '

  for (
    let paragraphIndex = 0;
    paragraphIndex <
    paragraphs.length;
    paragraphIndex += 1
  ) {
    const paragraph =
      paragraphs[
        paragraphIndex
      ].replace(
        /\t/g,
        tabText,
      )

    if (!paragraph) {
      lines.push({
        text: '',
        endsParagraph: true,
      })

      continue
    }

    const tokens =
      paragraph.match(
        /[ ]+|[^ ]+/g,
      ) ?? []

    let currentLine = ''

    for (const token of tokens) {
      const candidate =
        currentLine + token

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
          endsParagraph: false,
        })

        currentLine = ''
      }

      /*
       * If the token is only
       * whitespace, preserve it
       * at the beginning of the
       * next physical line.
       */
      if (/^ +$/.test(token)) {
        currentLine =
          token

        continue
      }

      /*
       * Normal word that fits by
       * itself starts the next
       * physical line.
       */
      if (
        context.measureText(
          token,
        ).width <= maxWidth
      ) {
        currentLine =
          token

        continue
      }

      /*
       * Extremely long unbroken
       * text is split character
       * by character so it cannot
       * overflow the page.
       */
      let segment = ''

      for (const character of token) {
        const segmentCandidate =
          segment +
          character

        if (
          segment &&
          context.measureText(
            segmentCandidate,
          ).width > maxWidth
        ) {
          lines.push({
            text: segment,
            endsParagraph: false,
          })

          segment =
            character
        } else {
          segment =
            segmentCandidate
        }
      }

      currentLine =
        segment
    }

    if (
      currentLine !== ''
    ) {
      lines.push({
        text: currentLine,
        endsParagraph: false,
      })
    }

    if (lines.length > 0) {
        lines[
            lines.length - 1
        ].endsParagraph = true
}
  }

  return lines.length
    ? lines
   : [{
        text: '',
        endsParagraph: true,
    }]
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
        line.text +
        (
          line.endsParagraph
            ? '\n'
            : ''
        ),
    )
    .join('')
    .replace(/\n$/, '')

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
        line.text +
        (
          line.endsParagraph
            ? '\n'
            : ''
        ),
    )
    .join('')
    .replace(/\n$/, ''),
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