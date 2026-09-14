import type {
  JournalField,
} from './JournalField'

export interface JournalEntrySource {
  moduleId: string
  objectType: string
  objectId: string
}

export interface JournalEntry {
  id: string

  title: string

  subtitle?: string

  fields:
    Record<string, JournalField>

  source?:
    JournalEntrySource

  createdAt: string
  updatedAt: string
}