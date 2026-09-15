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
      behavior: 'single',
    },
    {
      name: 'History',
      valueType: 'richText',
      behavior: 'single',
    },
    {
      name: 'Population',
      valueType: 'number',
      behavior: 'single',
    },
    {
      name: 'Government',
      valueType: 'richText',
      behavior: 'single',
    },
    {
      name: 'Notable People',
      valueType: 'text',
      behavior: 'collection',
    },
    {
      name: 'Rumors',
      valueType: 'text',
      behavior: 'collection',
    },
    {
      name: 'Secrets',
      valueType: 'richText',
      behavior: 'collection',
    },
    {
      name: 'Notes',
      valueType: 'richText',
      behavior: 'log',
    },
    {
      name: 'Tags',
      valueType: 'tags',
      behavior: 'single',
    },
  ]