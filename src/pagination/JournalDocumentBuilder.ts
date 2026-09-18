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

  const subtitleDefinition =
    fieldDefinitions.find(
      (definition) =>
        definition.isSystem &&
        definition.name === 'Subtitle',
    )

  const briefDefinition =
    fieldDefinitions.find(
      (definition) =>
        definition.isSystem &&
        definition.name === 'Brief',
    )

  const notesDefinition =
    fieldDefinitions.find(
      (definition) =>
        definition.isSystem &&
        definition.name === 'Notes',
    )

  const titleItem =
    titleDefinition
      ? entry.fields[
          titleDefinition.id
        ]?.items[0]
      : undefined

  const subtitleItem =
    subtitleDefinition
      ? entry.fields[
          subtitleDefinition.id
        ]?.items[0]
      : undefined

  const briefItem =
    briefDefinition
      ? entry.fields[
          briefDefinition.id
        ]?.items[0]
      : undefined

  if (
    titleDefinition &&
    titleItem
  ) {
    blocks.push({
      type: 'title',
      entryId: entry.id,
      fieldDefinitionId:
        titleDefinition.id,
      itemId: titleItem.id,
      source: titleItem.source,
      text:
        getStringValue(
          titleItem.value,
        ).trim(),
    })
  }

  if (
    subtitleDefinition &&
    subtitleItem
  ) {
    const subtitle =
      getStringValue(
        subtitleItem.value,
      ).trim()

    if (subtitle) {
      blocks.push({
        type: 'subtitle',
        entryId: entry.id,
        fieldDefinitionId:
          subtitleDefinition.id,
        itemId: subtitleItem.id,
        source: subtitleItem.source,
        text: subtitle,
      })
    }
  }

  if (
    briefDefinition &&
    briefItem
  ) {
    const brief =
      getStringValue(
        briefItem.value,
      )

    if (brief.trim()) {
      blocks.push({
        type: 'brief',
        entryId: entry.id,
        fieldDefinitionId:
          briefDefinition.id,
        itemId: briefItem.id,
        source: briefItem.source,
        text: brief,
      })
    }
  }

  const ordinaryFields =
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

  const orderedFields =
    notesDefinition &&
    entry.fields[
      notesDefinition.id
    ]
      ? [
          ...ordinaryFields,
          notesDefinition,
        ]
      : ordinaryFields

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

      /*
       * Notes is a permanent Field.
       * Its first empty Item must
       * remain physically available
       * for editing.
       */
      if (
        !text.trim() &&
        fieldDefinition.id !==
          notesDefinition?.id
      ) {
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

      blocks.push({
        type: 'addItem',
        entryId:
          entry.id,
        fieldDefinitionId:
          fieldDefinition.id,
        afterItemId:
          item.id,
      })
    }
  }

  return {
    entryId: entry.id,
    blocks,
  }
}