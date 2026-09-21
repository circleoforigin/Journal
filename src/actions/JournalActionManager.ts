import type {
  ModuleEventBus,
} from '@settingforge/module-sdk'

import { moduleEventBus } from '../host/ModuleBus'

export interface JournalCreatePageRequest {
  sectionId: string
  title: string
  subtitle?: string
  brief: string
}

export interface JournalPageSummary {
  pageId: string
  title: string
  subtitle: string
  brief: string
  sectionId: string
  sectionName: string
}

export interface JournalGoToPageRequest {
  pageId: string
}

type GoToPageRequester = (
  request: JournalGoToPageRequest,
) => Promise<void>

type CreatePageRequester = (
  request: JournalCreatePageRequest,
) => Promise<JournalPageSummary>

export class JournalActionManager {
  private readonly eventBus:
    ModuleEventBus

  private createPage:
    CreatePageRequester | null = null

    private goToPage:
  GoToPageRequester | null = null

  constructor(
    eventBus: ModuleEventBus,
  ) {
    this.eventBus = eventBus
  }

  start(
  createPage:
    CreatePageRequester,

  goToPage:
    GoToPageRequester,
): () => void {
    this.stop()

    this.createPage =
      createPage

    this.goToPage =
        goToPage

    const unregisterCreatePage =
      this.eventBus
        .registerRequestHandler(
          'Journal.CreatePage',
          async (message) => {
            if (!this.createPage) {
              throw new Error(
                'Journal Create Page is unavailable.',
              )
            }

            const request =
              message.payload as
                | Partial<JournalCreatePageRequest>
                | undefined

            if (
              !request?.sectionId ||
              !request.title?.trim() ||
              !request.brief?.trim()
            ) {
              throw new Error(
                'Journal.CreatePage requires sectionId, title, and brief.',
              )
            }

            return this.createPage({
              sectionId:
                request.sectionId,

              title:
                request.title.trim(),

              subtitle:
                request.subtitle
                  ?.trim() ?? '',

              brief:
                request.brief.trim(),
            })
          },
        )

        const unregisterGoToPage =
  this.eventBus
    .registerRequestHandler(
      'Journal.GoToPage',
      async (message) => {
        if (!this.goToPage) {
          throw new Error(
            'Journal Go to Page is unavailable.',
          )
        }

        const request =
          message.payload as
            | Partial<JournalGoToPageRequest>
            | undefined

        if (!request?.pageId) {
          throw new Error(
            'Journal.GoToPage requires pageId.',
          )
        }

        await this.goToPage({
          pageId: request.pageId,
        })

        return {
          pageId: request.pageId,
        }
      },
    )

    return () => {
  unregisterCreatePage()
  unregisterGoToPage()

  this.createPage = null
  this.goToPage = null
}
  }

  stop(): void {
  this.createPage = null
  this.goToPage = null
}
}

export const journalActionManager =
  new JournalActionManager(
    moduleEventBus,
  )