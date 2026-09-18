import {
  useState,
} from 'react'

interface NewPageDialogProps {
  sectionName: string

  onCreate: (
    title: string,
    subtitle: string,
    brief: string,
  ) => Promise<void>

  onCancel: () => void
}

export function NewPageDialog({
  sectionName,
  onCreate,
  onCancel,
}: NewPageDialogProps) {
  const [
    title,
    setTitle,
  ] = useState('')

  const [
    subtitle,
    setSubtitle,
  ] = useState('')

  const [
    brief,
    setBrief,
  ] = useState('')

  const [
    creating,
    setCreating,
  ] = useState(false)

  const canCreate =
    title.trim().length > 0 &&
    brief.trim().length > 0 &&
    !creating

  async function handleCreate() {
    if (!canCreate) {
      return
    }

    setCreating(true)

    try {
      await onCreate(
        title.trim(),
        subtitle.trim(),
        brief.trim(),
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog new-page-dialog">
        <h2>New {sectionName} Page</h2>
        <label className="dialog-field">
          <span>Title - required</span>

          <input
            autoFocus
            value={title}
            onChange={(event) => {
              setTitle(
                event.target.value,
              )
            }}
          />
        </label>

        <label className="dialog-field">
          <span>Subtitle</span>

          <input
            value={subtitle}
            onChange={(event) => {
              setSubtitle(
                event.target.value,
              )
            }}
          />
        </label>

        <label className="dialog-field">
          <span>Brief - required</span>

          <textarea
            value={brief}
            onChange={(event) => {
              setBrief(
                event.target.value,
              )
            }}
          />

          <small>
            Enter the minimum information
            needed to recognize what this
            entry represents. Avoid
            specialized, hidden, or
            detailed knowledge.
          </small>
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
            disabled={!canCreate}
            onClick={() => {
              void handleCreate()
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}