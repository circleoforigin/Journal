import type {
  EventDefinition,
} from '@settingforge/module-sdk'

export interface JournalPageSummary {
  pageId: string
  title: string
  subtitle: string
  brief: string
}

export interface JournalPageCandidate {
  pageId: string
  title: string
  subtitle: string
  brief: string
}

export interface JournalPagesResponse {
  projectId: string
  pages: JournalPageCandidate[]
}

export interface JournalSectionSummary {
  sectionId: string
  sectionName: string
}

export interface JournalSectionsResponse {
  projectId: string
  sections: JournalSectionSummary[]
}

export interface JournalPageCreatedPayload
  extends JournalPageSummary,
    JournalSectionSummary {
  projectId: string
}

export const journalEventDefinitions:
  EventDefinition[] = [
    {
      id: 'Journal.PageCreated',

      label: 'Page Created',

      description:
        'A Journal Page was created.',

      fields: [
        {
          key: 'projectId',
          label: 'Project ID',
          type: 'string',
        },
        {
          key: 'pageId',
          label: 'Page ID',
          type: 'string',
        },
        {
          key: 'title',
          label: 'Title',
          type: 'string',
        },
        {
          key: 'subtitle',
          label: 'Subtitle',
          type: 'string',
        },
        {
          key: 'brief',
          label: 'Brief',
          type: 'string',
        },
        {
          key: 'sectionId',
          label: 'Section ID',
          type: 'string',
        },
        {
          key: 'sectionName',
          label: 'Section Name',
          type: 'string',
        },
      ],
    },
  ]