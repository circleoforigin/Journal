export interface JournalReadabilitySettings {
  fontFamily: string
  fontSize: number
}

export interface JournalSemanticPlainTextRun {
  type: 'text'
  id: string
  text: string
}

export interface JournalSemanticLanguageTextRun {
  type: 'language'
  id: string
  text: string
  languageId: string
  translated: boolean
}

export type JournalSemanticTextRun =
  | JournalSemanticPlainTextRun
  | JournalSemanticLanguageTextRun

export interface JournalRenderableTextRun {
  id: string
  text: string
  fontFamily: string
  fontSize: number
  sourceType: 'text' | 'language'
  languageId?: string
  translated?: boolean
}

export interface JournalRenderableItem {
  fieldDefinitionId: string
  itemId: string
  runs: JournalRenderableTextRun[]
}