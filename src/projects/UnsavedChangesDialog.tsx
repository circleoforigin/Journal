interface UnsavedChangesDialogProps {
  saving: boolean

  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

export function UnsavedChangesDialog({
  saving,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h2>
          Unsaved Changes
        </h2>

        <p>
          Save your changes before
          continuing?
        </p>

        <div className="dialog-actions">
          <button
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onDiscard}
          >
            Discard
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={onSave}
          >
            {saving
              ? 'Saving...'
              : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}