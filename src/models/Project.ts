import type {
  JournalFieldDefinition,
} from './JournalFieldDefinition'

import type {
  JournalSectionDefinition,
} from './JournalSectionDefinition'

export interface Project {
  id: string
  name: string

  fieldDefinitions:
    JournalFieldDefinition[]

  sectionDefinitions:
    JournalSectionDefinition[]

  journalIds: string[]

  readability: {
    fontFamily: string
    fontSize: number
  }

  createdAt: string
  updatedAt: string
}