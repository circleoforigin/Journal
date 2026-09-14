import type {
  JournalFieldDefinition,
} from './JournalFieldDefinition'

export interface Project {
  id: string
  name: string

  fieldDefinitions:
    JournalFieldDefinition[]

  journalIds: string[]

  createdAt: string
  updatedAt: string
}