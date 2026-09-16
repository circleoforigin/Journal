import type {
  JournalFieldItemSource,
} from '../models/JournalField'

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

export interface JournalPageFieldFragment {
  type: 'field'
  entryId: string
  fieldDefinitionId: string
  text: string
  top: number
  height: number
}

export interface JournalPageItemParagraph {
  text: string
  indented: boolean
}

export interface JournalPageItemFragment {
  type: 'item'
  entryId: string
  fieldDefinitionId: string
  itemId: string
  source: JournalFieldItemSource
  text: string
  paragraphs: JournalPageItemParagraph[]
  top: number
  height: number
  left?: number
  width?: number
  inline?: boolean
}

export interface JournalPageAddItemFragment {
  type: 'addItem'
  entryId: string
  fieldDefinitionId: string
  top: number
  height: number
}

export type JournalPageFragment =
  | JournalPageTitleFragment
  | JournalPageFieldFragment
  | JournalPageItemFragment
  | JournalPageAddItemFragment

export interface JournalPageLayout {
  pageIndex: number
  fragments: JournalPageFragment[]
}

export interface JournalPaginationResult {
  pages: JournalPageLayout[]
}