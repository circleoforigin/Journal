import type {
  JournalValue,
} from './JournalValue'

export type JournalFieldItemSource =
  | 'master'
  | 'user'

export interface JournalFieldItem {
  id: string

  order: number

  value: JournalValue

  source: JournalFieldItemSource

  userId?: string

  createdAt: string
  updatedAt: string
}

export interface JournalField {
  items: JournalFieldItem[]
}