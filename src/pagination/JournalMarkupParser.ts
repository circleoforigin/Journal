import type {
  JournalSemanticTextRun,
} from './JournalRenderableText'

const LANGUAGE_PATTERN =
  /<lang:([^\s>]+)\s+trans:(true|false)>([\s\S]*?)<\/>/gi

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
      LANGUAGE_PATTERN,
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