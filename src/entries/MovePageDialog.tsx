import type {
  JournalSectionDefinition,
} from '../models/JournalSectionDefinition'

interface MovePageDialogProps {
  pageTitle: string

  currentSectionId: string

  sections:
    JournalSectionDefinition[]

  onMove: (
    sectionDefinitionId: string,
  ) => void | Promise<void>

  onCancel: () => void
}

export function MovePageDialog({
  pageTitle,
  currentSectionId,
  sections,
  onMove,
  onCancel,
}: MovePageDialogProps) {
  const availableSections =
    sections.filter(
      (section) =>
        !section.isSystem &&
        section.id !==
          currentSectionId,
    )

  return (
    <div className="dialog-backdrop">
      <div className="dialog move-page-dialog">
        <h2>
          Move "{pageTitle}"?
        </h2>

        <p>
          Select the Section where this
          page should be moved.
        </p>

        {availableSections.length > 0 ? (
          <div className="move-page-sections">
            {availableSections.map(
              (section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    void onMove(
                      section.id,
                    )
                  }}
                >
                  {section.name}
                </button>
              ),
            )}
          </div>
        ) : (
          <p className="move-page-empty">
            There are no other Sections
            available.
          </p>
        )}

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