import type {
  JournalField,
} from './JournalField'

import type {
  JournalObjectReference,
} from './JournalValue'

export interface JournalEntry {
  id: string

  sectionDefinitionId: string

  archivedFromSectionDefinitionId?: string

  archiveNumber?: number

  fields:
    Record<string, JournalField>

  source?:
    JournalObjectReference

  createdAt: string
  updatedAt: string
}