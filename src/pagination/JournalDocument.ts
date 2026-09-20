import type {
  JournalFieldItemSource,
} from '../models/JournalField'
import type {
  JournalFieldPresentation,
} from '../models/JournalFieldDefinition'

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

export interface JournalDocumentFieldBlock {
  type: 'field'
  entryId: string
  fieldDefinitionId: string
  text: string
  presentation: JournalFieldPresentation
}

export interface JournalDocumentItemBlock {
  type: 'item'
  entryId: string
  fieldDefinitionId: string
  itemId: string
  source: JournalFieldItemSource
  text: string
  presentation: JournalFieldPresentation
}

export interface JournalDocumentInlineItem {
  itemId: string
  source: JournalFieldItemSource
  text: string
}

export interface JournalDocumentInlineFieldBlock {
  type: 'inlineField'
  entryId: string
  fieldDefinitionId: string
  text: string
  label: string
  items: JournalDocumentInlineItem[]
}

export interface JournalDocumentAddItemBlock {
  type: 'addItem'
  entryId: string
  fieldDefinitionId: string
  afterItemId: string
}

export type JournalDocumentBlock =
  | JournalDocumentTitleBlock
  | JournalDocumentSubtitleBlock
  | JournalDocumentBriefBlock
  | JournalDocumentFieldBlock
  | JournalDocumentItemBlock
  | JournalDocumentInlineFieldBlock
  | JournalDocumentAddItemBlock

export interface JournalDocument {
  entryId: string
  blocks: JournalDocumentBlock[]
}
