import type {
  Journal,
} from '../models/Journal'

interface OpenJournalDialogProps {
  journals: Journal[]

  onOpen: (
    journalId: string,
  ) => void

  onCancel: () => void
}

export function OpenJournalDialog({
  journals,
  onOpen,
  onCancel,
}: OpenJournalDialogProps) {
  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h2>Open Journal</h2>

        <div className="project-dialog-list">
          {journals.length === 0 ? (
            <p>
              No journals available.
            </p>
          ) : (
            journals.map(
              (journal) => (
                <button
                  key={journal.id}
                  type="button"
                  className="project-dialog-item"
                  onClick={() => {
                    onOpen(
                      journal.id,
                    )
                  }}
                >
                  {journal.name}
                </button>
              ),
            )
          )}
        </div>

        <div className="dialog-actions">
          <button
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}