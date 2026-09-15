import type {
  JournalFieldItemSource,
} from '../models/JournalField'

export interface JournalDocumentTitleBlock {
  type: 'title'
  entryId: string
  text: string
}

export interface JournalDocumentFieldBlock {
  type: 'field'
  entryId: string
  fieldDefinitionId: string
  text: string
}

export interface JournalDocumentItemBlock {
  type: 'item'
  entryId: string
  fieldDefinitionId: string
  itemId: string
  source: JournalFieldItemSource
  text: string
}

export type JournalDocumentBlock =
  | JournalDocumentTitleBlock
  | JournalDocumentFieldBlock
  | JournalDocumentItemBlock

export interface JournalDocument {
  entryId: string
  blocks: JournalDocumentBlock[]
}