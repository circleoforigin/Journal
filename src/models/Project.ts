import type {
  JournalFieldDefinition,
} from './JournalFieldDefinition'

export interface Project {
  id: string
  name: string

  fieldDefinitions:
    JournalFieldDefinition[]

  sectionDefinition:
    JournalSectionDefinition[]

  journalIds: string[]

  createdAt: string
  updatedAt: string
}