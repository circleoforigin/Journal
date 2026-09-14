export type JournalPrimitiveValue =
  | string
  | number
  | boolean

export interface JournalReferenceValue {
  moduleId: string
  objectType: string
  objectId: string
}

export type JournalValue =
  | JournalPrimitiveValue
  | string[]
  | JournalReferenceValue