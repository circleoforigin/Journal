import type {
  JournalField,
} from './JournalField'

import type {
  JournalObjectReference,
} from './JournalValue'

export interface JournalEntry {
  id: string

  fields:
    Record<string, JournalField>

  source?:
    JournalObjectReference

  createdAt: string
  updatedAt: string
}