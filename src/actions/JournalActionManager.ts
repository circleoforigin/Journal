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

type CreatePageRequester = (
  request: JournalCreatePageRequest,
) => Promise<JournalPageSummary>

export class JournalActionManager {
  private readonly eventBus:
    ModuleEventBus

  private createPage:
    CreatePageRequester | null = null

  constructor(
    eventBus: ModuleEventBus,
  ) {
    this.eventBus = eventBus
  }

  start(
    createPage:
      CreatePageRequester,
  ): () => void {
    this.stop()

    this.createPage =
      createPage

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

    return () => {
      unregisterCreatePage()

      this.createPage = null
    }
  }

  stop(): void {
    this.createPage = null
  }
}

export const journalActionManager =
  new JournalActionManager(
    moduleEventBus,
  )