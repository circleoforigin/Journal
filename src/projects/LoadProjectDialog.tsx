import type {
  Project,
} from '../models/Project'

interface LoadProjectDialogProps {
  projects: Project[]

  onLoad: (
    projectId: string,
  ) => void

  onCancel: () => void
}

export function LoadProjectDialog({
  projects,
  onLoad,
  onCancel,
}: LoadProjectDialogProps) {
  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h2>Load Project</h2>

        <div className="project-dialog-list">
          {projects.length === 0 ? (
            <p>
              No saved projects.
            </p>
          ) : (
            projects.map(
              (project) => (
                <button
                  key={project.id}
                  type="button"
                  className="project-dialog-item"
                  onClick={() => {
                    onLoad(
                      project.id,
                    )
                  }}
                >
                  {project.name}
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