export type JournalFieldValueType =
  | 'text'
  | 'richText'
  | 'number'
  | 'boolean'
  | 'date'
  | 'tags'
  | 'reference'

export type JournalFieldBehavior =
  | 'single'
  | 'collection'
  | 'log'

export interface JournalFieldDefinition {
  id: string
  name: string

  valueType:
    JournalFieldValueType

  behavior:
    JournalFieldBehavior

  order: number
}