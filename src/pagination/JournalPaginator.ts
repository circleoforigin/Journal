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
  paragraphIndex: number
  firstLineOfParagraph: boolean
  indented: boolean
  endsParagraph: boolean
}

const PARAGRAPH_INDENT_EM = 2

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

  document.body.appendChild(
    container,
  )

  const lines: MeasuredLine[] = []

  const paragraphs =
    text.split('\n')

  paragraphs.forEach(
    (
      storedParagraph,
      paragraphIndex,
    ) => {
      const indented =
        storedParagraph.startsWith(
          '\t',
        )

      const paragraphText =
        indented
          ? storedParagraph.slice(1)
          : storedParagraph

      const paragraph =
        document.createElement('div')

      paragraph.style.margin = '0'
      paragraph.style.padding = '0'
      paragraph.style.width = '100%'
      paragraph.style.boxSizing =
        'border-box'

      paragraph.style.fontFamily =
        fontFamily
      paragraph.style.fontSize =
        `${fontSize}px`
      paragraph.style.lineHeight =
        `${lineHeight}px`
      paragraph.style.fontWeight =
        fontWeight

      paragraph.style.whiteSpace =
        'pre-wrap'
      paragraph.style.overflowWrap =
        'break-word'
      paragraph.style.tabSize =
        '4'

      if (justify) {
        paragraph.style.textAlign =
          'justify'
      }

      if (indented) {
        paragraph.style.textIndent =
          `${PARAGRAPH_INDENT_EM}em`
      }

      /*
       * An empty paragraph still
       * occupies one physical line.
       */
      if (paragraphText.length === 0) {
        paragraph.textContent =
          '\u00a0'

        container.appendChild(
          paragraph,
        )

        lines.push({
          text: '',
          paragraphIndex,
          firstLineOfParagraph: true,
          indented,
          endsParagraph: true,
        })

        return
      }

      const textNode =
        document.createTextNode(
          paragraphText,
        )

      paragraph.appendChild(
        textNode,
      )

      container.appendChild(
        paragraph,
      )

      let lineStart = 0
      let previousTop:
        number | null = null

      for (
        let index = 0;
        index <
        paragraphText.length;
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
          lines.push({
            text:
              paragraphText.slice(
                lineStart,
                index,
              ),
            paragraphIndex,
            firstLineOfParagraph:
              lineStart === 0,
            indented,
            endsParagraph: false,
          })

          lineStart = index
        }

        previousTop =
          currentTop
      }

      lines.push({
        text:
          paragraphText.slice(
            lineStart,
          ),
        paragraphIndex,
        firstLineOfParagraph:
          lineStart === 0,
        indented,
        endsParagraph: true,
      })
    },
  )

  container.remove()

  return lines.length > 0
    ? lines
    : [
        {
          text: '',
          paragraphIndex: 0,
          firstLineOfParagraph: true,
          indented: false,
          endsParagraph: true,
        },
      ]
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
    Exclude<
        JournalDocumentBlock,
        { type: 'item' | 'addItem' }
    >,
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
  const lines =
    measureBrowserLines(
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
    lineIndex < lines.length
  ) {
    const remainingHeight =
      metrics.pageHeight -
      usedHeight

    const linesThatFit =
      Math.floor(
        remainingHeight /
          metrics.lineHeight,
      )

    if (linesThatFit <= 0) {
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

    const paragraphs:
      {
        text: string
        indented: boolean
      }[] = []

    for (
      const line
      of fragmentLines
    ) {
      const previous =
        paragraphs[
          paragraphs.length - 1
        ]

      /*
       * Continue the same paragraph
       * when this is merely another
       * browser-wrapped physical line.
       *
       * We do NOT insert a newline
       * between those lines.
       */
      if (
        previous &&
        !line.firstLineOfParagraph
      ) {
        previous.text +=
          line.text
      } else {
        paragraphs.push({
          text: line.text,
          indented:
            line.indented &&
            line.firstLineOfParagraph,
        })
      }
    }

    const fragmentText =
      paragraphs
        .map(
          (paragraph) =>
            paragraph.text,
        )
        .join('\n')

    currentPage.fragments.push({
      ...block,
      text: fragmentText,
      paragraphs,
      top: usedHeight,
      height: fragmentHeight,
    })

    usedHeight +=
      fragmentHeight

    lineIndex +=
      fragmentLines.length

    if (
      lineIndex < lines.length
    ) {
      startNextPage()
    }
  }

  usedHeight +=
    metrics.itemBottomGap

      usedHeight +=
    metrics.itemBottomGap
  }

  const addItemTarget = (
  block:
    Extract<
      JournalDocumentBlock,
      { type: 'addItem' }
    >,
) => {
  const targetHeight =
    metrics.lineHeight / 2

  ensureHeight(
    targetHeight,
  )

  currentPage.fragments.push({
    ...block,
    top: usedHeight,
    height: targetHeight,
  })

  usedHeight +=
    targetHeight
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

      case 'addItem':
        addItemTarget(
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