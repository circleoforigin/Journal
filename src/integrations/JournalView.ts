import type {
  JournalPageLayout,
  JournalPageTextRun,
} from '../pagination/JournalPagination';

export interface JournalViewTextRun {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;

  languageId?: string;
  targetEntryId?: string;
}

export interface JournalViewParagraph {
  indented: boolean;
  runs: JournalViewTextRun[];
}

export interface JournalViewInlineItem {
  runs: JournalViewTextRun[];
}

export interface JournalViewTitleFragment {
  type: 'title';
  text: string;
  top: number;
  height: number;
}

export interface JournalViewSubtitleFragment {
  type: 'subtitle';
  text: string;
  top: number;
  height: number;
}

export interface JournalViewBriefFragment {
  type: 'brief';
  text: string;
  top: number;
  height: number;
}

export interface JournalViewFieldFragment {
  type: 'field';
  text: string;
  top: number;
  height: number;
}

export interface JournalViewInlineFieldFragment {
  type: 'inlineField';
  label: string;
  items: JournalViewInlineItem[];
  top: number;
  height: number;
}

export interface JournalViewItemFragment {
  type: 'item';
  paragraphs: JournalViewParagraph[];

  top: number;
  height: number;

  left?: number;
  width?: number;
}

export type JournalViewFragment =
  | JournalViewTitleFragment
  | JournalViewSubtitleFragment
  | JournalViewBriefFragment
  | JournalViewFieldFragment
  | JournalViewInlineFieldFragment
  | JournalViewItemFragment;

export interface JournalViewPage {
  fragments: JournalViewFragment[];
}

export interface JournalViewPresentation {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;

  titleFontSize: number;
  titleLineHeight: number;

  fieldFontSize: number;
  fieldLineHeight: number;

  pageWidth: number;
  pageHeight: number;
}

export interface JournalGetViewPageRequest {
  entryId: string;
  pageIndex: number;
}

export interface JournalGetViewPageResponse {
  pageCount: number;
  page: JournalViewPage;
  presentation: JournalViewPresentation;
}

function convertRun(
  run: JournalPageTextRun
): JournalViewTextRun {
  return {
    text: run.text,
    bold: run.bold,
    italic: run.italic,
    underline: run.underline,

    languageId: run.languageId,
    targetEntryId: run.targetEntryId,
  };
}

export function createJournalViewPage(
  page: JournalPageLayout
): JournalViewPage {
  return {
    fragments: page.fragments.flatMap(
      (fragment): JournalViewFragment[] => {
        if (fragment.type === 'addItem') {
          return [];
        }

        if (fragment.type === 'title') {
          return [{
            type: 'title',
            text: fragment.text,
            top: fragment.top,
            height: fragment.height,
          }];
        }

        if (fragment.type === 'subtitle') {
          return [{
            type: 'subtitle',
            text: fragment.text,
            top: fragment.top,
            height: fragment.height,
          }];
        }

        if (fragment.type === 'brief') {
          return [{
            type: 'brief',
            text: fragment.text,
            top: fragment.top,
            height: fragment.height,
          }];
        }

        if (fragment.type === 'field') {
          return [{
            type: 'field',
            text: fragment.text,
            top: fragment.top,
            height: fragment.height,
          }];
        }

        if (fragment.type === 'inlineField') {
          return [{
            type: 'inlineField',
            label: fragment.label,

            items: fragment.items.map(
              (item) => ({
                runs: item.runs.map(
                  convertRun
                ),
              })
            ),

            top: fragment.top,
            height: fragment.height,
          }];
        }

        return [{
          type: 'item',

          paragraphs:
            fragment.paragraphs.map(
              (paragraph) => ({
                indented:
                  paragraph.indented,

                runs:
                  paragraph.runs.map(
                    convertRun
                  ),
              })
            ),

          top: fragment.top,
          height: fragment.height,

          left: fragment.left,
          width: fragment.width,
        }];
      }
    ),
  };
}