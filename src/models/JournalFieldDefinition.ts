export type JournalFieldValueType =
  | 'text'
  | 'richText'
  | 'number'
  | 'boolean'
  | 'date'
  | 'tags'
  | 'reference'

export interface JournalFieldDefinition {
  id: string
  name: string

  valueType:
    JournalFieldValueType
 
  order: number

  isSystem?: boolean
}