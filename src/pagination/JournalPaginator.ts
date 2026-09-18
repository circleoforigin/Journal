import type {
  JournalDocument,
  JournalDocumentBlock,
} from './JournalDocument'

import {
  parseJournalFormatting,
} from './JournalMarkupParser'

import type {
  JournalPageFragment,
  JournalPageLayout,
  JournalPaginationResult,
  JournalPageTextRun,
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
  runs: JournalPageTextRun[]
  paragraphIndex: number
  firstLineOfParagraph: boolean
  indented: boolean
  endsParagraph: boolean
}

const PARAGRAPH_INDENT_EM = 2

function measureBrowserLines(
  storedText: string,
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

  const lines:
    MeasuredLine[] = []

  const storedParagraphs =
    storedText.split('\n')

  storedParagraphs.forEach(
    (
      storedParagraph,
      paragraphIndex,
    ) => {
      const indented =
        storedParagraph.startsWith(
          '\t',
        )

      const paragraphMarkup =
        indented
          ? storedParagraph.slice(1)
          : storedParagraph

      const formattedRuns =
        parseJournalFormatting(
          paragraphMarkup,
        )

      const paragraphText =
        formattedRuns
          .map(
            (run) => run.text,
          )
          .join('')

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
      if (
        paragraphText.length === 0
      ) {
        paragraph.textContent =
          '\u00a0'

        container.appendChild(
          paragraph,
        )

        lines.push({
          text: '',
          runs: [],
          paragraphIndex,
          firstLineOfParagraph:
            true,
          indented,
          endsParagraph: true,
        })

        return
      }

      /*
       * Build the actual styled DOM
       * that the browser will use
       * for line wrapping.
       *
       * Every visible character is
       * associated with its source
       * formatting so markup itself
       * consumes no page space.
       */
      const characters: {
        character: string
        bold: boolean
        italic: boolean
        underline: boolean
        node: Text
        nodeOffset: number
      }[] = []

      for (
        const run
        of formattedRuns
      ) {
        if (!run.text) {
          continue
        }

        const span =
          document.createElement(
            'span',
          )

        if (run.bold) {
          span.style.fontWeight =
            '700'
        }

        if (run.italic) {
          span.style.fontStyle =
            'italic'
        }

        if (run.underline) {
          span.style.textDecoration =
            'underline'
        }

        const textNode =
          document.createTextNode(
            run.text,
          )

        span.appendChild(
          textNode,
        )

        paragraph.appendChild(
          span,
        )

        for (
          let index = 0;
          index < run.text.length;
          index += 1
        ) {
          characters.push({
            character:
              run.text[index],

            bold:
              run.bold,

            italic:
              run.italic,

            underline:
              run.underline,

            node:
              textNode,

            nodeOffset:
              index,
          })
        }
      }

      container.appendChild(
        paragraph,
      )

      function buildLineRuns(
        start: number,
        end: number,
      ): JournalPageTextRun[] {
        const result:
          JournalPageTextRun[] = []

        for (
          let index = start;
          index < end;
          index += 1
        ) {
          const character =
            characters[index]

          const previous =
            result[
              result.length - 1
            ]

          if (
            previous &&
            previous.bold ===
              character.bold &&
            previous.italic ===
              character.italic &&
            previous.underline ===
              character.underline
          ) {
            previous.text +=
              character.character
          } else {
            result.push({
              text:
                character.character,

              bold:
                character.bold,

              italic:
                character.italic,

              underline:
                character.underline,
            })
          }
        }

        return result
      }

      let lineStart = 0

      let previousTop:
        number | null = null

      for (
        let index = 0;
        index <
        characters.length;
        index += 1
      ) {
        const character =
          characters[index]

        const range =
          document.createRange()

        range.setStart(
          character.node,
          character.nodeOffset,
        )

        range.setEnd(
          character.node,
          character.nodeOffset + 1,
        )

        const rect =
          range
            .getBoundingClientRect()

        const currentTop =
          Math.round(rect.top)

        if (
          previousTop !== null &&
          currentTop !== previousTop
        ) {
          const lineRuns =
            buildLineRuns(
              lineStart,
              index,
            )

          lines.push({
            text:
              lineRuns
                .map(
                  (run) =>
                    run.text,
                )
                .join(''),

            runs:
              lineRuns,

            paragraphIndex,

            firstLineOfParagraph:
              lineStart === 0,

            indented,

            endsParagraph:
              false,
          })

          lineStart =
            index
        }

        previousTop =
          currentTop
      }

      const finalRuns =
        buildLineRuns(
          lineStart,
          characters.length,
        )

      lines.push({
        text:
          finalRuns
            .map(
              (run) => run.text,
            )
            .join(''),

        runs:
          finalRuns,

        paragraphIndex,

        firstLineOfParagraph:
          lineStart === 0,

        indented,

        endsParagraph:
          true,
      })
    },
  )

  container.remove()

  return lines.length > 0
    ? lines
    : [
        {
          text: '',
          runs: [],
          paragraphIndex: 0,
          firstLineOfParagraph:
            true,
          indented: false,
          endsParagraph: true,
        },
      ]
}

function measureSingleLineWidth(
  storedText: string,
  fontFamily: string,
  fontSize: number,
  fontWeight = '400',
): number {
  const element =
    document.createElement('span')

  element.style.position =
    'absolute'
  element.style.visibility =
    'hidden'
  element.style.pointerEvents =
    'none'
  element.style.left =
    '-100000px'
  element.style.top =
    '0'

  element.style.whiteSpace =
    'pre'

  element.style.fontFamily =
    fontFamily
  element.style.fontSize =
    `${fontSize}px`
  element.style.fontWeight =
    fontWeight

  const runs =
    parseJournalFormatting(
      storedText,
    )

  for (const run of runs) {
    const span =
      document.createElement(
        'span',
      )

    if (run.bold) {
      span.style.fontWeight =
        '700'
    }

    if (run.italic) {
      span.style.fontStyle =
        'italic'
    }

    if (run.underline) {
      span.style.textDecoration =
        'underline'
    }

    span.textContent =
      run.text

    element.appendChild(
      span,
    )
  }

  document.body.appendChild(
    element,
  )

  const width =
    element
      .getBoundingClientRect()
      .width

  element.remove()

  return width
}

export function paginateJournalDocument(
  journalDocument:
    JournalDocument,
  metrics:
    JournalPaginationMetrics,
): JournalPaginationResult {
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
        {
          type:
            | 'item'
            | 'addItem'
        }
      >,
    fontSize: number,
    lineHeight: number,
    fontWeight: string,
    topGap: number,
    bottomGap: number,
  ) => {
    const lines =
      measureBrowserLines(
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

      const paragraphs:
      {
        text: string
        indented: boolean
        runs: JournalPageTextRun[]
      }[] = []

      for (
        const line
        of fragmentLines
      ) {
        const previous =
          paragraphs[
            paragraphs.length - 1
          ]

      if (
        previous &&
        !line.firstLineOfParagraph
      ) {
        previous.text += line.text

      for ( const run of line.runs )
      {
        const previousRun =
          previous.runs[
            previous.runs.length - 1
          ]

        if (
          previousRun &&
          previousRun.bold ===
            run.bold &&
          previousRun.italic ===
            run.italic &&
          previousRun.underline ===
            run.underline
        ) {
          previousRun.text +=
            run.text
        } else {
          previous.runs.push({
            ...run,
          })
        }
      }
    } else {
      paragraphs.push({
        text:
          line.text,

        indented:
          line.indented &&
          line.firstLineOfParagraph,

        runs:
          line.runs.map(
            (run) => ({
              ...run,
            }),
          ),
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

  const addInlineFieldAndItem = (
    fieldBlock:
      Extract<
        JournalDocumentBlock,
        { type: 'field' }
      >,
    itemBlock:
      Extract<
        JournalDocumentBlock,
        { type: 'item' }
      >,
  ): boolean => {
    /*
     * Inline form is intentionally
     * restricted to one stored
     * paragraph with no semantic
     * paragraph indent.
     */
    if (
      itemBlock.text.includes(
        '\n',
      ) ||
      itemBlock.text.startsWith(
        '\t',
      )
    ) {
      return false
    }

    const separator = ' - '

    const fieldWidth =
      measureSingleLineWidth(
        fieldBlock.text +
          separator,
        metrics.fontFamily,
        metrics.fieldFontSize,
        '700',
      )

    const itemWidth =
      measureSingleLineWidth(
        itemBlock.text,
        metrics.fontFamily,
        metrics.fontSize,
        '400',
      )

    if (
      fieldWidth +
        itemWidth >
      metrics.pageWidth
    ) {
      return false
    }

    const rowHeight =
      Math.max(
        metrics.fieldLineHeight,
        metrics.lineHeight,
      )

    ensureHeight(
      metrics.fieldTopGap +
        rowHeight +
        metrics.itemBottomGap,
    )

    usedHeight +=
      metrics.fieldTopGap

    const rowTop =
      usedHeight

    currentPage.fragments.push({
      ...fieldBlock,
      text:
        fieldBlock.text +
        separator,
      top: rowTop,
      height: rowHeight,
    })

    currentPage.fragments.push({
      ...itemBlock,
      text:
  parseJournalFormatting(
    itemBlock.text,
  )
    .map(
      (run) => run.text,
    )
    .join(''),
      paragraphs: [
  {
    text:
      parseJournalFormatting(
        itemBlock.text,
      )
        .map(
          (run) => run.text,
        )
        .join(''),

    indented: false,

    runs:
      parseJournalFormatting(
        itemBlock.text,
      ),
  },
],
      top: rowTop,
      height: rowHeight,
      left: fieldWidth,
      width:
        metrics.pageWidth -
        fieldWidth,
      inline: true,
    })

    usedHeight +=
      rowHeight +
      metrics.itemBottomGap

    return true
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

  let blockIndex = 0

  while (
    blockIndex <
    journalDocument.blocks.length
  ) {
    const block =
      journalDocument.blocks[
        blockIndex
      ]

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

        blockIndex += 1
        break

      case 'field': {
        const nextBlock =
          journalDocument.blocks[
            blockIndex + 1
          ]

        const firstItem =
          nextBlock?.type ===
            'item' &&
          nextBlock
            .fieldDefinitionId ===
            block
              .fieldDefinitionId
            ? nextBlock
            : null

        if (
          firstItem &&
          addInlineFieldAndItem(
            block,
            firstItem,
          )
        ) {
          /*
           * Both the Field label
           * and its first Item were
           * consumed together.
           */
          blockIndex += 2
          break
        }

        addSingleBlock(
          block,
          metrics.fieldFontSize,
          metrics.fieldLineHeight,
          '700',
          metrics.fieldTopGap,
          metrics.fieldBottomGap,
        )

        blockIndex += 1
        break
      }

      case 'item':
        addItemBlock(
          block,
        )

        blockIndex += 1
        break

      case 'addItem':
        addItemTarget(
          block,
        )

        blockIndex += 1
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