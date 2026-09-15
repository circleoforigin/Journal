import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { JournalEntry } from '../models/JournalEntry'
import type { JournalFieldItem } from '../models/JournalField'
import { entryRepository } from '../entries/EntryRepository'
import { journalRepository } from '../journals/JournalRepository'
import type { Project } from '../models/Project'
import type { Journal } from '../models/Journal'
import { JournalFieldEditor } from './JournalFieldEditor'
import { useJournalPagination } from '../pagination/useJournalPagination'
import { JournalPage } from './JournalPage'

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

const [
  spreadIndex,
  setSpreadIndex,
] = useState(0)

const pageContentRef =
  useRef<HTMLDivElement | null>(
    null,
  )

const readability =
  useMemo(
    () => ({
      fontFamily: 'Arial',
      fontSize: 14,
    }),
    [],
  )

const languages =
  useMemo(
    () => [],
    [],
  )

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

  const titleItem =
    entry.fields[
      titleDefinition.id
    ]?.items[0]

  const value =
    titleItem?.value

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

  const pagination =
  useJournalPagination({
    entry: activeEntry,

    fieldDefinitions:
      project.fieldDefinitions,

    pageContentRef,

    readability,

    languages,
  })  

  useEffect(() => {
    setSpreadIndex(0)
  }, [activeEntryId])

  const leftPageIndex =
  spreadIndex * 2

const rightPageIndex =
  leftPageIndex + 1

const leftPage =
  pagination?.pages[
    leftPageIndex
  ] ?? null

const rightPage =
  pagination?.pages[
    rightPageIndex
  ] ?? null

  const hasPreviousSpread =
  spreadIndex > 0

const hasNextSpread =
  pagination
    ? leftPageIndex + 2 <
      pagination.pages.length
    : false

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
    items: [
      {
        id: crypto.randomUUID(),
        order: 0,
        value: 'New Entry',
        source: 'master',
        createdAt: now,
        updatedAt: now,
      },
    ],
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
        items: [],
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

async function updateFieldItems(
  fieldDefinitionId: string,
  items: JournalFieldItem[],
) {
  if (!activeEntry) {
    return
  }

  const updatedEntry: JournalEntry = {
    ...activeEntry,

    fields: {
      ...activeEntry.fields,

      [fieldDefinitionId]: {
        items,
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

  const existingTitleItem =
  activeEntry.fields[
    titleDefinition.id
  ]?.items[0]

const now =
  new Date().toISOString()

const titleItem:
  JournalFieldItem = {
  id:
    existingTitleItem?.id ??
    crypto.randomUUID(),

  order: 0,

  value:
    value || 'New Entry',

  source: 'master',

  createdAt:
    existingTitleItem
      ?.createdAt ?? now,

  updatedAt: now,
}

  const updatedEntry: JournalEntry = {
    ...activeEntry,

    fields: {
      ...activeEntry.fields,

      [titleDefinition.id]: {
        items: [
            titleItem,
        ],
      },
    },

    updatedAt: now,
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
                <button
                    type="button"
                    className="journal-page-turn journal-page-turn-previous"
                    disabled={!hasPreviousSpread}
                    aria-label="Previous pages"
                    onClick={() => {
                        setSpreadIndex(
                        (current) =>
                            Math.max(
                            0,
                            current - 1,
                            ),
                        )
                    }}
                    />
              <div className="journal-page journal-page-left">
                <div className="journal-page-content">
  {activeEntry && (
  <>
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

    <div className="journal-entry-fields">
      {activeFieldDefinitions.map(
        (fieldDefinition) => {
          const field =
            activeEntry.fields[
              fieldDefinition.id
            ]          

          return (
  <JournalFieldEditor
    key={fieldDefinition.id}
    fieldDefinition={
      fieldDefinition
    }
    items={
      field?.items ?? []
    }

    onItemsChange={(items) => {
        void updateFieldItems(
        fieldDefinition.id,
        items,
        )
    }}
  />
)
        },
      )}
    </div>
  </>
)}
</div>

                <div className="journal-page-number">
                  1
                </div>
              </div>

              <JournalPage
  page={rightPage}
  pageNumber={
    rightPageIndex + 1
  }
  side="right"
  contentRef={pageContentRef}
/>

              <button
  type="button"
  className="journal-page-turn journal-page-turn-next"
  disabled={!hasNextSpread}
  aria-label="Next pages"
  onClick={() => {
    setSpreadIndex(
      (current) =>
        current + 1,
    )
  }}
/>
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