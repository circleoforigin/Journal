import type {
  JournalFieldItemSource,
} from '../models/JournalField'

export interface JournalDocumentTitleBlock {
  type: 'title'
  entryId: string
  fieldDefinitionId: string
  itemId: string
  source: JournalFieldItemSource
  text: string
}

export interface JournalDocumentSubtitleBlock {
  type: 'subtitle'
  entryId: string
  fieldDefinitionId: string
  itemId: string
  source: JournalFieldItemSource
  text: string
}

export interface JournalDocumentBriefBlock {
  type: 'brief'
  entryId: string
  fieldDefinitionId: string
  itemId: string
  source: JournalFieldItemSource
  text: string
}

export type JournalDocumentBlock =
  | JournalDocumentTitleBlock
  | JournalDocumentSubtitleBlock
  | JournalDocumentBriefBlock
  | JournalDocumentFieldBlock
  | JournalDocumentItemBlock
  | JournalDocumentAddItemBlock

export interface JournalDocumentItemBlock {
  type: 'item'
  entryId: string
  fieldDefinitionId: string
  itemId: string
  source: JournalFieldItemSource
  text: string
}

export interface JournalDocumentAddItemBlock {
  type: 'addItem'
  entryId: string
  fieldDefinitionId: string
  afterItemId: string
}

export type JournalDocumentBlock =
  | JournalDocumentTitleBlock
  | JournalDocumentFieldBlock
  | JournalDocumentItemBlock
  | JournalDocumentAddItemBlock

export interface JournalDocument {
  entryId: string
  blocks: JournalDocumentBlock[]
}