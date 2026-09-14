import type {
  JournalValue,
} from './JournalValue'

export interface JournalFieldItem {
  id: string

  order: number

  value: JournalValue

  createdAt: string
  updatedAt: string
}

export interface JournalField {
  value?: JournalValue

  items?: JournalFieldItem[]
}