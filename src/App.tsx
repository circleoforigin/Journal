import {
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  ProjectLoadAcceptedPayload,
  ProjectLoadFailedPayload,
  ProjectLoadedPayload,
  ProjectLoadRequest,
} from '@settingforge/module-sdk'

import { MenuBar } from './components/MenuBar'

import type { Project } from './models/Project'

import { projectRepository } from './projects/ProjectRepository'

import { moduleEventBus } from './host/ModuleBus'

import { announceJournalReady } from './host/ModulePresence'

import { NewProjectDialog } from './projects/NewProjectDialog'
import { LoadProjectDialog } from './projects/LoadProjectDialog'
import { DeleteProjectDialog } from './projects/DeleteProjectDialog'
import { UnsavedChangesDialog } from './projects/UnsavedChangesDialog'

import type { Journal } from './models/Journal'

import { journalRepository } from './journals/JournalRepository'

import { NewJournalDialog } from './journals/NewJournalDialog'

function App() {
  const [
    activeProject,
    setActiveProject,
  ] = useState<Project | null>(
    null,
  )

  const [
  activeJournal,
  setActiveJournal,
] = useState<Journal | null>(
  null,
)

const [
  isNewJournalOpen,
  setIsNewJournalOpen,
] = useState(false)

  const [
    projectDirty,
    setProjectDirty,
  ] = useState(false)

  const [
  isNewProjectOpen,
  setIsNewProjectOpen,
] = useState(false)

const [
  isLoadProjectOpen,
  setIsLoadProjectOpen,
] = useState(false)

const [
  isDeleteProjectOpen,
  setIsDeleteProjectOpen,
] = useState(false)

const [
  isUnsavedChangesOpen,
  setIsUnsavedChangesOpen,
] = useState(false)

const [
  savedProjects,
  setSavedProjects,
] = useState<Project[]>([])

const [
  isSavingBeforeAction,
  setIsSavingBeforeAction,
] = useState(false)

const pendingProjectActionRef =
  useRef<(() => void) | null>(
    null,
  )

  /*
   * ----------------------------------------
   * Module presence
   * ----------------------------------------
   */

  useEffect(() => {
    announceJournalReady()
  }, [])

  /*
   * ----------------------------------------
   * SettingForge Project contract
   * ----------------------------------------
   */

  useEffect(() => {
    const unregisterStatus =
      moduleEventBus.registerRequestHandler(
        'project.status',
        () => ({
          projectId:
            activeProject?.id,

          projectName:
            activeProject?.name,

          dirty:
            projectDirty,
        }),
      )

    const unregisterLoad =
      moduleEventBus.registerRequestHandler(
        'project.load',
        async (request) => {
          const payload =
            request.payload as
              | Partial<ProjectLoadRequest>
              | undefined

          if (
            !payload?.projectId ||
            !payload.loadId
          ) {
            throw new Error(
              'project.load requires projectId and loadId.',
            )
          }

          const project =
            await projectRepository
              .loadProject(
                payload.projectId,
              )

          if (!project) {
            throw new Error(
              `Project "${payload.projectId}" was not found.`,
            )
          }

          const projectId =
            project.id

          const loadId =
            payload.loadId

          void Promise.resolve()
  .then(() => {
    setActiveProject(
      project,
    )

    setActiveJournal(
      null,
    )

    setProjectDirty(
      false,
    )

              const loaded:
                ProjectLoadedPayload = {
                  projectId,
                  loadId,
                }

              moduleEventBus.emit(
                'project.loaded',
                loaded,
              )
            })
            .catch(
              (
                loadError:
                  unknown,
              ) => {
                const failed:
                  ProjectLoadFailedPayload = {
                    projectId,
                    loadId,

                    error:
                      loadError
                        instanceof Error
                        ? loadError.message
                        : 'Project restoration failed.',
                  }

                moduleEventBus.emit(
                  'project.loadFailed',
                  failed,
                )
              },
            )

          const accepted:
            ProjectLoadAcceptedPayload = {
              accepted: true,
              projectId,
              loadId,
            }

          return accepted
        },
      )

    const unregisterSave =
      moduleEventBus.registerRequestHandler(
        'project.save',
        async () => {
          if (!activeProject) {
            return {
              saved: false,
              projectId:
                undefined,
            }
          }

          const projectToSave:
            Project = {
              ...activeProject,

              updatedAt:
                new Date().toISOString(),
            }

          await projectRepository
            .saveProject(
              projectToSave,
            )

          setActiveProject(
            projectToSave,
          )

          setProjectDirty(
            false,
          )

          return {
            saved: true,

            projectId:
              projectToSave.id,
          }
        },
      )

    const unregisterClose =
      moduleEventBus.registerRequestHandler(
        'project.close',
        (request) => {
          const payload =
            request.payload as
              | {
                  discardChanges?:
                    boolean
                }
              | undefined

          if (
            projectDirty &&
            !payload?.discardChanges
          ) {
            throw new Error(
              'Project has unsaved changes.',
            )
          }

          setActiveProject(
  null,
)

setActiveJournal(
  null,
)

setProjectDirty(
  false,
)

          return {
            closed: true,
          }
        },
      )

    return () => {
      unregisterStatus()
      unregisterLoad()
      unregisterSave()
      unregisterClose()
    }
  }, [
    activeProject,
    projectDirty,
  ])

 function loadProjectIntoWorkspace(
  project: Project,
) {
  setActiveProject(project)
  setActiveJournal(null)
  setProjectDirty(false)
}

function closeProject() {
  setActiveProject(null)
  setActiveJournal(null)
  setProjectDirty(false)
}

async function saveActiveProject():
  Promise<boolean> {
  if (!activeProject) {
    return false
  }

  const projectToSave:
    Project = {
      ...activeProject,

      updatedAt:
        new Date().toISOString(),
    }

  try {
    await projectRepository
      .saveProject(
        projectToSave,
      )

    setActiveProject(
      projectToSave,
    )

    setProjectDirty(false)

    return true
  } catch (error) {
    console.error(
      '[Journal] Unable to save project.',
      error,
    )

    return false
  }
}

function requestProjectAction(
  action: () => void,
) {
  if (
    !activeProject ||
    !projectDirty
  ) {
    action()
    return
  }

  pendingProjectActionRef.current =
    action

  setIsUnsavedChangesOpen(true)
}

function cancelPendingProjectAction() {
  pendingProjectActionRef.current =
    null

  setIsUnsavedChangesOpen(false)
}

function discardAndContinue() {
  const action =
    pendingProjectActionRef.current

  pendingProjectActionRef.current =
    null

  setIsUnsavedChangesOpen(false)

  action?.()
}

async function saveAndContinue() {
  if (isSavingBeforeAction) {
    return
  }

  setIsSavingBeforeAction(true)

  try {
    const saved =
      await saveActiveProject()

    if (!saved) {
      return
    }

    const action =
      pendingProjectActionRef.current

    pendingProjectActionRef.current =
      null

    setIsUnsavedChangesOpen(false)

    action?.()
  } finally {
    setIsSavingBeforeAction(false)
  }
}

function handleNewProject() {
  requestProjectAction(() => {
    setIsNewProjectOpen(true)
  })
}

async function createProject(
  name: string,
) {
  const now =
    new Date().toISOString()

  const project: Project = {
    id:
      crypto.randomUUID(),

    name,

    fieldDefinitions: [],
    journalIds: [],

    createdAt: now,
    updatedAt: now,
  }

  await projectRepository
    .saveProject(project)

  loadProjectIntoWorkspace(
    project,
  )

  setIsNewProjectOpen(false)
}

function handleLoadProject() {
  requestProjectAction(() => {
    void openLoadProjectDialog()
  })
}

async function openLoadProjectDialog() {
  const projects =
    await projectRepository
      .loadProjects()

  setSavedProjects(
    [...projects].sort(
      (left, right) =>
        left.name.localeCompare(
          right.name,
        ),
    ),
  )

  setIsLoadProjectOpen(true)
}

async function loadSelectedProject(
  projectId: string,
) {
  const project =
    await projectRepository
      .loadProject(projectId)

  if (!project) {
    return
  }

  loadProjectIntoWorkspace(
    project,
  )

  setIsLoadProjectOpen(false)
}

function handleSaveProject() {
  void saveActiveProject()
}

function handleCloseProject() {
  if (!activeProject) {
    return
  }

  requestProjectAction(
    closeProject,
  )
}

async function handleDeleteProject() {
  const projects =
    await projectRepository
      .loadProjects()

  setSavedProjects(
    [...projects]
      .filter(
        (project) =>
          project.id !==
          activeProject?.id,
      )
      .sort(
        (left, right) =>
          left.name.localeCompare(
            right.name,
          ),
      ),
  )

  setIsDeleteProjectOpen(true)
}

async function deleteSelectedProject(
  project: Project,
) {
  await projectRepository
    .deleteProject(
      project.id,
    )

  const projects =
    await projectRepository
      .loadProjects()

  setSavedProjects(
    [...projects]
      .filter(
        (candidate) =>
          candidate.id !==
          activeProject?.id,
      )
      .sort(
        (left, right) =>
          left.name.localeCompare(
            right.name,
          ),
      ),
  )
}

function handleNewJournal() {
  if (!activeProject) {
    return
  }

  setIsNewJournalOpen(true)
}

async function createJournal(
  name: string,
) {
  if (!activeProject) {
    return
  }

  const now =
    new Date().toISOString()

  const journal: Journal = {
    id:
      crypto.randomUUID(),

    name,

    kind:
      'setting',

    entryIds: [],

    createdAt: now,
    updatedAt: now,
  }

  await journalRepository
    .saveJournal(journal)

  const updatedProject: Project = {
    ...activeProject,

    journalIds: [
      ...activeProject.journalIds,
      journal.id,
    ],

    updatedAt: now,
  }

  await projectRepository
    .saveProject(
      updatedProject,
    )

  setActiveProject(
    updatedProject,
  )

  setActiveJournal(
    journal,
  )

  setProjectDirty(false)

  setIsNewJournalOpen(false)
}

  return (
    <div className="journal-app">
      <MenuBar
  projectName={
    activeProject?.name
  }

  hasProject={
    Boolean(activeProject)
  }

  hasJournals={
    Boolean(
      activeProject?.journalIds
        .length,
    )
  }

  hasActiveJournal={
    Boolean(activeJournal)
  }

  onNewProject={
    handleNewProject
  }

  onLoadProject={
    handleLoadProject
  }

  onSaveProject={
    handleSaveProject
  }

  onCloseProject={
    handleCloseProject
  }

  onDeleteProject={() => {
    void handleDeleteProject()
  }}

  onNewJournal={
    handleNewJournal
  }

  onOpenJournal={() => {
    // next step
  }}

  onCloseJournal={() => {
    setActiveJournal(null)
  }}

  onDeleteJournal={() => {
    // next step
  }}
/>

      <main className="journal-workspace">
        <section className="journal-main-workspace">
          {!activeProject ? (
            <div className="journal-empty">
              <div className="module-identifier">
                Journal
              </div>

              <h2>
                No Project Loaded
              </h2>

              <p>
                Create or load a project to get started.
              </p>
            </div>
          ) : (
            <div className="journal-empty">
              <div className="module-identifier">
                Journal
              </div>

              <h2>
                {activeProject.name}
              </h2>

              <p>
                Project loaded.
              </p>
            </div>
          )}
        </section>
      </main>

{isNewProjectOpen && (
  <NewProjectDialog
    onCreate={
      createProject
    }

    onCancel={() => {
      setIsNewProjectOpen(false)
    }}
  />
)}

{isLoadProjectOpen && (
  <LoadProjectDialog
    projects={savedProjects}

    onLoad={
      loadSelectedProject
    }

    onCancel={() => {
      setIsLoadProjectOpen(false)
    }}
  />
)}

{isDeleteProjectOpen && (
  <DeleteProjectDialog
    projects={savedProjects}

    onDelete={
      deleteSelectedProject
    }

    onCancel={() => {
      setIsDeleteProjectOpen(false)
    }}
  />
)}

{isUnsavedChangesOpen && (
  <UnsavedChangesDialog
    saving={
      isSavingBeforeAction
    }

    onSave={() => {
      void saveAndContinue()
    }}

    onDiscard={
      discardAndContinue
    }

    onCancel={
      cancelPendingProjectAction
    }
  />
)}

{isNewJournalOpen && (
  <NewJournalDialog
    onCreate={
      createJournal
    }

    onCancel={() => {
      setIsNewJournalOpen(
        false,
      )
    }}
  />
)}
    </div>
  )
}

export default App