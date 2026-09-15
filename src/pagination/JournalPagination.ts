import type {
  JournalFieldDefinition,
} from '../models/JournalFieldDefinition'

import type {
  JournalFieldItem,
} from '../models/JournalField'

export interface JournalItemFragment {
  type: 'item'

  fieldDefinitionId: string
  itemId: string
  runId: string

  text: string

  fontFamily: string
  fontSize: number

  sourceType:
    | 'text'
    | 'language'

  languageId?: string
  translated?: boolean

  startOffset: number
  endOffset: number

  isFirstFragment: boolean
  isLastFragment: boolean

  item: JournalFieldItem
}

export interface JournalEntryTitleFragment {
  type: 'entryTitle'

  entryId: string
  text: string
}

export interface JournalFieldStartFragment {
  type: 'fieldStart'

  fieldDefinitionId: string

  fieldDefinition:
    JournalFieldDefinition
}

export type JournalPageFragment =
  | JournalEntryTitleFragment
  | JournalFieldStartFragment
  | JournalItemFragment

export interface JournalPageLayout {
  pageIndex: number

  fragments:
    JournalPageFragment[]
}

export interface JournalEntryPagination {
  entryId: string

  pages:
    JournalPageLayout[]
}