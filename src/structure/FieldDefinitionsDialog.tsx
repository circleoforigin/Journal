import {
  useState,
} from 'react'

import type {
  JournalFieldDefinition,
  JournalFieldPresentation,
  JournalFieldValueType,
} from '../models/JournalFieldDefinition'

import {
  fieldPresets,
} from './FieldPresets'

interface FieldDefinitionsDialogProps {
  fieldDefinitions:
    JournalFieldDefinition[]

  onChange: (
  fieldDefinitions:
    JournalFieldDefinition[],
) => void

  onCancel: () => void
}

function normalizeOrder(
  fields: JournalFieldDefinition[],
): JournalFieldDefinition[] {
  return fields.map(
    (field, index) => ({
      ...field,
      order: index,
    }),
  )
}

export function FieldDefinitionsDialog({
  fieldDefinitions,
  onChange,
  onCancel,
}: FieldDefinitionsDialogProps) {
  const [fields, setFields] =
  useState<JournalFieldDefinition[]>(
    () => {
  const headerFieldNames = [
    'Title',
    'Subtitle',
    'Brief',
  ]

  const headerFields =
    headerFieldNames.map(
      (name, index) => {
        const existing =
          fieldDefinitions.find(
            (field) =>
              field.isSystem &&
              field.name === name,
          )

        if (existing) {
          return {
            ...existing,
            order: index,
          }
        }

        return {
          id: crypto.randomUUID(),
          name,

          valueType:
            'string' as const,

          presentation:
            'single' as const,

          order: index,
          isSystem: true,
        }
      },
    )

  const ordinaryFields =
    fieldDefinitions
      .filter(
        (field) =>
          !field.isSystem,
      )
      .sort(
        (left, right) =>
          left.order -
          right.order,
      )

  const existingNotes =
    fieldDefinitions.find(
      (field) =>
        field.isSystem &&
        field.name === 'Notes',
    )

  const notesField:
    JournalFieldDefinition =
    existingNotes
      ? {
          ...existingNotes,
        }
      : {
          id: crypto.randomUUID(),
          name: 'Notes',
          valueType: 'string',
          presentation: 'multiple',
          order: 0,
          isSystem: true,
        }

  return normalizeOrder([
    ...headerFields,
    ...ordinaryFields,
    notesField,
  ])
},
  )

  const [
    selectedPresetIndex,
    setSelectedPresetIndex,
  ] = useState<number | null>(
    null,
  )

  const [
    selectedFieldId,
    setSelectedFieldId,
  ] = useState<string | null>(
    null,
  )

  const [
    customName,
    setCustomName,
  ] = useState('')

  const [
  customValueType,
  setCustomValueType,
] =
  useState<JournalFieldValueType>(
    'string',
  )

const [
  customPresentation,
  setCustomPresentation,
] =
  useState<JournalFieldPresentation>(
    'single',
  )
 
  const availablePresets =
    fieldPresets
      .map(
        (preset, index) => ({
          preset,
          index,
        }),
      )
      .filter(
        ({ preset }) =>
          !fields.some(
            (field) =>
              field.name ===
              preset.name,
          ),
      )

  const selectedField =
    fields.find(
      (field) =>
        field.id ===
        selectedFieldId,
    ) ?? null

    function applyFields(
  nextFields:
    JournalFieldDefinition[],
) {
  const normalized =
    normalizeOrder(
      nextFields,
    )

  setFields(
    normalized,
  )

  onChange(
    normalized,
  )
}

  function resetEditor() {
    setCustomName('')
    setCustomValueType('string')
    setCustomPresentation('single')
  }

  function clearSelection() {
    setSelectedPresetIndex(null)
    setSelectedFieldId(null)
    resetEditor()
  }

  function selectPreset(
    presetIndex: number,
  ) {
    setSelectedPresetIndex(
      presetIndex,
    )

    setSelectedFieldId(null)

    const preset = fieldPresets[presetIndex]
    if (!preset) return

    setCustomName(preset.name)
    setCustomValueType(preset.valueType)
    setCustomPresentation(preset.presentation)
  }

  function selectField(
  fieldId: string,
) {
  const field =
    fields.find(
      (candidate) =>
        candidate.id ===
        fieldId,
    )

  if (!field) {
    clearSelection()
    return
  }

  setSelectedFieldId(
    field.id,
  )

  setSelectedPresetIndex(
    null,
  )

  setCustomName(
    field.name,
  )

  setCustomValueType(
    field.valueType,
  )

  setCustomPresentation(
    field.presentation,
  )
}

  function updateSelectedField(
  changes:
    Partial<
      Pick<
        JournalFieldDefinition,
        | 'name'
        | 'valueType'
        | 'presentation'
      >
    >,
) {
  if (
    !selectedField ||
    selectedField.isSystem
  ) {
    return
  }

  applyFields(
    fields.map(
      (field) =>
        field.id ===
          selectedField.id
          ? {
              ...field,
              ...changes,
            }
          : field,
    ),
  )
}

  function removeSelectedField() {
    if (
      !selectedField ||
      selectedField.isSystem
    ) {
      return
    }

    applyFields(
  fields.filter(
    (field) =>
      field.id !==
      selectedField.id,
  ),
)

    setSelectedFieldId(null)
    resetEditor()
  }

  function moveField(
  fieldId: string,
  direction: -1 | 1,
) {
  const index =
    fields.findIndex(
      (field) =>
        field.id === fieldId,
    )

  if (index < 0) {
    return
  }

  const field =
    fields[index]

  if (
    !field ||
    field.isSystem
  ) {
    return
  }

  const targetIndex =
    index + direction

  const notesIndex =
    fields.findIndex(
      (candidate) =>
        candidate.isSystem &&
        candidate.name === 'Notes',
    )

  if (
    targetIndex < 3 ||
    targetIndex >= notesIndex
  ) {
    return
  }

  const reordered =
    [...fields]

  reordered.splice(
    index,
    1,
  )

  reordered.splice(
    targetIndex,
    0,
    field,
  )

  applyFields(
    reordered,
  )
}

  function saveEditorField() {
    const name =
      customName.trim()

    if (!name) {
      return
    }

    const alreadyIncluded =
      fields.some(
        (field) =>
          field.id !== selectedField?.id &&
          field.name
            .toLocaleLowerCase() ===
          name.toLocaleLowerCase(),
      )

    if (alreadyIncluded) {
      return
    }

    if (selectedField && !selectedField.isSystem) {
      setFields(
        fields.map((field) =>
          field.id === selectedField.id
            ? {
                ...field,
                name,
                valueType: customValueType,
                presentation: customPresentation,
              }
            : field,
        ),
      )
      return
    }

    const notesIndex =
  fields.findIndex(
    (candidate) =>
      candidate.isSystem &&
      candidate.name === 'Notes',
  )

const insertionIndex =
  notesIndex >= 0
    ? notesIndex
    : fields.length

const field:
  JournalFieldDefinition = {
  id: crypto.randomUUID(),
  name,

  valueType:
    customValueType,

  presentation:
    customPresentation,

  order:
    insertionIndex,
}

const nextFields =
  [...fields]

nextFields.splice(
  insertionIndex,
  0,
  field,
)

applyFields(
  nextFields,
)

clearSelection()
  }

  let transferLabel =
    'SELECT'

  let transferDisabled =
    true

  let transferAction:
    (() => void) | undefined

  if (
    selectedPresetIndex !==
    null
  ) {
    transferLabel = 'ADD'
    transferDisabled = !customName.trim()
    transferAction = saveEditorField
  } else if (selectedField) {
    if (selectedField.isSystem) {
      transferLabel = 'LOCKED'
    } else {
      transferLabel = 'REMOVE'
      transferDisabled = false
      transferAction =
        removeSelectedField
    }
  }

  return (
    <div className="dialog-backdrop">
      <div
        className="dialog structure-dialog"
        onClick={() => {
            clearSelection()
        }}
        >
        <h2>
          Field Definitions
        </h2>

        <div className="structure-list-heading">
          <h3>Presets</h3>

          <button
            type="button"
            disabled={
              transferDisabled
            }
            onClick={() => {
              transferAction?.()
            }}
          >
            {transferLabel}
          </button>

          <h3>Included</h3>
        </div>

        <div className="structure-columns">
          <div className="structure-list">
            {availablePresets.map(
              ({
                preset,
                index,
              }) => (
                <button
                  key={preset.name}
                  type="button"
                  className={
                    selectedPresetIndex ===
                    index
                      ? 'structure-list-item selected'
                      : 'structure-list-item'
                  }
                  onClick={(event) => {
                    event.stopPropagation()
                    selectPreset(index)
                  }}
                >
                  {preset.name}
                </button>
              ),
            )}
          </div>

          <div className="structure-list">
            {fields.map(
              (field, index) => (
                <div
                  key={field.id}
                  className={
                    selectedFieldId ===
                    field.id
                      ? 'structure-included-row selected'
                      : 'structure-included-row'
                  }
                >
                  <button
                    type="button"
                    className="structure-field-select"
                    onClick={(event) => {
                        event.stopPropagation()

                        selectField(
                            field.id,
                        )
                    }}
                  >
                    {field.name}

                    {field.isSystem
                      ? ' (Locked)'
                      : ''}
                  </button>

                  {selectedFieldId ===
                    field.id &&
                    !field.isSystem && (
                      <div className="structure-order-controls">
                        <button
                          type="button"
                          disabled={
                            index <= 3
                          }
                          onClick={(event) => {
                            event.stopPropagation()

                            moveField(
                                field.id,
                                -1,
                            )
                          }}
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          disabled={
                            index ===
                            fields.length - 2
                          }
                          onClick={(event) => {
                            event.stopPropagation()

                            moveField(
                                field.id,
                                1,
                            )
                          }}
                        >
                          ↓
                        </button>
                      </div>
                    )}
                </div>
              ),
            )}
          </div>
        </div>

        <div
          className="structure-custom-field"
          onClick={(event) => event.stopPropagation()}
        >
          <h3>
            {selectedField?.isSystem
              ? 'System Field'
              : selectedField
                ? 'Edit Field'
                : selectedPresetIndex !== null
                  ? 'Configure Preset'
                  : 'Create Custom Field'}
          </h3>

          <div className="structure-custom-row">
            <label>
              <span>Name</span>

              <input
                value={customName}
                disabled={Boolean(selectedField?.isSystem)}
                onChange={(event) => {
  const name =
    event.target.value

  setCustomName(
    name,
  )

  updateSelectedField({
    name,
  })
}}
              />
            </label>
          </div>

          <div className="structure-custom-row">
            <label>
  <span>
    Data
  </span>

  <select
    value={
      customValueType
    }
    disabled={Boolean(selectedField?.isSystem)}
    onChange={(event) => {
  const valueType =
    event.target
      .value as
      JournalFieldValueType

  setCustomValueType(
    valueType,
  )

  updateSelectedField({
    valueType,
  })
}}
  >
    <option value="string">
      String
    </option>

    <option value="number">
      Number
    </option>
  </select>
</label>

<label>
  <span>
    Presentation
  </span>

  <select
    value={
      customPresentation
    }
    disabled={Boolean(selectedField?.isSystem)}
    onChange={(event) => {
  const presentation =
    event.target
      .value as
      JournalFieldPresentation

  setCustomPresentation(
    presentation,
  )

  updateSelectedField({
    presentation,
  })
}}
  >
    <option value="single">
      Single
    </option>

    <option value="multiple">
      Multiple
    </option>

    <option value="inline">
      Inline
    </option>
  </select>
</label>

            {!selectedField && (
  <button
    type="button"
    disabled={
      !customName.trim()
    }
    onClick={
      saveEditorField
    }
  >
    Add Field
  </button>
)}
          </div>
        </div>

        <div className="dialog-actions">
  <button
    type="button"
    onClick={onCancel}
  >
    Return
  </button>
</div>
      </div>
    </div>
  )
}
