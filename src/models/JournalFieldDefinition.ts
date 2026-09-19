export type JournalFieldValueType =
  | 'string'
  | 'number'

export type JournalFieldPresentation =
  | 'single'
  | 'multiple'
  | 'inline'

export interface JournalFieldDefinition {
  id: string
  name: string

  valueType:
    JournalFieldValueType

  presentation:
    JournalFieldPresentation

  order: number

  isSystem?: boolean
}