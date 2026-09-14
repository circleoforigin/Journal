import type {
  JournalEntry,
} from '../models/JournalEntry'

import {
  hostedCollectionRepository,
} from '../host/HostedCollectionRepository'

const ENTRIES_COLLECTION =
  'entries'

function normalizeEntry(
  entry: JournalEntry,
): JournalEntry {
  return {
    ...entry,

    fields:
      entry.fields &&
      typeof entry.fields ===
        'object'
        ? entry.fields
        : {},
  }
}

export class EntryRepository {
  async loadEntries():
    Promise<JournalEntry[]> {
    const entries =
      await hostedCollectionRepository
        .loadAll<JournalEntry>(
          ENTRIES_COLLECTION,
        )

    return Array.isArray(entries)
      ? entries.map(
          normalizeEntry,
        )
      : []
  }

  async loadEntry(
    entryId: string,
  ): Promise<JournalEntry | null> {
    const entry =
      await hostedCollectionRepository
        .load<JournalEntry>(
          ENTRIES_COLLECTION,
          entryId,
        )

    return entry
      ? normalizeEntry(entry)
      : null
  }

  async saveEntry(
    entry: JournalEntry,
  ): Promise<void> {
    await hostedCollectionRepository
      .save(
        ENTRIES_COLLECTION,
        entry.id,
        entry,
      )
  }

  async deleteEntry(
    entryId: string,
  ): Promise<boolean> {
    return hostedCollectionRepository
      .delete(
        ENTRIES_COLLECTION,
        entryId,
      )
  }
}

export const entryRepository =
  new EntryRepository()