export interface JournalReadabilitySettings {
  fontFamily: string
  fontSize: number
}

export interface JournalNormalTextRun {
  type: 'text'

  id: string
  text: string
}

export interface JournalLanguageTextRun {
  type: 'language'

  id: string
  text: string

  languageId: string
  translated: boolean
}

export type JournalSemanticTextRun =
  | JournalNormalTextRun
  | JournalLanguageTextRun

export interface JournalRenderableTextRun {
  id: string

  text: string

  fontFamily: string
  fontSize: number

  sourceType:
    | 'text'
    | 'language'

  languageId?: string
  translated?: boolean
}

export interface JournalRenderableItem {
  fieldDefinitionId: string
  itemId: string

  runs:
    JournalRenderableTextRun[]
}