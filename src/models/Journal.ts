import type {
  JournalFieldDefinition,
} from './JournalFieldDefinition'

import type {
  JournalSection,
} from './JournalSection'

export interface Journal {
  id: string
  name: string

  ownerName: string

  fieldDefinitions:
    JournalFieldDefinition[]

  sections:
    JournalSection[]

  createdAt: string
  updatedAt: string
}