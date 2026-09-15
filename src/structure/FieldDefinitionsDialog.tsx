import {
  useState,
} from 'react'

import type {
  JournalFieldDefinition,
  JournalFieldValueType,
} from '../models/JournalFieldDefinition'

import {
  fieldPresets,
} from './FieldPresets'

interface FieldDefinitionsDialogProps {
  fieldDefinitions:
    JournalFieldDefinition[]

  onSave: (
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
  onSave,
  onCancel,
}: FieldDefinitionsDialogProps) {
  const [fields, setFields] =
    useState<JournalFieldDefinition[]>(
      () => {
        const existingTitle =
          fieldDefinitions.find(
            (field) =>
              field.isSystem &&
              field.name === 'Title',
          )

        const title:
          JournalFieldDefinition =
          existingTitle ?? {
            id: crypto.randomUUID(),
            name: 'Title',
            valueType: 'text',
            order: 0,
            isSystem: true,
          }

        const remaining =
          fieldDefinitions
            .filter(
              (field) =>
                field.id !== title.id,
            )
            .sort(
              (left, right) =>
                left.order -
                right.order,
            )

        return normalizeOrder([
          title,
          ...remaining,
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
      'richText',
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

  function selectPreset(
    presetIndex: number,
  ) {
    setSelectedPresetIndex(
      presetIndex,
    )

    setSelectedFieldId(null)
  }

  function selectField(
    fieldId: string,
  ) {
    setSelectedFieldId(
      fieldId,
    )

    setSelectedPresetIndex(null)
  }

  function addSelectedPreset() {
    if (
      selectedPresetIndex ===
      null
    ) {
      return
    }

    const preset =
      fieldPresets[
        selectedPresetIndex
      ]

    if (!preset) {
      return
    }

    const alreadyIncluded =
      fields.some(
        (field) =>
          field.name ===
          preset.name,
      )

    if (alreadyIncluded) {
      return
    }

    setFields(
      normalizeOrder([
        ...fields,
        {
          id: crypto.randomUUID(),
          ...preset,
          order: fields.length,
        },
      ]),
    )

    setSelectedPresetIndex(null)
  }

  function removeSelectedField() {
    if (
      !selectedField ||
      selectedField.isSystem
    ) {
      return
    }

    setFields(
      normalizeOrder(
        fields.filter(
          (field) =>
            field.id !==
            selectedField.id,
        ),
      ),
    )

    setSelectedFieldId(null)
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

    const targetIndex =
      index + direction

    if (
      targetIndex < 1 ||
      targetIndex >=
        fields.length
    ) {
      return
    }

    const reordered =
      [...fields]

    const [field] =
      reordered.splice(
        index,
        1,
      )

    reordered.splice(
      targetIndex,
      0,
      field,
    )

    setFields(
      normalizeOrder(
        reordered,
      ),
    )
  }

  function addCustomField() {
    const name =
      customName.trim()

    if (!name) {
      return
    }

    const alreadyIncluded =
      fields.some(
        (field) =>
          field.name
            .toLocaleLowerCase() ===
          name.toLocaleLowerCase(),
      )

    if (alreadyIncluded) {
      return
    }

    const field:
  JournalFieldDefinition = {
    id: crypto.randomUUID(),
    name,
    valueType:
      customValueType,
    order: fields.length,
}

    setFields(
      normalizeOrder([
        ...fields,
        field,
      ]),
    )

    setCustomName('')

    setSelectedPresetIndex(null)

    setSelectedFieldId(
      field.id,
    )
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
    transferDisabled = false
    transferAction =
      addSelectedPreset
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
            setSelectedPresetIndex(null)
            setSelectedFieldId(null)
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
                            index <= 1
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
                            fields.length -
                              1
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

        <div className="structure-custom-field">
          <h3>
            Create Custom Field
          </h3>

          <div className="structure-custom-row">
            <label>
              <span>Name</span>

              <input
                value={customName}
                onChange={(event) => {
                  setCustomName(
                    event.target.value,
                  )
                }}
              />
            </label>
          </div>

          <div className="structure-custom-row">
            <label>
              <span>
                Value Type
              </span>

              <select
                value={
                  customValueType
                }
                onChange={(event) => {
                  setCustomValueType(
                    event.target
                      .value as
                      JournalFieldValueType,
                  )
                }}
              >
                <option value="text">
                  Text
                </option>

                <option value="richText">
                  Rich Text
                </option>

                <option value="number">
                  Number
                </option>

                <option value="boolean">
                  Boolean
                </option>

                <option value="date">
                  Date
                </option>

                <option value="tags">
                  Tags
                </option>

                <option value="reference">
                  Reference
                </option>
              </select>
            </label>            

            <button
              type="button"
              disabled={
                !customName.trim()
              }
              onClick={
                addCustomField
              }
            >
              Add Field
            </button>
          </div>
        </div>

        <div className="dialog-actions">
          <button
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onSave(
                normalizeOrder(
                  fields,
                ),
              )
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}