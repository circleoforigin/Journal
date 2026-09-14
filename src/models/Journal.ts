export type JournalKind =
  | 'setting'
  | 'character'

export interface Journal {
  id: string
  name: string

  kind: JournalKind

  characterId?: string

  entryIds: string[]

  createdAt: string
  updatedAt: string
}