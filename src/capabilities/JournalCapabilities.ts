import {
  projectCommandDefinitions,
  projectEventDefinitions,
  projectQueryDefinitions,
} from '@settingforge/module-sdk'

import {
  journalEventDefinitions as journalDomainEventDefinitions,
} from '../events/JournalEvents'

import type {
  CommandDefinition,
  EventDefinition,
  QueryDefinition,
} from '@settingforge/module-sdk'

export const journalEventDefinitions:
  EventDefinition[] = [
    ...journalDomainEventDefinitions,
    ...projectEventDefinitions,
  ]

export const journalCommandDefinitions:
  CommandDefinition[] = [
    {
      id: 'Journal.CreatePage',
      label: 'Create Journal Page',
      description:
        'Creates a Page in the active Journal Project.',
    },
    {
      id: 'Journal.GoToPage',
      label: 'Go to Journal Page',
      description:
        'Navigates Journal to a specific Page.',
    },

    ...projectCommandDefinitions,
  ]

export const journalQueryDefinitions:
  QueryDefinition[] = [
    {
      id: 'Journal.GetSections',
      label: 'Get Journal Sections',
      description:
        'Returns Sections in the active Journal Project.',
    },
    {
      id: 'Journal.GetPages',
      label: 'Get Journal Pages',
      description:
        'Returns Pages available in the active Journal Project.',
    },
    {
      id: 'Journal.GetViewPage',
      label: 'Get Journal View Page',
      description:
        'Returns a read-only paginated Journal view.',
    },

    ...projectQueryDefinitions,
  ]