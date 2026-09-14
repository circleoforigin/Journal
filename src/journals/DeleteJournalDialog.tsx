import type {
  Journal,
} from '../models/Journal'

interface DeleteJournalDialogProps {
  journals: Journal[]

  onDelete: (
    journal: Journal,
  ) => Promise<void>

  onCancel: () => void
}

export function DeleteJournalDialog({
  journals,
  onDelete,
  onCancel,
}: DeleteJournalDialogProps) {
  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h2>Delete Journal</h2>

        <div className="project-dialog-list">
          {journals.length === 0 ? (
            <p>
              No journals available
              for deletion.
            </p>
          ) : (
            journals.map(
              (journal) => (
                <button
                  key={journal.id}
                  type="button"
                  className="project-dialog-item project-dialog-delete"
                  onClick={() => {
                    void onDelete(
                      journal,
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