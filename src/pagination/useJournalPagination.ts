import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  RefObject,
} from 'react'

import type {
  JournalEntry,
} from '../models/JournalEntry'

import type {
  JournalFieldDefinition,
} from '../models/JournalFieldDefinition'

import {
  paginateJournalEntry,
} from './JournalPaginator'

import type {
  JournalEntryPagination,
} from './JournalPagination'

import {
  createJournalTextMeasurer,
} from './JournalTextMeasurer'

import type {
  JournalReadabilitySettings,
} from './JournalRenderableText'

import type {
  JournalLanguageDefinition,
} from './JournalTextResolver'

interface JournalPageSize {
  width: number
  height: number
}

interface UseJournalPaginationOptions {
  entry: JournalEntry | null

  fieldDefinitions:
    JournalFieldDefinition[]

  pageContentRef:
    RefObject<HTMLDivElement | null>

  readability:
    JournalReadabilitySettings

  languages:
    JournalLanguageDefinition[]
}

export function useJournalPagination({
  entry,
  fieldDefinitions,
  pageContentRef,
  readability,
  languages,
}: UseJournalPaginationOptions):
  JournalEntryPagination | null {
  const [
    pageSize,
    setPageSize,
  ] = useState<JournalPageSize>({
    width: 0,
    height: 0,
  })

  const measurer =
    useMemo(
      () =>
        createJournalTextMeasurer(),
      [],
    )

  useEffect(() => {
    const currentElement =
      pageContentRef.current

    if (!currentElement) {
      return
    }

    const element:
        HTMLDivElement = currentElement

    function updateSize() {
      const width =
        element.clientWidth

      const height =
        element.clientHeight

      setPageSize(
        (current) => {
          if (
            current.width ===
              width &&
            current.height ===
              height
          ) {
            return current
          }

          return {
            width,
            height,
          }
        },
      )
    }

    updateSize()

    const observer =
      new ResizeObserver(
        updateSize,
      )

    observer.observe(
      element,
    )

    return () => {
      observer.disconnect()
    }
  }, [
    pageContentRef,
  ])

  return useMemo(() => {
    if (
      !entry ||
      pageSize.width <= 0 ||
      pageSize.height <= 0
    ) {
      return null
    }

    return paginateJournalEntry(
      entry,
      fieldDefinitions,
      {
        readability,
        languages,
      },
      {
        pageWidth:
          pageSize.width,

        pageHeight:
          pageSize.height,

        firstPageReservedHeight: 58,
        fieldGap: 24,
        itemGap: 6,

        measureText:
          measurer.measureText,

        getLineHeight:
          measurer.getLineHeight,
      },
    )
  }, [
    entry,
    fieldDefinitions,
    languages,
    readability,
    pageSize.width,
    pageSize.height,
    measurer,
  ])
}