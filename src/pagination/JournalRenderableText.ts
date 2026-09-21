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

export interface JournalSemanticReferenceTextRun {
  type: 'reference'
  id: string
  text: string
  targetEntryId: string
}

export type JournalSemanticTextRun =
  | JournalSemanticPlainTextRun
  | JournalSemanticLanguageTextRun
  | JournalSemanticReferenceTextRun

export interface JournalRenderableTextRun {
  id: string
  text: string
  fontFamily: string
  fontSize: number
  sourceType: 'text' | 'language' | 'reference'
  languageId?: string
  translated?: boolean
  targetEntryId?: string
}

export interface JournalRenderableItem {
  fieldDefinitionId: string
  itemId: string
  runs: JournalRenderableTextRun[]
}