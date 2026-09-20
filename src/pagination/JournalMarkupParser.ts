import type {
  JournalSemanticTextRun,
} from './JournalRenderableText'

export interface JournalFormattingState {
  bold: boolean
  italic: boolean
  underline: boolean
}

export interface JournalFormattedTextRun {
  text: string
  bold: boolean
  italic: boolean
  underline: boolean
}

const EMPTY_FORMATTING:
  JournalFormattingState = {
    bold: false,
    italic: false,
    underline: false,
  }

export function parseJournalFormatting(
  value: string,
): JournalFormattedTextRun[] {
  const runs:
    JournalFormattedTextRun[] = []

  const formatting = {
    ...EMPTY_FORMATTING,
  }

  let buffer = ''

  function flushBuffer() {
    if (!buffer) {
      return
    }

    runs.push({
      text: buffer,
      bold: formatting.bold,
      italic: formatting.italic,
      underline:
        formatting.underline,
    })

    buffer = ''
  }

  let index = 0

  while (index < value.length) {
    const remaining =
      value.slice(index)

    const tagMatch =
      remaining.match(
        /^<\/?(b|i|u)>/i,
      )

    if (!tagMatch) {
      buffer += value[index]
      index += 1
      continue
    }

    flushBuffer()

    const fullTag =
      tagMatch[0]

    const tag =
      tagMatch[1]
        .toLowerCase()

    const closing =
      fullTag.startsWith('</')

    if (tag === 'b') {
      formatting.bold =
        !closing
    } else if (tag === 'i') {
      formatting.italic =
        !closing
    } else {
      formatting.underline =
        !closing
    }

    index +=
      fullTag.length
  }

  flushBuffer()

  return runs
}

const SEMANTIC_PATTERN =
  /<lang:([^\s>]+)\s+trans:(true|false)>([\s\S]*?)<\/>|<ref:([^>]+)>([\s\S]*?)<\/>/gi

export function parseJournalMarkup(
  value: string,
): JournalSemanticTextRun[] {
  const runs:
    JournalSemanticTextRun[] = []

  let lastIndex = 0
  let runIndex = 0

  for (
    const match
    of value.matchAll(
      SEMANTIC_PATTERN,
    )
  ) {
    const matchIndex =
      match.index ?? 0

    if (
      matchIndex >
      lastIndex
    ) {
      runs.push({
        type: 'text',

        id:
          `text:${runIndex}`,

        text:
          value.slice(
            lastIndex,
            matchIndex,
          ),
      })

      runIndex += 1
    }

    /*
     * Language markup:
     *
     * <lang:LANGUAGE-ID trans:true>
     *   visible text
     * </>
     */
    if (match[1] !== undefined) {
      const languageId =
        match[1]

      const translated =
        match[2].toLowerCase() ===
        'true'

      const text =
        match[3]

      runs.push({
        type: 'language',

        id:
          `language:${runIndex}`,

        text,

        languageId,
        translated,
      })
    } else {
      /*
       * Journal Reference:
       *
       * <ref:MASTER-ENTRY-ID>
       *   authored display text
       * </>
       */
      const targetEntryId =
        match[4]

      const text =
        match[5]

      runs.push({
        type: 'reference',

        id:
          `reference:${runIndex}`,

        text,

        targetEntryId,
      })
    }

    runIndex += 1

    lastIndex =
      matchIndex +
      match[0].length
  }

  if (
    lastIndex <
    value.length
  ) {
    runs.push({
      type: 'text',

      id:
        `text:${runIndex}`,

      text:
        value.slice(
          lastIndex,
        ),
    })
  }

  if (
    runs.length === 0 &&
    value.length > 0
  ) {
    runs.push({
      type: 'text',
      id: 'text:0',
      text: value,
    })
  }

  return runs
}