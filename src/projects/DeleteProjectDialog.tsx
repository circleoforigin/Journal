import type {
  Project,
} from '../models/Project'

interface DeleteProjectDialogProps {
  projects: Project[]

  onDelete: (
    project: Project,
  ) => Promise<void>

  onCancel: () => void
}

export function DeleteProjectDialog({
  projects,
  onDelete,
  onCancel,
}: DeleteProjectDialogProps) {
  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h2>Delete Project</h2>

        <div className="project-dialog-list">
          {projects.length === 0 ? (
            <p>
              No projects available
              for deletion.
            </p>
          ) : (
            projects.map(
              (project) => (
                <button
                  key={project.id}
                  type="button"
                  className="project-dialog-item project-dialog-delete"
                  onClick={() => {
                    void onDelete(
                      project,
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