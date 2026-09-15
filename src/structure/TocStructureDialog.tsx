import {
  useState,
} from 'react'

import type {
  JournalSectionDefinition,
} from '../models/JournalSectionDefinition'

import {
  sectionPresets,
} from './SectionPresets'

interface TocStructureDialogProps {
  sectionDefinitions:
    JournalSectionDefinition[]

  onSave: (
    sectionDefinitions:
      JournalSectionDefinition[],
  ) => void

  onCancel: () => void
}

function normalizeOrder(
  sections:
    JournalSectionDefinition[],
): JournalSectionDefinition[] {
  return sections.map(
    (section, index) => ({
      ...section,
      order: index,
    }),
  )
}

export function TocStructureDialog({
  sectionDefinitions,
  onSave,
  onCancel,
}: TocStructureDialogProps) {
  const [
    sections,
    setSections,
  ] =
    useState<
      JournalSectionDefinition[]
    >(
      () =>
        normalizeOrder(
          [...sectionDefinitions]
            .sort(
              (left, right) =>
                left.order -
                right.order,
            ),
        ),
    )

  const [
    selectedPreset,
    setSelectedPreset,
  ] = useState<string | null>(
    null,
  )

  const [
    selectedSectionId,
    setSelectedSectionId,
  ] = useState<string | null>(
    null,
  )

  const [
    customName,
    setCustomName,
  ] = useState('')

  const availablePresets =
    sectionPresets.filter(
      (preset) =>
        !sections.some(
          (section) =>
            section.name ===
            preset,
        ),
    )

  const selectedSection =
    sections.find(
      (section) =>
        section.id ===
        selectedSectionId,
    ) ?? null

  function selectPreset(
    preset: string,
  ) {
    setSelectedPreset(preset)
    setSelectedSectionId(null)
  }

  function selectSection(
    sectionId: string,
  ) {
    setSelectedSectionId(
      sectionId,
    )

    setSelectedPreset(null)
  }

  function addSelectedPreset() {
    if (!selectedPreset) {
      return
    }

    const alreadyIncluded =
      sections.some(
        (section) =>
          section.name ===
          selectedPreset,
      )

    if (alreadyIncluded) {
      return
    }

    setSections(
      normalizeOrder([
        ...sections,
        {
          id: crypto.randomUUID(),
          name: selectedPreset,
          order: sections.length,
        },
      ]),
    )

    setSelectedPreset(null)
  }

  function removeSelectedSection() {
    if (!selectedSection) {
      return
    }

    setSections(
      normalizeOrder(
        sections.filter(
          (section) =>
            section.id !==
            selectedSection.id,
        ),
      ),
    )

    setSelectedSectionId(null)
  }

  function moveSection(
    sectionId: string,
    direction: -1 | 1,
  ) {
    const index =
      sections.findIndex(
        (section) =>
          section.id ===
          sectionId,
      )

    if (index < 0) {
      return
    }

    const targetIndex =
      index + direction

    if (
      targetIndex < 0 ||
      targetIndex >=
        sections.length
    ) {
      return
    }

    const reordered =
      [...sections]

    const [section] =
      reordered.splice(
        index,
        1,
      )

    reordered.splice(
      targetIndex,
      0,
      section,
    )

    setSections(
      normalizeOrder(
        reordered,
      ),
    )
  }

  function addCustomSection() {
    const name =
      customName.trim()

    if (!name) {
      return
    }

    const alreadyIncluded =
      sections.some(
        (section) =>
          section.name
            .toLocaleLowerCase() ===
          name.toLocaleLowerCase(),
      )

    if (alreadyIncluded) {
      return
    }

    const section:
      JournalSectionDefinition = {
        id: crypto.randomUUID(),
        name,
        order: sections.length,
      }

    setSections(
      normalizeOrder([
        ...sections,
        section,
      ]),
    )

    setCustomName('')
    setSelectedPreset(null)

    setSelectedSectionId(
      section.id,
    )
  }

  let transferLabel =
    'SELECT'

  let transferDisabled =
    true

  let transferAction:
    (() => void) | undefined

  if (selectedPreset) {
    transferLabel = 'ADD'
    transferDisabled = false
    transferAction =
      addSelectedPreset
  } else if (selectedSection) {
    transferLabel = 'REMOVE'
    transferDisabled = false
    transferAction =
      removeSelectedSection
  }

  return (
    <div className="dialog-backdrop">
      <div
        className="dialog structure-dialog"
        onClick={() => {
            setSelectedPreset(null)
            setSelectedSectionId(null)
        }}
      >
        <h2>
          Table of Contents
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
              (preset) => (
                <button
                  key={preset}
                  type="button"
                  className={
                    selectedPreset ===
                    preset
                      ? 'structure-list-item selected'
                      : 'structure-list-item'
                  }
                  onClick={(event) => {
                    event.stopPropagation()

                    selectPreset(
                        preset,
                        )
                  }}
                >
                  {preset}
                </button>
              ),
            )}
          </div>

          <div className="structure-list">
            {sections.map(
              (
                section,
                index,
              ) => (
                <div
                  key={section.id}
                  className={
                    selectedSectionId ===
                    section.id
                      ? 'structure-included-row selected'
                      : 'structure-included-row'
                  }
                >
                  <button
                    type="button"
                    className="structure-field-select"
                    onClick={(event) => {
                        event.stopPropagation()

                        selectSection(
                            section.id,
                            )
                    }}
                  >
                    {section.name}
                  </button>

                  {selectedSectionId ===
                    section.id && (
                    <div className="structure-order-controls">
                      <button
                        type="button"
                        disabled={
                          index === 0
                        }
                        onClick={(event) => {
                            event.stopPropagation()

                            moveSection(
                                section.id,
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
                          sections.length -
                            1
                        }
                        onClick={(event) => {
                            event.stopPropagation()

                            moveSection(
                                section.id,
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
            Create Custom Section
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

                onKeyDown={(event) => {
                  if (
                    event.key ===
                    'Enter'
                  ) {
                    addCustomSection()
                  }
                }}
              />
            </label>

            <button
              type="button"
              disabled={
                !customName.trim()
              }
              onClick={
                addCustomSection
              }
            >
              Add Section
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
                  sections,
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