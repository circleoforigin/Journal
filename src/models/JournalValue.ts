export type JournalPrimitiveValue =
  | string
  | number
  | boolean

export interface JournalObjectReference {
  moduleId: string
  objectType: string
  objectId: string
}

export type JournalValue =
  | JournalPrimitiveValue
  | string[]
  | JournalObjectReference