import type {
  Project,
} from '../models/Project'

import type {
  Journal,
} from '../models/Journal'

interface JournalWorkspaceProps {
  project: Project
  journal: Journal | null
}

export function JournalWorkspace({
  project,
  journal,
}: JournalWorkspaceProps) {
  const sections =
    [...project.sectionDefinitions]
      .sort(
        (left, right) =>
          left.order -
          right.order,
      )

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
                      disabled={!journal}
                    >
                      +
                    </button>
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
            disabled
            defaultValue=""
          >
            <option value="">
              Select field...
            </option>
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
            <button
              type="button"
              disabled={!journal}
              title="Bold"
            >
              <strong>B</strong>
            </button>

            <button
              type="button"
              disabled={!journal}
              title="Italic"
            >
              <em>I</em>
            </button>

            <button
              type="button"
              disabled={!journal}
              title="Underline"
            >
              <span className="journal-underline">
                U
              </span>
            </button>
          </div>
        </header>

        <div className="journal-book-area">
          {journal ? (
            <div className="journal-book">
              <div className="journal-page journal-page-left">
                <div className="journal-page-content" />

                <div className="journal-page-number">
                  1
                </div>
              </div>

              <div className="journal-page journal-page-right">
                <div className="journal-page-content" />

                <div className="journal-page-number">
                  2
                </div>
              </div>
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