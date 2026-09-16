import type {
  JournalEntry,
} from '../models/JournalEntry'

import type {
  JournalFieldDefinition,
} from '../models/JournalFieldDefinition'

import type {
  JournalDocument,
  JournalDocumentBlock,
} from './JournalDocument'

function getStringValue(
  value: unknown,
): string {
  return typeof value === 'string'
    ? value
    : ''
}

export function buildJournalDocument(
  entry: JournalEntry,
  fieldDefinitions:
    JournalFieldDefinition[],
): JournalDocument {
  const blocks:
    JournalDocumentBlock[] = []

  const titleDefinition =
    fieldDefinitions.find(
      (definition) =>
        definition.isSystem &&
        definition.name === 'Title',
    )

  const titleItem =
    titleDefinition
      ? entry.fields[
          titleDefinition.id
        ]?.items[0]
      : undefined

  const titleText =
    getStringValue(
      titleItem?.value,
    ).trim() || 'New Entry'

  if (
    titleDefinition &&
    titleItem
  ) {
    blocks.push({
        type: 'title',
        entryId: entry.id,
        fieldDefinitionId: titleDefinition.id,
        itemId: titleItem.id,
        source: titleItem.source,
        text: titleText,
    })
  }

  const orderedFields =
    fieldDefinitions
      .filter(
        (definition) =>
          !definition.isSystem &&
          entry.fields[
            definition.id
          ],
      )
      .sort(
        (left, right) =>
          left.order -
          right.order,
      )

  for (
    const fieldDefinition
    of orderedFields
  ) {
    const field =
      entry.fields[
        fieldDefinition.id
      ]

    if (!field) {
      continue
    }

    blocks.push({
      type: 'field',
      entryId: entry.id,
      fieldDefinitionId:
        fieldDefinition.id,
      text:
        fieldDefinition.name,
    })

    const orderedItems =
      [...field.items]
        .sort(
          (left, right) => {
            if (
              left.source !==
              right.source
            ) {
              return left.source ===
                'master'
                ? -1
                : 1
            }

            return (
              left.order -
              right.order
            )
          },
        )

    for (
      const item
      of orderedItems
    ) {
      const text =
        getStringValue(
          item.value,
        )

      if (!text.trim()) {
        continue
      }

      blocks.push({
        type: 'item',
        entryId:
          entry.id,
        fieldDefinitionId:
          fieldDefinition.id,
        itemId:
          item.id,
        source:
          item.source,
        text,
      })
    }
  }

  return {
    entryId: entry.id,
    blocks,
  }
}