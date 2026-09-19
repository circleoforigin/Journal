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
      valueType: 'string',
      presentation: 'single',
    },
    {
      name: 'History',
      valueType: 'string',
      presentation: 'single',
    },
    {
      name: 'Population',
      valueType: 'number',
      presentation: 'single',
    },
    {
      name: 'Government',
      valueType: 'string',
      presentation: 'single',
    },
    {
      name: 'Notable People',
      valueType: 'string',
      presentation: 'multiple',
    },
    {
      name: 'Rumors',
      valueType: 'string',
      presentation: 'multiple',
    },
    {
      name: 'Secrets',
      valueType: 'string',
      presentation: 'multiple',
    },
    {
      name: 'Tags',
      valueType: 'string',
      presentation: 'inline',
    },
  ]