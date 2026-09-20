import type { JournalFieldItem } from '../models/JournalField'
import type {
  JournalFieldDefinition,
} from '../models/JournalFieldDefinition'

function compareItemValues(
  left: JournalFieldItem,
  right: JournalFieldItem,
): number {
  const leftText = String(left.value).replace(/<\/?[biu]>/gi, '')
  const rightText = String(right.value).replace(/<\/?[biu]>/gi, '')

  return leftText.localeCompare(
    rightText,
    undefined,
    { sensitivity: 'base' },
  )
}

export function normalizeFieldItems(
  definition: JournalFieldDefinition,
  items: JournalFieldItem[],
): JournalFieldItem[] {
  let normalized = [...items]

  if (definition.presentation === 'single') {
    normalized = normalized.slice(0, 1)
  } else if (definition.presentation === 'inline') {
    normalized.sort(compareItemValues)
  } else {
    normalized.sort((left, right) => left.order - right.order)
  }

  return normalized.map((item, order) => ({
    ...item,
    order,
  }))
}

export function parseFieldItemValue(
  definition: JournalFieldDefinition,
  value: string,
): string | number {
  if (definition.valueType === 'number') {
    const trimmed = value.trim()
    if (!trimmed || !Number.isFinite(Number(trimmed))) {
      throw new Error('Enter a valid number.')
    }
    return Number(trimmed)
  }

  return value
}
