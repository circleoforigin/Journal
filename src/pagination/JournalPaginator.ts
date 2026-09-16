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

function createPage(
  pageIndex: number,
): JournalPageLayout {
  return {
    pageIndex,
    fragments: [],
  }
}

interface MeasuredLine {
  text: string
  endsParagraph: boolean
}

function measureBrowserLines(
  text: string,
  width: number,
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  fontWeight = '400',
  justify = false,
): MeasuredLine[] {
  const container =
    document.createElement('div')

  container.style.position =
    'absolute'
  container.style.visibility =
    'hidden'
  container.style.pointerEvents =
    'none'
  container.style.left =
    '-100000px'
  container.style.top =
    '0'

  container.style.width =
    `${width}px`

  container.style.fontFamily =
    fontFamily
  container.style.fontSize =
    `${fontSize}px`
  container.style.lineHeight =
    `${lineHeight}px`
  container.style.fontWeight =
    fontWeight

  container.style.whiteSpace =
    'pre-wrap'
  container.style.overflowWrap =
    'break-word'
  container.style.tabSize =
    '4'

  if (justify) {
    container.style.textAlign =
      'justify'
  }

  const textNode =
    document.createTextNode(text)

  container.appendChild(textNode)
  document.body.appendChild(container)

  const lines: MeasuredLine[] = []

  let lineStart = 0
  let previousTop:
    number | null = null

  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    const range =
      document.createRange()

    range.setStart(
      textNode,
      index,
    )

    range.setEnd(
      textNode,
      index + 1,
    )

    const rect =
      range.getBoundingClientRect()

    const currentTop =
      Math.round(rect.top)

    if (
      previousTop !== null &&
      currentTop !== previousTop
    ) {
      const lineText =
        text.slice(
          lineStart,
          index,
        )

      lines.push({
        text:
          lineText.replace(
            /\n$/,
            '',
          ),
        endsParagraph:
          lineText.endsWith(
            '\n',
          ),
      })

      lineStart =
        index
    }

    previousTop =
      currentTop
  }

  if (
    lineStart < text.length
  ) {
    const lineText =
      text.slice(lineStart)

    lines.push({
      text:
        lineText.replace(
          /\n$/,
          '',
        ),
      endsParagraph:
        lineText.endsWith(
          '\n',
        ),
    })
  }

  if (lines.length === 0) {
    lines.push({
      text: '',
      endsParagraph: true,
    })
  }

  container.remove()

  return lines
}

export function paginateJournalDocument(
  journalDocument:
    JournalDocument,
  metrics:
    JournalPaginationMetrics,
): JournalPaginationResult 
{
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
    

    const lines = measureBrowserLines(
        block.text,
        metrics.pageWidth,
        metrics.fontFamily,
        fontSize,
        lineHeight,
        fontWeight,
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

    const lines = measureBrowserLines(
        block.text,
        metrics.pageWidth,
        metrics.fontFamily,
        metrics.fontSize,
        metrics.lineHeight,
        '400',
        true,
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