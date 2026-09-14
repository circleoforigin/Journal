import {
  useState,
} from 'react'

interface NewJournalDialogProps {
  onCreate: (
    name: string,
  ) => void | Promise<void>

  onCancel: () => void
}

export function NewJournalDialog({
  onCreate,
  onCancel,
}: NewJournalDialogProps) {
  const [
    name,
    setName,
  ] = useState('')

  const trimmedName =
    name.trim()

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h2>New Journal</h2>

        <label className="dialog-field">
          <span>
            Journal Name
          </span>

          <input
            autoFocus
            value={name}
            onChange={(event) => {
              setName(
                event.target.value,
              )
            }}
            onKeyDown={(event) => {
              if (
                event.key ===
                  'Enter' &&
                trimmedName
              ) {
                void onCreate(
                  trimmedName,
                )
              }

              if (
                event.key ===
                'Escape'
              ) {
                onCancel()
              }
            }}
          />
        </label>

        <div className="dialog-actions">
          <button
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!trimmedName}
            onClick={() => {
              void onCreate(
                trimmedName,
              )
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}