import type {
  JournalEntry,
} from '../models/JournalEntry'

import type {
  JournalFieldDefinition,
} from '../models/JournalFieldDefinition'

import { normalizeFieldItems } from '../fields/JournalFieldRules'

import type {
  JournalDocument,
  JournalDocumentBlock,
} from './JournalDocument'

function getStringValue(
  value: unknown,
): string {
  return typeof value === 'string' ||
    typeof value === 'number'
    ? String(value)
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

    const orderedItems = normalizeFieldItems(
      fieldDefinition,
      field.items,
    )

    if (fieldDefinition.presentation === 'inline') {
      const items = orderedItems
        .map((item) => ({
          itemId: item.id,
          source: item.source,
          text: getStringValue(item.value).trim(),
        }))
        .filter((item) => item.text)

      blocks.push({
        type: 'inlineField',
        entryId: entry.id,
        fieldDefinitionId: fieldDefinition.id,
        text: `${fieldDefinition.name} - ${items
          .map((item) => item.text)
          .join(', ')}`,
        label: fieldDefinition.name,
        items,
      })

      if (orderedItems.length > 0) {
        blocks.push({
          type: 'addItem',
          entryId: entry.id,
          fieldDefinitionId: fieldDefinition.id,
          afterItemId: orderedItems[orderedItems.length - 1].id,
        })
      }
      continue
    }

    let firstDisplayedItem = true
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
  displayPrefix:
  firstDisplayedItem
    ? `<b>${fieldDefinition.name} - </b>`
    : undefined,
  presentation:
    fieldDefinition.presentation,
})

firstDisplayedItem = false

if (
  fieldDefinition.presentation === 'multiple'
) {
  blocks.push({
    type: 'addItem',
    entryId: entry.id,
    fieldDefinitionId:
      fieldDefinition.id,
    afterItemId: item.id,
  })
}
    }    
  }

  return {
    entryId: entry.id,
    blocks,
  }
}
