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
import { JournalPage } from './JournalPage'
import { buildJournalDocument } from '../pagination/JournalDocumentBuilder'
import {
  paginateJournalDocument,
  type JournalPaginationMetrics,
} from '../pagination/JournalPaginator'

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

const [
  fontFamily,
  setFontFamily,
] = useState('Arial')

const [
  fontSize,
  setFontSize,
] = useState(14)

const pageContentRef =
  useRef<HTMLDivElement | null>(
    null,
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

 const journalDocument =
  useMemo(
    () =>
      activeEntry
        ? buildJournalDocument(
            activeEntry,
            project.fieldDefinitions,
          )
        : null,
    [
      activeEntry,
      project.fieldDefinitions,
    ],
  )

const paginationMetrics:
  JournalPaginationMetrics =
  useMemo(
    () => ({
      pageWidth: 0,
      pageHeight: 0,
      fontFamily,
      fontSize,
      lineHeight:
        Math.round(fontSize * 1.5),
      titleFontSize:
        Math.round(fontSize * 1.55),
      titleLineHeight:
        Math.round(fontSize * 2.1),
      fieldFontSize:
        fontSize,
      fieldLineHeight:
        Math.round(fontSize * 1.5),
      titleBottomGap: 28,
      fieldTopGap: 24,
      fieldBottomGap: 6,
      itemBottomGap: 6,
    }),
    [
        fontFamily,
        fontSize,
    ],
  )

const [pageSize, setPageSize] =
  useState({
    width: 0,
    height: 0,
  })

const pagination =
  useMemo(() => {
    if (
      !journalDocument ||
      pageSize.width <= 0 ||
      pageSize.height <= 0
    ) {
      return null
    }

    return paginateJournalDocument(
      journalDocument,
      {
        ...paginationMetrics,
        pageWidth:
          pageSize.width,
        pageHeight:
          pageSize.height,
      },
    )
  }, [
    journalDocument,
    pageSize,
    paginationMetrics,
  ])

  useEffect(() => {
  const element =
    pageContentRef.current

  if (!element) {
    return
  }

  const updateSize = () => {
    setPageSize({
      width:
        element.clientWidth,
      height:
        element.clientHeight,
    })
  }

  updateSize()

  const observer =
    new ResizeObserver(
      updateSize,
    )

  observer.observe(element)

  return () => {
    observer.disconnect()
  }
}, [
  activeEntry?.id,
])

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

function showEditNode(
  source: 'master' | 'user',
): boolean {
  if (!journal) {
    return false
  }

  if (
    journal.ownerName ===
    'Master'
  ) {
    return true
  }

  return source === 'user'
}

function handleEditItem(
  entryId: string,
  fieldDefinitionId: string,
  itemId: string,
) {
  console.log(
    'Edit Journal Item',
    {
      entryId,
      fieldDefinitionId,
      itemId,
    },
  )
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
  <label>
    Font

    <select
      disabled={!journal}
      value={fontFamily}
      onChange={(event) => {
        setFontFamily(
          event.target.value,
        )
      }}
    >
      <option value="Arial">
        Arial
      </option>

      <option value="Georgia">
        Georgia
      </option>

      <option value="Times New Roman">
        Times New Roman
      </option>

      <option value="Verdana">
        Verdana
      </option>
    </select>
  </label>

  <label>
    Size

    <select
      disabled={!journal}
      value={fontSize}
      onChange={(event) => {
        setFontSize(
          Number(
            event.target.value,
          ),
        )
      }}
    >
      <option value={10}>10</option>
      <option value={11}>11</option>
      <option value={12}>12</option>
      <option value={14}>14</option>
      <option value={16}>16</option>
      <option value={18}>18</option>
      <option value={20}>20</option>
      <option value={22}>22</option>
      <option value={24}>24</option>
    </select>
  </label>
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
              <JournalPage
                page={leftPage ?? undefined}
                pageNumber={leftPageIndex + 1}
                fontFamily={fontFamily}
                fontSize={fontSize}
                showEditNode={showEditNode}
                onEditItem={handleEditItem}
              />

              <JournalPage
                page={rightPage ?? undefined}
                pageNumber={rightPageIndex + 1}
                contentRef={pageContentRef}
                fontFamily={fontFamily}
                fontSize={fontSize}
                showEditNode={showEditNode}
                onEditItem={handleEditItem}
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