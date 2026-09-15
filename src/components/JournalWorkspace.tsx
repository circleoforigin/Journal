import {
  useEffect,
  useState,
} from 'react'

import type {
  JournalEntry,
} from '../models/JournalEntry'

import {
  entryRepository,
} from '../entries/EntryRepository'

import {
  journalRepository,
} from '../journals/JournalRepository'

import type {
  Project,
} from '../models/Project'

import type {
  Journal,
} from '../models/Journal'

interface JournalWorkspaceProps {
  project: Project
  journal: Journal | null
}
interface JournalWorkspaceProps {
  project: Project
  journal: Journal | null

  onJournalChange: (
    journal: Journal,
  ) => void
}

export function JournalWorkspace({
  project,
  journal,
  onJournalChange,
}: JournalWorkspaceProps) 
{
const [
  entries,
  setEntries,
] = useState<JournalEntry[]>([])

const [
  activeEntryId,
  setActiveEntryId,
] = useState<string | null>(null)

const titleDefinition =
  project.fieldDefinitions.find(
    (field) =>
      field.isSystem &&
      field.name === 'Title',
  )

  const sections =
    [...project.sectionDefinitions]
      .sort(
        (left, right) =>
          left.order -
          right.order,
      )

function getEntryTitle(
  entry: JournalEntry,
): string {
  if (!titleDefinition) {
    return 'New Entry'
  }

  const value =
    entry.fields[
      titleDefinition.id
    ]?.value

  return typeof value === 'string' &&
    value.trim()
      ? value
      : 'New Entry'
}

const activeEntry =
  entries.find(
    (entry) =>
      entry.id === activeEntryId,
  ) ?? null

  const availableFieldDefinitions =
  project.fieldDefinitions
    .filter(
      (field) =>
        !field.isSystem &&
        activeEntry &&
        !activeEntry.fields[
          field.id
        ],
    )
    .sort(
      (left, right) =>
        left.order -
        right.order,
    )

    const activeFieldDefinitions =
  project.fieldDefinitions
    .filter(
      (field) =>
        !field.isSystem &&
        activeEntry?.fields[
          field.id
        ],
    )
    .sort(
      (left, right) =>
        left.order -
        right.order,
    )

  useEffect(() => {
  let cancelled = false

  async function loadEntries() {
    if (!journal) {
      setEntries([])
      setActiveEntryId(null)
      return
    }

    const loaded =
      await Promise.all(
        journal.entryIds.map(
          (entryId) =>
            entryRepository
              .loadEntry(entryId),
        ),
      )

    if (cancelled) {
      return
    }

    const validEntries =
      loaded.filter(
        (
          entry,
        ): entry is JournalEntry =>
          entry !== null,
      )

    setEntries(validEntries)

    setActiveEntryId(
      (current) => {
        if (
          current &&
          validEntries.some(
            (entry) =>
              entry.id === current,
          )
        ) {
          return current
        }

        return validEntries[0]?.id ??
          null
      },
    )
  }

  void loadEntries()

  return () => {
    cancelled = true
  }
}, [journal?.id])

async function createEntry(
  sectionDefinitionId: string,
) {
  if (
    !journal ||
    !titleDefinition
  ) {
    return
  }

  const now =
    new Date().toISOString()

  const entry: JournalEntry = {
    id: crypto.randomUUID(),

    sectionDefinitionId,

    fields: {
      [titleDefinition.id]: {
        value: 'New Entry',
      },
    },

    createdAt: now,
    updatedAt: now,
  }

  await entryRepository
    .saveEntry(entry)

  const updatedJournal: Journal = {
    ...journal,

    entryIds: [
      ...journal.entryIds,
      entry.id,
    ],

    updatedAt: now,
  }

  await journalRepository
    .saveJournal(updatedJournal)

  setEntries(
    (current) => [
      ...current,
      entry,
    ],
  )

  setActiveEntryId(
    entry.id,
  )

  onJournalChange(
    updatedJournal,
  )
}

async function addFieldToEntry(
  fieldDefinitionId: string,
) {
  if (!activeEntry) {
    return
  }

  const fieldDefinition =
    project.fieldDefinitions.find(
      (field) =>
        field.id ===
        fieldDefinitionId,
    )

  if (
    !fieldDefinition ||
    fieldDefinition.isSystem ||
    activeEntry.fields[
      fieldDefinition.id
    ]
  ) {
    return
  }

  const updatedEntry: JournalEntry = {
    ...activeEntry,

    fields: {
      ...activeEntry.fields,

      [fieldDefinition.id]: {
        value: '',
      },
    },

    updatedAt:
      new Date().toISOString(),
  }

  setEntries(
    (current) =>
      current.map(
        (entry) =>
          entry.id ===
          updatedEntry.id
            ? updatedEntry
            : entry,
      ),
  )

  await entryRepository
    .saveEntry(updatedEntry)
}

async function updateEntryTitle(
  value: string,
) {
  if (
    !activeEntry ||
    !titleDefinition
  ) {
    return
  }

  const updatedEntry: JournalEntry = {
    ...activeEntry,

    fields: {
      ...activeEntry.fields,

      [titleDefinition.id]: {
        ...activeEntry.fields[
          titleDefinition.id
        ],

        value:
          value || 'New Entry',
      },
    },

    updatedAt:
      new Date().toISOString(),
  }

  setEntries(
    (current) =>
      current.map(
        (entry) =>
          entry.id ===
          updatedEntry.id
            ? updatedEntry
            : entry,
      ),
  )

  await entryRepository
    .saveEntry(updatedEntry)
}  

  return (
    <div className="journal-editor">
      <aside className="journal-inspector">
        <div className="journal-inspector-header">
          <button
            type="button"
            className="journal-inspector-tab active"
          >
            ToC
          </button>

          <button
            type="button"
            className="journal-inspector-tab"
          >
            Search
          </button>
        </div>

        <div className="journal-toc">
          {sections.length === 0 ? (
            <div className="journal-toc-empty">
              No sections configured.
            </div>
          ) : (
            sections.map(
              (section) => (
                <div
                  key={section.id}
                  className="journal-toc-section"
                >
                  <div className="journal-toc-section-header">
                    <span>
                      {section.name}
                    </span>

                    <button
  type="button"
  className="journal-toc-add"
  title={`Add entry to ${section.name}`}
  disabled={
    !journal ||
    !titleDefinition
  }
  onClick={() => {
    void createEntry(
      section.id,
    )
  }}
>
  +
                    </button>
                  </div>

                  <div className="journal-toc-entries">
  {entries
    .filter(
      (entry) =>
        entry.sectionDefinitionId ===
        section.id,
    )
    .sort(
      (left, right) =>
        getEntryTitle(left)
          .localeCompare(
            getEntryTitle(right),
          ),
    )
    .map(
      (entry) => (
        <button
          key={entry.id}
          type="button"
          className={
            entry.id === activeEntryId
              ? 'journal-toc-entry active'
              : 'journal-toc-entry'
          }
          onClick={() => {
            setActiveEntryId(
              entry.id,
            )
          }}
        >
          {getEntryTitle(entry)}
        </button>
      ),
    )}
</div>
                </div>
              ),
            )
          )}
        </div>

        <div className="journal-add-field">
          <span>
            Add Field
          </span>

          <select
  disabled={
    !activeEntry ||
    availableFieldDefinitions
      .length === 0
  }
  value=""
  onChange={(event) => {
    const fieldDefinitionId =
      event.target.value

    if (!fieldDefinitionId) {
      return
    }

    void addFieldToEntry(
      fieldDefinitionId,
    )
  }}
>
  <option value="">
    Select field...
  </option>

  {availableFieldDefinitions.map(
    (field) => (
      <option
        key={field.id}
        value={field.id}
      >
        {field.name}
      </option>
    ),
  )}
</select>
        </div>
      </aside>

      <section className="journal-editor-main">
        <header className="journal-editor-header">
          <div className="journal-editor-title">
            {journal
              ? `Journal - ${journal.ownerName}`
              : 'No Journal Open'}
          </div>

          <div className="journal-format-controls">
            <button
              type="button"
              disabled={!journal}
              title="Bold"
            >
              <strong>B</strong>
            </button>

            <button
              type="button"
              disabled={!journal}
              title="Italic"
            >
              <em>I</em>
            </button>

            <button
              type="button"
              disabled={!journal}
              title="Underline"
            >
              <span className="journal-underline">
                U
              </span>
            </button>
          </div>
        </header>

        <div className="journal-book-area">
          {journal ? (
            <div className="journal-book">
              <div className="journal-page journal-page-left">
                <div className="journal-page-content">
  {activeEntry && (
    <input
      key={activeEntry.id}
      className="journal-entry-title"
      defaultValue={
        getEntryTitle(
          activeEntry,
        )
      }
      onBlur={(event) => {
        void updateEntryTitle(
          event.currentTarget.value
            .trim(),
        )
      }}
      onKeyDown={(event) => {
        if (
          event.key === 'Enter'
        ) {
          event.preventDefault()

          event.currentTarget
            .blur()
        }
      }}
      aria-label="Entry title"
    />
  )}
</div>

                <div className="journal-page-number">
                  1
                </div>
              </div>

              <div className="journal-page journal-page-right">
                <div className="journal-page-content" />

                <div className="journal-page-number">
                  2
                </div>
              </div>
            </div>
          ) : (
            <div className="journal-no-journal">
              <h2>
                {project.name}
              </h2>

              <p>
                Create or open a Journal to begin.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}