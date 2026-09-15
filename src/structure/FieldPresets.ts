import type {
  JournalFieldDefinition,
} from '../models/JournalFieldDefinition'

export type JournalFieldPreset =
  Omit<
    JournalFieldDefinition,
    'id' | 'order'
  >

export const fieldPresets:
  JournalFieldPreset[] = [
    {
      name: 'Description',
      valueType: 'richText',
    },
    {
      name: 'History',
      valueType: 'richText',
    },
    {
      name: 'Population',
      valueType: 'number',
    },
    {
      name: 'Government',
      valueType: 'richText',
    },
    {
      name: 'Notable People',
      valueType: 'text',
    },
    {
      name: 'Rumors',
      valueType: 'text',
    },
    {
      name: 'Secrets',
      valueType: 'richText',
    },
    {
      name: 'Notes',
      valueType: 'richText',
    },
    {
      name: 'Tags',
      valueType: 'tags',
    },
  ]