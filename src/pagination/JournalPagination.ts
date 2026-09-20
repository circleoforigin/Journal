import type {
  JournalFieldItemSource,
} from '../models/JournalField'
import type {
  JournalFieldPresentation,
} from '../models/JournalFieldDefinition'

export interface JournalPageTitleFragment {
  type: 'title'
  entryId: string
  fieldDefinitionId: string
  itemId: string
  source: JournalFieldItemSource
  text: string
  top: number
  height: number
}

export interface JournalPageSubtitleFragment {
  type: 'subtitle'
  entryId: string
  fieldDefinitionId: string
  itemId: string
  source: JournalFieldItemSource
  text: string
  top: number
  height: number
}

export interface JournalPageBriefFragment {
  type: 'brief'
  entryId: string
  fieldDefinitionId: string
  itemId: string
  source: JournalFieldItemSource
  text: string
  top: number
  height: number
}

export interface JournalPageFieldFragment {
  type: 'field'
  entryId: string
  fieldDefinitionId: string
  text: string
  top: number
  height: number
}

export interface JournalPageInlineItem {
  itemId: string
  source: JournalFieldItemSource
  text: string
  runs: JournalPageTextRun[]
}

export interface JournalPageInlineFieldFragment {
  type: 'inlineField'
  entryId: string
  fieldDefinitionId: string
  text: string
  label: string
  items: JournalPageInlineItem[]
  top: number
  height: number
}

export interface JournalPageTextRun {
  text: string
  bold: boolean
  italic: boolean
  underline: boolean
  sourceType?: 'text' | 'language' | 'reference'
  languageId?: string
  targetEntryId?: string
}

export interface JournalPageItemParagraph {
  text: string
  indented: boolean
  runs: JournalPageTextRun[]
}

export interface JournalPageItemFragment {
  type: 'item'
  entryId: string
  fieldDefinitionId: string
  itemId: string
  source: JournalFieldItemSource
  presentation: JournalFieldPresentation
  text: string
  paragraphs: JournalPageItemParagraph[]
  top: number
  height: number
  left?: number
  width?: number
  inline?: boolean
  displayPrefix?: string
}

export interface JournalPageAddItemFragment {
  type: 'addItem'
  entryId: string
  fieldDefinitionId: string
  afterItemId: string
  top: number
  height: number
}

export type JournalPageFragment =
  | JournalPageTitleFragment
  | JournalPageSubtitleFragment
  | JournalPageBriefFragment
  | JournalPageFieldFragment
  | JournalPageInlineFieldFragment
  | JournalPageItemFragment
  | JournalPageAddItemFragment

export interface JournalPageLayout {
  pageIndex: number
  fragments: JournalPageFragment[]
}

export interface JournalPaginationResult {
  pages: JournalPageLayout[]
}
