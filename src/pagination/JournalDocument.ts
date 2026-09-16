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

export interface JournalDocumentAddItemBlock {
  type: 'addItem'
  entryId: string
  fieldDefinitionId: string
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