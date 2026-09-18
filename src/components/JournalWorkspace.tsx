import {
  useEffect,
  useRef,
  useMemo,
  useState,
} from 'react'

import type { JournalEntry } from '../models/JournalEntry'
import type { JournalFieldItem } from '../models/JournalField'
import { entryRepository } from '../entries/EntryRepository'
import { journalRepository } from '../journals/JournalRepository'
import type { Project } from '../models/Project'
import type { Journal } from '../models/Journal'
import { JournalPage } from './JournalPage'
import { JournalItemEditor } from './JournalItemEditor'
import { NewPageDialog } from '../entries/NewPageDialog'
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

  onReadabilityChange: (
    fontFamily: string,
    fontSize: number,
  ) => void
}

export function JournalWorkspace({
  project,
  journal,
  onJournalChange,
  onReadabilityChange,
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
  pageIndex,
  setPageIndex,
] = useState(0)

const [
  pendingEntryNavigationId,
  setPendingEntryNavigationId,
] = useState<string | null>(
  null,
)

const [
  singlePageMode,
  setSinglePageMode,
] = useState(false)

const documentTabsRef =
  useRef<HTMLDivElement | null>(
    null,
  )

const [
  canScrollTabsLeft,
  setCanScrollTabsLeft,
] = useState(false)

const [
  canScrollTabsRight,
  setCanScrollTabsRight,
] = useState(false)

const bookAreaRef =
  useRef<HTMLDivElement | null>(
    null,
  )

  function updateDocumentTabScrollState() {
  const tabStrip =
    documentTabsRef.current

  if (!tabStrip) {
    setCanScrollTabsLeft(false)
    setCanScrollTabsRight(false)
    return
  }

  const maxScrollLeft =
    tabStrip.scrollWidth -
    tabStrip.clientWidth

  setCanScrollTabsLeft(
    tabStrip.scrollLeft > 1,
  )

  setCanScrollTabsRight(
    tabStrip.scrollLeft <
      maxScrollLeft - 1,
  )
}

function scrollDocumentTabs(
  direction: 'left' | 'right',
) {
  const tabStrip =
    documentTabsRef.current

  if (!tabStrip) {
    return
  }

  tabStrip.scrollBy({
    left:
      direction === 'left'
        ? -200
        : 200,
    behavior: 'smooth',
  })
}

useEffect(() => {
  const tabStrip =
    documentTabsRef.current

  if (!tabStrip) {
    return
  }

  const handleScroll = () => {
    updateDocumentTabScrollState()
  }

  const resizeObserver =
    new ResizeObserver(() => {
      updateDocumentTabScrollState()
    })

  resizeObserver.observe(
    tabStrip,
  )

  tabStrip.addEventListener(
    'scroll',
    handleScroll,
  )

  updateDocumentTabScrollState()

  return () => {
    resizeObserver.disconnect()

    tabStrip.removeEventListener(
      'scroll',
      handleScroll,
    )
  }
}, [])

const fontFamily =
  project.readability
    ?.fontFamily ?? 'Arial'

const fontSize =
  project.readability
    ?.fontSize ?? 14

const titleFontSize =
  fontSize * 1.75

const titleLineHeight =
  titleFontSize * 1.25

  const [
  searchText,
  setSearchText,
] = useState('')

const [
  searchHighlight,
  setSearchHighlight,
] = useState<{
  pageIndex: number
  fragmentIndex: number
  start: number
  end: number
} | null>(null)

const [
  editingItem,
  setEditingItem,
] = useState<{
  entryId: string
  fieldDefinitionId: string
  itemId: string
  value: string
} | null>(null)

const [
  newPageSectionId,
  setNewPageSectionId,
] = useState<string | null>(null)

const [
  editingPageEntryId,
  setEditingPageEntryId,
] = useState<string | null>(null)

const titleDefinition =
  project.fieldDefinitions.find(
    (field) =>
      field.isSystem &&
      field.name === 'Title',
  )

  const subtitleDefinition =
  project.fieldDefinitions.find(
    (field) =>
      field.isSystem &&
      field.name === 'Subtitle',
  )

const briefDefinition =
  project.fieldDefinitions.find(
    (field) =>
      field.isSystem &&
      field.name === 'Brief',
  )

const notesDefinition =
  project.fieldDefinitions.find(
    (field) =>
      field.isSystem &&
      field.name === 'Notes',
  )

  const sections =
  useMemo(
    () =>
      [
        ...project
          .sectionDefinitions,
      ].sort(
        (left, right) =>
          left.order -
          right.order,
      ),
    [
      project
        .sectionDefinitions,
    ],
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

const JOURNAL_TEXT_WIDTH = 400
const JOURNAL_TEXT_HEIGHT = 490

const paginationMetrics:
  JournalPaginationMetrics =
  useMemo(
    () => ({
      pageWidth:
        JOURNAL_TEXT_WIDTH,

      pageHeight:
        JOURNAL_TEXT_HEIGHT,

      fontFamily,
      fontSize,

      lineHeight:
        Math.round(
          fontSize * 1.5,
        ),

      titleFontSize,
      titleLineHeight,

      fieldFontSize:
        fontSize,

      fieldLineHeight:
        Math.round(
          fontSize * 1.5,
        ),

      titleBottomGap: 20,
      fieldTopGap: 0,
      fieldBottomGap: 0,
      itemBottomGap: 6,
    }),
    [
      fontFamily,
      fontSize,
      titleFontSize,
      titleLineHeight,
    ],
  )

const journalPagination =
  useMemo(() => {
    const pages:
      ReturnType<
        typeof paginateJournalDocument
      >['pages'] = []

    const entryStartPages =
      new Map<string, number>()

    /*
     * Physical Journal reading order:
     *
     * 1. Sections follow their
     *    configured order.
     *
     * 2. Entries within each Section
     *    are alphabetical by Title.
     */
    const orderedEntries =
      sections.flatMap(
        (section) =>
          entries
            .filter(
              (entry) =>
                entry
                  .sectionDefinitionId ===
                section.id,
            )
            .sort(
              (left, right) =>
                getEntryTitle(left)
                  .localeCompare(
                    getEntryTitle(
                      right,
                    ),
                  ),
            ),
      )

    for (
      const entry
      of orderedEntries
    ) {
      const journalDocument =
        buildJournalDocument(
          entry,
          project.fieldDefinitions,
        )

      const entryPagination =
        paginateJournalDocument(
          journalDocument,
          paginationMetrics,
        )

      entryStartPages.set(
        entry.id,
        pages.length,
      )

      for (
        const page
        of entryPagination.pages
      ) {
        pages.push({
          ...page,

          pageIndex:
            pages.length,
        })
      }
    }

    return {
      pages,
      entryStartPages,
    }
  }, [
    entries,
    sections,
    project.fieldDefinitions,
    paginationMetrics,
    titleDefinition,
  ])

  useEffect(() => {
  const element =
    bookAreaRef.current

  if (!element) {
    return
  }

  const updatePageMode = () => {
    const twoPageMinimumWidth =
      475 +
      8 +
      475 +
      40

    setSinglePageMode(
      element.clientWidth <
        twoPageMinimumWidth,
    )
  }

  updatePageMode()

  const observer =
    new ResizeObserver(
      updatePageMode,
    )

  observer.observe(element)

  return () => {
    observer.disconnect()
  }
}, [])

useEffect(() => {
  if (
    !singlePageMode &&
    pageIndex % 2 !== 0
  ) {
    setPageIndex(
      pageIndex - 1,
    )
  }
}, [
  singlePageMode,
  pageIndex,
])

useEffect(() => {
  if (
    journalPagination
      .pages.length === 0
  ) {
    if (pageIndex !== 0) {
      setPageIndex(0)
    }

    return
  }

  if (
    pageIndex >=
    journalPagination.pages.length
  ) {
    const lastPageIndex =
      journalPagination
        .pages.length - 1

    setPageIndex(
      singlePageMode
        ? lastPageIndex
        : lastPageIndex -
            (lastPageIndex % 2),
    )
  }
}, [
  journalPagination.pages.length,
  pageIndex,
  singlePageMode,
])

function navigateToEntry(
  entryId: string,
) {
  clearSearchPosition()

  const startPage =
    journalPagination
      .entryStartPages
      .get(entryId)

  if (startPage === undefined) {
    return
  }

  setActiveEntryId(entryId)

  setPageIndex(
    singlePageMode
      ? startPage
      : startPage -
          (startPage % 2),
  )
}

useEffect(() => {
  if (
    !pendingEntryNavigationId
  ) {
    return
  }

  if (
    !journalPagination
      .entryStartPages
      .has(
        pendingEntryNavigationId,
      )
  ) {
    return
  }

  navigateToEntry(
    pendingEntryNavigationId,
  )

  setPendingEntryNavigationId(
    null,
  )
}, [
  pendingEntryNavigationId,
  journalPagination,
])

useEffect(() => {
  /*
   * When an Entry has requested
   * navigation, that navigation is
   * authoritative.
   *
   * Pagination may already have
   * rearranged while pageIndex still
   * points at the old physical page.
   * Do not let that temporary page
   * position select another Entry.
   */
  if (
    pendingEntryNavigationId
  ) {
    return
  }

  let visibleEntryId:
    string | null = null

  for (
    const [
      entryId,
      startPage,
    ]
    of journalPagination
      .entryStartPages
  ) {
    if (
      startPage <= pageIndex &&
      (
        visibleEntryId === null ||
        startPage >
          (
            journalPagination
              .entryStartPages
              .get(
                visibleEntryId,
              ) ?? -1
          )
      )
    ) {
      visibleEntryId =
        entryId
    }
  }

  if (
    visibleEntryId &&
    visibleEntryId !==
      activeEntryId
  ) {
    setActiveEntryId(
      visibleEntryId,
    )
  }
}, [
  pageIndex,
  journalPagination,
  activeEntryId,
  pendingEntryNavigationId,
])

  const leftPageIndex =
  pageIndex

const rightPageIndex =
  pageIndex + 1

const leftPage =
  journalPagination.pages[
    leftPageIndex
  ] ?? null

const rightPage =
  !singlePageMode
    ? journalPagination.pages[
        rightPageIndex
      ] ?? null
    : null

const pageStep =
  singlePageMode
    ? 1
    : 2

function isBlankPage(
  index: number,
): boolean {
  const page =
    journalPagination.pages[
      index
    ]

  return Boolean(
    page &&
    page.fragments.length === 0,
  )
}

function getPreviousPageIndex(
  currentIndex: number,
): number | null {
  if (!singlePageMode) {
    const previousIndex =
      currentIndex - 2

    return previousIndex >= 0
      ? previousIndex
      : null
  }

  let previousIndex =
    currentIndex - 1

  while (
    previousIndex >= 0 &&
    isBlankPage(previousIndex)
  ) {
    previousIndex -= 1
  }

  return previousIndex >= 0
    ? previousIndex
    : null
}

function getNextPageIndex(
  currentIndex: number,
): number | null {
  if (!singlePageMode) {
    const nextIndex =
      currentIndex + 2

    return nextIndex <
      journalPagination.pages.length
      ? nextIndex
      : null
  }

  let nextIndex =
    currentIndex + 1

  while (
    nextIndex <
      journalPagination.pages.length &&
    isBlankPage(nextIndex)
  ) {
    nextIndex += 1
  }

  return nextIndex <
    journalPagination.pages.length
    ? nextIndex
    : null
}

const hasPreviousPage =
  getPreviousPageIndex(
    pageIndex,
  ) !== null

const hasNextPage =
  getNextPageIndex(
    pageIndex,
  ) !== null

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
    setPageIndex(0)

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
  title: string,
  subtitle: string,
  brief: string,
) {
  if (
    !journal ||
    !titleDefinition ||
    !subtitleDefinition ||
    !briefDefinition ||
    !notesDefinition
  ) {
    return
  }

  const section =
    sections.find(
      (candidate) =>
        candidate.id ===
        sectionDefinitionId,
    )

  if (
    !section ||
    section.isSystem
  ) {
    return
  }

  const trimmedTitle =
    title.trim()

  const trimmedBrief =
    brief.trim()

  if (
    !trimmedTitle ||
    !trimmedBrief
  ) {
    return
  }

  const now =
    new Date().toISOString()

  function createSystemItem(
    value: string,
  ): JournalFieldItem {
    return {
      id: crypto.randomUUID(),
      order: 0,
      value,
      source: 'master',
      createdAt: now,
      updatedAt: now,
    }
  }

  const entry: JournalEntry = {
    id: crypto.randomUUID(),

    sectionDefinitionId,

    fields: {
      [titleDefinition.id]: {
        items: [
          createSystemItem(
            trimmedTitle,
          ),
        ],
      },

      [subtitleDefinition.id]: {
        items: [
          createSystemItem(
            subtitle.trim(),
          ),
        ],
      },

      [briefDefinition.id]: {
        items: [
          createSystemItem(
            trimmedBrief,
          ),
        ],
      },

      [notesDefinition.id]: {
        items: [
          createSystemItem(''),
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

  setPendingEntryNavigationId(
    entry.id,
  )

  setNewPageSectionId(null)

  onJournalChange(
    updatedJournal,
  )
}

async function updatePageHeader(
  entryId: string,
  title: string,
  subtitle: string,
  brief: string,
) {
  if (
    !titleDefinition ||
    !subtitleDefinition ||
    !briefDefinition
  ) {
    return
  }

  const entry =
    entries.find(
      (candidate) =>
        candidate.id === entryId,
    )

  if (!entry) {
    return
  }

  const trimmedTitle =
    title.trim()

  const trimmedBrief =
    brief.trim()

  if (
    !trimmedTitle ||
    !trimmedBrief
  ) {
    return
  }

  const now =
    new Date().toISOString()

  function updateSystemItem(
    fieldDefinitionId: string,
    value: string,
  ): JournalFieldItem {
    const existing =
      entry.fields[
        fieldDefinitionId
      ]?.items[0]

    return {
      id:
        existing?.id ??
        crypto.randomUUID(),

      order: 0,

      value,

      source: 'master',

      createdAt:
        existing?.createdAt ??
        now,

      updatedAt: now,
    }
  }

  const updatedEntry:
    JournalEntry = {
    ...entry,

    fields: {
      ...entry.fields,

      [titleDefinition.id]: {
        items: [
          updateSystemItem(
            titleDefinition.id,
            trimmedTitle,
          ),
        ],
      },

      [subtitleDefinition.id]: {
        items: [
          updateSystemItem(
            subtitleDefinition.id,
            subtitle.trim(),
          ),
        ],
      },

      [briefDefinition.id]: {
        items: [
          updateSystemItem(
            briefDefinition.id,
            trimmedBrief,
          ),
        ],
      },
    },

    updatedAt: now,
  }

  setPendingEntryNavigationId(
    updatedEntry.id,
  )

  setEntries(
    (current) =>
      current.map(
        (candidate) =>
          candidate.id ===
          updatedEntry.id
            ? updatedEntry
            : candidate,
      ),
  )

  await entryRepository
    .saveEntry(updatedEntry)

  setEditingPageEntryId(null)
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
  items: [
    {
      id: crypto.randomUUID(),
      order: 0,
      value: 'Add your thoughts here...',
      source: 'master',
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
    },
  ],
},
    },

    updatedAt:
      new Date().toISOString(),
  }

 setPendingEntryNavigationId(
  updatedEntry.id,
)

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

async function removeFieldFromEntry(
  fieldDefinitionId: string,
) {
  if (!activeEntry) {
    return
  }

  const {
    [fieldDefinitionId]:
      removedField,
    ...remainingFields
  } = activeEntry.fields

  if (!removedField) {
    return
  }

  const updatedEntry:
    JournalEntry = {
    ...activeEntry,

    fields:
      remainingFields,

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

  setPendingEntryNavigationId(
    updatedEntry.id,
  )

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

async function addItemToField(
  entryId: string,
  fieldDefinitionId: string,
  afterItemId: string,
) {
  const entry =
    entries.find(
      (candidate) =>
        candidate.id === entryId,
    )

  const field =
    entry?.fields[
      fieldDefinitionId
    ]

  if (!entry || !field) {
    return
  }

  const source:
    JournalFieldItem['source'] =
    journal?.ownerName === 'Master'
      ? 'master'
      : 'user'

  const anchorItem =
    field.items.find(
      (item) =>
        item.id === afterItemId,
    )

  if (!anchorItem) {
    return
  }

  /*
   * A Journal may only insert into
   * its own authority group.
   */
  if (anchorItem.source !== source) {
    return
  }

  const authorityItems =
    field.items
      .filter(
        (item) =>
          item.source === source,
      )
      .sort(
        (left, right) =>
          left.order -
          right.order,
      )

  const anchorIndex =
    authorityItems.findIndex(
      (item) =>
        item.id === afterItemId,
    )

  if (anchorIndex < 0) {
    return
  }

  const now =
    new Date().toISOString()

  const newItem:
    JournalFieldItem = {
    id: crypto.randomUUID(),
    order: anchorIndex + 1,
    value:
      'Add your thoughts here...',
    source,
    createdAt: now,
    updatedAt: now,
  }

  const reorderedAuthorityItems = [
    ...authorityItems.slice(
      0,
      anchorIndex + 1,
    ),
    newItem,
    ...authorityItems.slice(
      anchorIndex + 1,
    ),
  ].map(
    (item, index) => ({
      ...item,
      order: index,
      updatedAt:
        item.id === newItem.id
          ? item.updatedAt
          : now,
    }),
  )

  const reorderedById =
    new Map(
      reorderedAuthorityItems.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    )

  const updatedItems =
    field.items
      .filter(
        (item) =>
          item.source !== source,
      )
      .concat(
        reorderedAuthorityItems,
      )
      .map(
        (item) =>
          reorderedById.get(
            item.id,
          ) ?? item,
      )

  await updateFieldItems(
    fieldDefinitionId,
    updatedItems,
  )

  setEditingItem({
    entryId,
    fieldDefinitionId,
    itemId: newItem.id,
    value:
      'Add your thoughts here...',
  })
}

async function moveFieldItem(
  entryId: string,
  fieldDefinitionId: string,
  itemId: string,
  direction: 'up' | 'down',
) {
  const entry =
    entries.find(
      (candidate) =>
        candidate.id === entryId,
    )

  const field =
    entry?.fields[
      fieldDefinitionId
    ]

  if (!entry || !field) {
    return
  }

  const item =
    field.items.find(
      (candidate) =>
        candidate.id === itemId,
    )

  if (!item) {
    return
  }

  /*
   * Master Items and User Items
   * are separate authority groups.
   * Reordering never crosses
   * that boundary.
   */
  const authorityItems =
    field.items
      .filter(
        (candidate) =>
          candidate.source ===
          item.source,
      )
      .sort(
        (left, right) =>
          left.order -
          right.order,
      )

  const currentIndex =
    authorityItems.findIndex(
      (candidate) =>
        candidate.id === itemId,
    )

  const targetIndex =
    direction === 'up'
      ? currentIndex - 1
      : currentIndex + 1

  if (
    currentIndex < 0 ||
    targetIndex < 0 ||
    targetIndex >=
      authorityItems.length
  ) {
    return
  }

  const reorderedAuthorityItems =
    [...authorityItems]

  const [movedItem] =
    reorderedAuthorityItems.splice(
      currentIndex,
      1,
    )

  reorderedAuthorityItems.splice(
    targetIndex,
    0,
    movedItem,
  )

  const now =
    new Date().toISOString()

  const orderById =
    new Map(
      reorderedAuthorityItems.map(
        (candidate, index) => [
          candidate.id,
          index,
        ],
      ),
    )

  const updatedItems =
    field.items.map(
      (candidate) => {
        if (
          candidate.source !==
          item.source
        ) {
          return candidate
        }

        return {
          ...candidate,
          order:
            orderById.get(
              candidate.id,
            ) ?? candidate.order,
          updatedAt: now,
        }
      },
    )

  await updateFieldItems(
    fieldDefinitionId,
    updatedItems,
  )
}

function handleEditItem(
  entryId: string,
  fieldDefinitionId: string,
  itemId: string,
) {  
  if (
    titleDefinition &&
    fieldDefinitionId ===
      titleDefinition.id
  ) {
    setEditingPageEntryId(
      entryId,
    )

    return
  }

  const entry =
    entries.find(
      (candidate) =>
        candidate.id === entryId,
    )

  const item =
    entry?.fields[
      fieldDefinitionId
    ]?.items.find(
      (candidate) =>
        candidate.id === itemId,
    )

  if (!entry || !item) {
    return
  }

  setEditingItem({
    entryId,
    fieldDefinitionId,
    itemId,

    value:
      typeof item.value === 'string'
        ? item.value
        : String(
            item.value ?? '',
          ),
  })
}

async function confirmEditingItem() {
  if (!editingItem) {
    return
  }

  if (
    titleDefinition &&
    editingItem.fieldDefinitionId ===
      titleDefinition.id
  ) {
    await updateEntryTitle(
      editingItem.value,
    )

    setEditingItem(null)
    return
  }

  const entry =
    entries.find(
      (candidate) =>
        candidate.id ===
        editingItem.entryId,
    )

  const field =
    entry?.fields[
      editingItem.fieldDefinitionId
    ]

  if (!entry || !field) {
    return
  }

  const isEmpty =
  editingItem.value.trim()
    .length === 0

if (isEmpty) {
  if (field.items.length === 1) {
    await removeFieldFromEntry(
      editingItem.fieldDefinitionId,
    )

    setEditingItem(null)
    return
  }

  const updatedItems =
    field.items.filter(
      (item) =>
        item.id !==
        editingItem.itemId,
    )

  await updateFieldItems(
    editingItem.fieldDefinitionId,
    updatedItems,
  )

  setEditingItem(null)
  return
}

const now =
  new Date().toISOString()

const updatedItems =
  field.items.map(
    (item) =>
      item.id ===
      editingItem.itemId
        ? {
            ...item,
            value:
              editingItem.value,
            updatedAt: now,
          }
        : item,
  )

  await updateFieldItems(
    editingItem.fieldDefinitionId,
    updatedItems,
  )

  setEditingItem(null)
}

type SearchMatch = {
  pageIndex: number
  fragmentIndex: number
  start: number
  end: number
}

function getSearchMatches(
  query: string,
): SearchMatch[] {
  const normalizedQuery =
    query.trim().toLocaleLowerCase()

  if (!normalizedQuery) {
    return []
  }

  const matches:
    SearchMatch[] = []

  journalPagination.pages.forEach(
    (page, physicalPageIndex) => {
      page.fragments.forEach(
        (
          fragment,
          fragmentIndex,
        ) => {
          if (
            fragment.type ===
            'addItem'
          ) {
            return
          }

          const searchableText =
            fragment.text
              .toLocaleLowerCase()

          let searchFrom = 0

          while (
            searchFrom <=
            searchableText.length -
              normalizedQuery.length
          ) {
            const start =
              searchableText.indexOf(
                normalizedQuery,
                searchFrom,
              )

            if (start < 0) {
              break
            }

            matches.push({
              pageIndex:
                physicalPageIndex,

              fragmentIndex,

              start,

              end:
                start +
                normalizedQuery.length,
            })

            searchFrom =
              start +
              normalizedQuery.length
          }
        },
      )
    },
  )

  return matches
}

function compareSearchPosition(
  left: SearchMatch,
  right: SearchMatch,
): number {
  if (
    left.pageIndex !==
    right.pageIndex
  ) {
    return (
      left.pageIndex -
      right.pageIndex
    )
  }

  if (
    left.fragmentIndex !==
    right.fragmentIndex
  ) {
    return (
      left.fragmentIndex -
      right.fragmentIndex
    )
  }

  return left.start - right.start
}

function navigateToSearchMatch(
  match: SearchMatch,
) {
  setSearchHighlight(
    match,
  )

  setPageIndex(
    singlePageMode
      ? match.pageIndex
      : match.pageIndex -
          (match.pageIndex % 2),
  )
}

function findNextSearchMatch() {
  const matches =
    getSearchMatches(
      searchText,
    )

  if (matches.length === 0) {
    setSearchHighlight(null)
    return
  }

  /*
   * A highlighted result becomes
   * the current search position.
   *
   * Without a highlight, the
   * current position is the top
   * of the displayed left page.
   */
  if (searchHighlight) {
    const nextMatch =
      matches.find(
        (match) =>
          compareSearchPosition(
            match,
            searchHighlight,
          ) > 0,
      )

    navigateToSearchMatch(
      nextMatch ??
        matches[0],
    )

    return
  }

  const nextMatch =
    matches.find(
      (match) =>
        match.pageIndex >=
        pageIndex,
    )

  navigateToSearchMatch(
    nextMatch ??
      matches[0],
  )
}

function findPreviousSearchMatch() {
  const matches =
    getSearchMatches(
      searchText,
    )

  if (matches.length === 0) {
    setSearchHighlight(null)
    return
  }

  if (searchHighlight) {
    const previousMatch =
      [...matches]
        .reverse()
        .find(
          (match) =>
            compareSearchPosition(
              match,
              searchHighlight,
            ) < 0,
        )

    navigateToSearchMatch(
      previousMatch ??
        matches[
          matches.length - 1
        ],
    )

    return
  }

  /*
   * With no active result,
   * Previous searches strictly
   * before the top of the
   * displayed left page.
   */
  const previousMatch =
    [...matches]
      .reverse()
      .find(
        (match) =>
          match.pageIndex <
          pageIndex,
      )

  navigateToSearchMatch(
    previousMatch ??
      matches[
        matches.length - 1
      ],
  )
}

function clearSearchPosition() {
  setSearchHighlight(null)
}

  return (
    <div className="journal-editor">
      {newPageSectionId && (() => {
  const section =
    sections.find(
      (candidate) =>
        candidate.id ===
        newPageSectionId,
    )

  if (!section) {
    return null
  }

  return (
    <NewPageDialog
      sectionName={section.name}
      onCancel={() => {
        setNewPageSectionId(null)
      }}
      onCreate={async (
        title,
        subtitle,
        brief,
      ) => {
        await createEntry(
          section.id,
          title,
          subtitle,
          brief,
        )
      }}
    />
  )
})()}

{editingPageEntryId && (() => {
  const entry =
    entries.find(
      (candidate) =>
        candidate.id ===
        editingPageEntryId,
    )

  if (!entry) {
    return null
  }

  const section =
    sections.find(
      (candidate) =>
        candidate.id ===
        entry.sectionDefinitionId,
    )

  if (
    !section ||
    !titleDefinition ||
    !subtitleDefinition ||
    !briefDefinition
  ) {
    return null
  }

  const title =
    entry.fields[
      titleDefinition.id
    ]?.items[0]?.value

  const subtitle =
    entry.fields[
      subtitleDefinition.id
    ]?.items[0]?.value

  const brief =
    entry.fields[
      briefDefinition.id
    ]?.items[0]?.value

  return (
    <NewPageDialog
      mode="edit"
      sectionName={section.name}
      initialTitle={
        typeof title === 'string'
          ? title
          : ''
      }
      initialSubtitle={
        typeof subtitle === 'string'
          ? subtitle
          : ''
      }
      initialBrief={
        typeof brief === 'string'
          ? brief
          : ''
      }
      onCancel={() => {
        setEditingPageEntryId(null)
      }}
      onCreate={async (
        nextTitle,
        nextSubtitle,
        nextBrief,
      ) => {
        await updatePageHeader(
          entry.id,
          nextTitle,
          nextSubtitle,
          nextBrief,
        )
      }}
    />
  )
})()}

      <aside className="journal-inspector">
        <div className="journal-inspector-header">
  <div className="journal-inspector-title">
    Table of Contents
  </div>
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

                    {!section.isSystem && (
  <button
    type="button"
    className="journal-toc-add"
    title={`Add entry to ${section.name}`}
    disabled={
      !journal ||
      !titleDefinition
    }
    onClick={() => {
      setNewPageSectionId(
        section.id,
      )
    }}
  >
    +
  </button>
)}
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
            navigateToEntry(
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

        <div className="journal-search">
  <span className="journal-search-label">
    Search
  </span>

  <input
    type="search"
    value={searchText}
    placeholder="Find in Journal..."
    disabled={!journal}
    onChange={(event) => {
      setSearchText(
        event.target.value,
      )

      clearSearchPosition()
    }}
    onKeyDown={(event) => {
      if (
        event.key === 'Enter'
      ) {
        event.preventDefault()

        findNextSearchMatch()
      }
    }}
  />

  <div className="journal-search-controls">
    <button
      type="button"
      disabled={
        !journal ||
        !searchText.trim()
      }
      onClick={
        findPreviousSearchMatch
      }
    >
      ‹ Previous
    </button>

    <button
      type="button"
      disabled={
        !journal ||
        !searchText.trim()
      }
      onClick={
        findNextSearchMatch
      }
    >
      Next ›
    </button>
  </div>
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
          <div className="journal-document-tabs-container">
  <button
    type="button"
    className="journal-document-tabs-scroll"
    aria-label="Scroll document tabs left"
    disabled={!canScrollTabsLeft}
    onClick={() => {
      scrollDocumentTabs(
        'left',
      )
    }}
  >
    ‹
  </button>

  <div
    ref={documentTabsRef}
    className="journal-document-tabs"
  >
    {journal && (
      <button
        type="button"
        className="journal-document-tab active permanent"
      >
        Master
      </button>
    )}
  </div>

  <button
    type="button"
    className="journal-document-tabs-scroll"
    aria-label="Scroll document tabs right"
    disabled={!canScrollTabsRight}
    onClick={() => {
      scrollDocumentTabs(
        'right',
      )
    }}
  >
    ›
  </button>
</div>

          <div className="journal-format-controls">
  <label>
    Font

    <select
      disabled={!journal}
      value={fontFamily}
      onChange={(event) => {
        onReadabilityChange(
          event.target.value,
          fontSize,
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
        onReadabilityChange(
          fontFamily,
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

        <div
  ref={bookAreaRef}
  className="journal-book-area"
>
            {editingItem && (
  <JournalItemEditor
    value={editingItem.value}
    fontFamily={fontFamily}
    fontSize={fontSize}
    onChange={(value) => {
      setEditingItem(
        (current) =>
          current
            ? {
                ...current,
                value,
              }
            : null,
      )
    }}
    onConfirm={() => {
        void confirmEditingItem()
    }}
    onClose={() => {
      setEditingItem(null)
    }}
  />
)}
          {journal ? (
            <div
  className={
    singlePageMode
      ? 'journal-book single-page'
      : 'journal-book'
  }
>
                <button
  type="button"
  className="journal-page-turn journal-page-turn-previous"
  disabled={!hasPreviousPage}
  aria-label="Previous pages"
  onClick={() => {
    clearSearchPosition()
    const previousIndex =
    getPreviousPageIndex(
      pageIndex,
    )

  if (
    previousIndex !== null
  ) {
    setPageIndex(
      previousIndex,
    )
  }
}}
>
  <span aria-hidden="true">
    ‹
  </span>
</button>
              <JournalPage
                page={leftPage ?? undefined}
                pageNumber={leftPageIndex + 1}
                pageSide="left"
                searchHighlight={
                  searchHighlight?.pageIndex ===
                  leftPageIndex
                    ? searchHighlight
                    : null
                }
                fontFamily={fontFamily}
                fontSize={fontSize}
                titleFontSize={titleFontSize}
                titleLineHeight={titleLineHeight}
                showEditNode={showEditNode}
                onEditItem={handleEditItem}
                onMoveItem={moveFieldItem}
                onAddItem={addItemToField}
              />

            {!singlePageMode && (
              <JournalPage
                page={rightPage ?? undefined}
                pageNumber={rightPageIndex + 1}
                pageSide="right"
                searchHighlight={
                  searchHighlight?.pageIndex ===
                  rightPageIndex
                    ? searchHighlight
                    : null
                }
                fontFamily={fontFamily}
                fontSize={fontSize}
                titleFontSize={titleFontSize}
                titleLineHeight={titleLineHeight}
                showEditNode={showEditNode}
                onEditItem={handleEditItem}
                onMoveItem={moveFieldItem}
                onAddItem={addItemToField}
              />
            )}

             <button
  type="button"
  className="journal-page-turn journal-page-turn-next"
  disabled={!hasNextPage}
  aria-label="Next pages"
  onClick={() => {
    clearSearchPosition()
    const nextIndex =
    getNextPageIndex(
      pageIndex,
    )

  if (
    nextIndex !== null
  ) {
    setPageIndex(
      nextIndex,
    )
  }
}}
>
  <span aria-hidden="true">
    ›
  </span>
</button>
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