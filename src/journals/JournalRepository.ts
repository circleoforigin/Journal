import type {
  Journal,
} from '../models/Journal'

import {
  hostedCollectionRepository,
} from '../host/HostedCollectionRepository'

const JOURNALS_COLLECTION =
  'journals'

function normalizeJournal(
  journal: Journal,
): Journal {
  return {
    ...journal,

    entryIds:
      Array.isArray(
        journal.entryIds,
      )
        ? journal.entryIds
        : [],
  }
}

export class JournalRepository {
  async loadJournals():
    Promise<Journal[]> {
    const journals =
      await hostedCollectionRepository
        .loadAll<Journal>(
          JOURNALS_COLLECTION,
        )

    return Array.isArray(journals)
      ? journals.map(
          normalizeJournal,
        )
      : []
  }

  async loadJournal(
    journalId: string,
  ): Promise<Journal | null> {
    const journal =
      await hostedCollectionRepository
        .load<Journal>(
          JOURNALS_COLLECTION,
          journalId,
        )

    return journal
      ? normalizeJournal(journal)
      : null
  }

  async saveJournal(
    journal: Journal,
  ): Promise<void> {
    await hostedCollectionRepository
      .save(
        JOURNALS_COLLECTION,
        journal.id,
        journal,
      )
  }

  async deleteJournal(
    journalId: string,
  ): Promise<boolean> {
    return hostedCollectionRepository
      .delete(
        JOURNALS_COLLECTION,
        journalId,
      )
  }
}

export const journalRepository =
  new JournalRepository()