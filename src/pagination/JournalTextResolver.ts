import type {
  JournalFieldItem,
} from '../models/JournalField'

import {
  parseJournalMarkup,
} from './JournalMarkupParser'

import type {
  JournalReadabilitySettings,
  JournalRenderableItem,
  JournalRenderableTextRun,
  JournalSemanticTextRun,
} from './JournalRenderableText'

export interface JournalLanguageDefinition {
  id: string
  name: string

  fontFamily: string
}

export interface JournalTextResolverOptions {
  readability:
    JournalReadabilitySettings

  languages:
    JournalLanguageDefinition[]
}

function resolveRun(
  run: JournalSemanticTextRun,
  options:
    JournalTextResolverOptions,
): JournalRenderableTextRun {
  const {
    readability,
    languages,
  } = options

  if (
    run.type === 'text'
  ) {
    return {
      id: run.id,

      text: run.text,

      fontFamily:
        readability.fontFamily,

      fontSize:
        readability.fontSize,

      sourceType: 'text',
    }
  }

  const language =
    languages.find(
      (candidate) =>
        candidate.id
          .toLowerCase() ===
        run.languageId
          .toLowerCase(),
    )

  if (run.translated) {
    const languageName =
      language?.name ??
      run.languageId

    return {
      id: run.id,

      text:
        `In ${languageName}, "${run.text}"`,

      fontFamily:
        readability.fontFamily,

      fontSize:
        readability.fontSize,

      sourceType:
        'language',

      languageId:
        run.languageId,

      translated: true,
    }
  }

  return {
    id: run.id,

    text: run.text,

    fontFamily:
      language?.fontFamily ??
      readability.fontFamily,

    fontSize:
      readability.fontSize,

    sourceType:
      'language',

    languageId:
      run.languageId,

    translated: false,
  }
}

export function resolveJournalItemText(
  fieldDefinitionId: string,
  item: JournalFieldItem,
  options:
    JournalTextResolverOptions,
): JournalRenderableItem {
  const value =
    typeof item.value === 'string'
      ? item.value
      : String(
          item.value ?? '',
        )

  const semanticRuns =
    parseJournalMarkup(
      value,
    )

  return {
    fieldDefinitionId,
    itemId: item.id,

    runs:
      semanticRuns.map(
        (run) =>
          resolveRun(
            run,
            options,
          ),
      ),
  }
}