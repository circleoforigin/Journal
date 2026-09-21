import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type {
  JournalFieldDefinition,
} from '../models/JournalFieldDefinition'

export interface JournalReferenceCandidate {
  id: string
  title: string
  subtitle: string
  brief: string
  aliases: string[]
}

interface JournalItemEditorProps {
  value: string
  fontFamily: string
  fontSize: number
  fieldDefinition?: JournalFieldDefinition
  error: string | null

  referenceCandidates: JournalReferenceCandidate[]
  referenceOwner: 'master' | 'player'

  onChange: (
    value: string,
  ) => void

  onConfirm: () => void

  onClose: () => void
}

function markupToHtml(
  value: string,
): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /&lt;ref:([^&]+?)&gt;([\s\S]*?)&lt;\/&gt;/gi,
      (
        _match,
        targetEntryId: string,
        content: string,
      ) =>
        `<span class="journal-editor-reference" data-reference-entry-id="${targetEntryId}" contenteditable="false">${content}</span>`
    )
    .replace(
      /&lt;b&gt;/gi,
      '<strong>',
    )
    .replace(
      /&lt;\/b&gt;/gi,
      '</strong>',
    )
    .replace(
      /&lt;i&gt;/gi,
      '<em>',
    )
    .replace(
      /&lt;\/i&gt;/gi,
      '</em>',
    )
    .replace(
      /&lt;u&gt;/gi,
      '<u>',
    )
    .replace(
      /&lt;\/u&gt;/gi,
      '</u>',
    )
    .replace(/\n/g, '<br>')
    .replace(/\t/g, '&#9;')
}

function nodeToMarkup(
  node: Node,
): string {
  if (
    node.nodeType ===
    Node.TEXT_NODE
  ) {
    return (
      node.textContent ?? ''
    )
  }

  if (
    node.nodeType !==
    Node.ELEMENT_NODE
  ) {
    return ''
  }

  const element =
    node as HTMLElement

  const tagName =
    element.tagName
      .toLowerCase()

  if (tagName === 'br') {
    return '\n'
  }

  const content =
    Array.from(
      element.childNodes,
    )
      .map(nodeToMarkup)
      .join('')

  const referenceEntryId =
    element.dataset
      .referenceEntryId

  if (referenceEntryId) {
    return (
      `<ref:${referenceEntryId}>` +
      content +
      '</>'
    )
  }

  if (
    tagName === 'b' ||
    tagName === 'strong'
  ) {
    return (
      '<b>' +
      content +
      '</b>'
    )
  }

  if (
    tagName === 'i' ||
    tagName === 'em'
  ) {
    return (
      '<i>' +
      content +
      '</i>'
    )
  }

  if (tagName === 'u') {
    return (
      '<u>' +
      content +
      '</u>'
    )
  }

  if (tagName === 'div') {
    return (
      '\n' +
      content
    )
  }

  return content
}

function editorToMarkup(
  editor: HTMLDivElement,
): string {
  return Array.from(
    editor.childNodes,
  )
    .map(nodeToMarkup)
    .join('')
    .replace(/^\n/, '')
}

export function JournalItemEditor({
  value,
  fontFamily,
  fontSize,
  fieldDefinition,
  error,
  referenceCandidates,
  referenceOwner,
  onChange,
  onConfirm,
  onClose,
}: JournalItemEditorProps)
{
  const editorRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const internalValueRef =
    useRef(value)

  const selectedRangeRef =
    useRef<Range | null>(
      null,
    )

  const [
    selectedEditorReference,
    setSelectedEditorReference,
  ] = useState<HTMLElement | null>(
    null,
  )

  const [
    linkDialogOpen,
    setLinkDialogOpen,
  ] = useState(false)

  const [
    selectedLinkText,
    setSelectedLinkText,
  ] = useState('')

  const [
    linkSearch,
    setLinkSearch,
  ] = useState('')

  const [
    selectedReferenceId,
    setSelectedReferenceId,
  ] = useState<string | null>(
    null,
  )

  const selectedReferenceTargetId =
    selectedEditorReference?.dataset
      .referenceEntryId ?? null

  const canUnlinkSelectedReference =
    Boolean(
      selectedReferenceTargetId &&
      selectedReferenceTargetId.startsWith(
        `${referenceOwner}-`,
      ),
    )

  const filteredReferenceCandidates =
    useMemo(
      () => {
        const query =
          linkSearch
            .trim()
            .toLocaleLowerCase()

        if (!query) {
          return referenceCandidates
        }

        return referenceCandidates
          .filter(
            (candidate) => {
              if (
                candidate.title
                  .toLocaleLowerCase()
                  .includes(query)
              ) {
                return true
              }

              if (
                candidate.subtitle
                  .toLocaleLowerCase()
                  .includes(query)
              ) {
                return true
              }

              return candidate.aliases
                .some(
                  (alias) =>
                    alias
                      .toLocaleLowerCase()
                      .includes(query),
                )
            },
          )
      },
      [
        linkSearch,
        referenceCandidates,
      ],
    )

  const selectedReference =
    referenceCandidates.find(
      (candidate) =>
        candidate.id ===
        selectedReferenceId,
    ) ?? null

  function syncValue() {
    const editor =
      editorRef.current

    if (!editor) {
      return
    }

    const nextValue =
      editorToMarkup(
        editor,
      )

    internalValueRef.current =
      nextValue

    onChange(nextValue)
  }

  function applyFormatting(
    command:
      | 'bold'
      | 'italic'
      | 'underline',
  ) {
    const editor =
      editorRef.current

    if (!editor) {
      return
    }

    editor.focus()

    document.execCommand(
      command,
      false,
    )

    syncValue()
  }

  function insertTab() {
    const selection =
      window.getSelection()

    if (
      !selection ||
      selection.rangeCount === 0
    ) {
      return
    }

    const range =
      selection.getRangeAt(0)

    range.deleteContents()

    const tab =
      document.createTextNode(
        '\t',
      )

    range.insertNode(tab)

    range.setStartAfter(tab)
    range.collapse(true)

    selection.removeAllRanges()
    selection.addRange(range)

    syncValue()
  }

  function trimSelectedWhitespace() {
    requestAnimationFrame(() => {
      const selection =
        window.getSelection()

      if (
        !selection ||
        selection.rangeCount === 0 ||
        selection.isCollapsed
      ) {
        return
      }

      const range =
        selection.getRangeAt(0)

      const selectedText =
        range.toString()

      const trailingWhitespace =
        selectedText.match(
          /\s+$/,
        )?.[0].length ?? 0

      if (
        trailingWhitespace === 0
      ) {
        return
      }

      const endContainer =
        range.endContainer

      if (
        endContainer.nodeType !==
        Node.TEXT_NODE
      ) {
        return
      }

      const nextEnd =
        range.endOffset -
        trailingWhitespace

      if (nextEnd < 0) {
        return
      }

      range.setEnd(
        endContainer,
        nextEnd,
      )

      selection.removeAllRanges()
      selection.addRange(range)
    })
  }

  function unlinkSelectedReference() {
  const editor =
    editorRef.current

  const reference =
    selectedEditorReference

  if (
    !editor ||
    !reference ||
    !editor.contains(reference)
  ) {
    return
  }

  const targetEntryId =
    reference.dataset
      .referenceEntryId

  if (
    !targetEntryId ||
    !targetEntryId.startsWith(
      `${referenceOwner}-`,
    )
  ) {
    return
  }

  const parent =
    reference.parentNode

  if (!parent) {
    return
  }

  const textNode =
    document.createTextNode(
      reference.textContent ?? '',
    )

  parent.replaceChild(
    textNode,
    reference,
  )

  setSelectedEditorReference(
    null,
  )

  syncValue()

  const selection =
    window.getSelection()

  if (selection) {
    const range =
      document.createRange()

    range.selectNodeContents(
      textNode,
    )

    range.collapse(false)

    selection.removeAllRanges()
    selection.addRange(range)
  }

  editor.focus()
}

  function openLinkDialog() {
    const editor =
      editorRef.current

    const selection =
      window.getSelection()

    if (
      !editor ||
      !selection ||
      selection.rangeCount === 0 ||
      selection.isCollapsed
    ) {
      return
    }

    const range =
      selection.getRangeAt(0)

    if (
      !editor.contains(
        range.commonAncestorContainer,
      )
    ) {
      return
    }

    const text =
      range.toString()

    if (!text.trim()) {
      return
    }

    selectedRangeRef.current =
      range.cloneRange()

    setSelectedLinkText(
      text,
    )

    setLinkSearch(
      text.trim(),
    )

    const normalizedText =
      text
        .trim()
        .toLocaleLowerCase()

    const exactTitleMatch =
      referenceCandidates.find(
        (candidate) =>
          candidate.title
            .trim()
            .toLocaleLowerCase() ===
          normalizedText,
      )

    const exactAliasMatch =
      referenceCandidates.find(
        (candidate) =>
          candidate.aliases.some(
            (alias) =>
              alias
                .trim()
                .toLocaleLowerCase() ===
              normalizedText,
          ),
      )

    setSelectedReferenceId(
      exactTitleMatch?.id ??
      exactAliasMatch?.id ??
      null,
    )

    setLinkDialogOpen(true)
  }

  function closeLinkDialog() {
    setLinkDialogOpen(false)
    setSelectedLinkText('')
    setLinkSearch('')
    setSelectedReferenceId(null)
    selectedRangeRef.current =
      null

    requestAnimationFrame(
      () => {
        editorRef.current?.focus()
      },
    )
  }

  function confirmLink() {
    const editor =
      editorRef.current

    const range =
      selectedRangeRef.current

    if (
      !editor ||
      !range ||
      !selectedReferenceId
    ) {
      return
    }

    const referenceSpan =
      document.createElement(
        'span',
      )

    referenceSpan.className = 'journal-editor-reference'

      referenceSpan.contentEditable = 'false'

    referenceSpan.dataset
      .referenceEntryId =
      selectedReferenceId

    const selectedContents =
      range.extractContents()

    referenceSpan.appendChild(
      selectedContents,
    )

    range.insertNode(
      referenceSpan,
    )

    const selection =
      window.getSelection()

    if (selection) {
      const nextRange =
        document.createRange()

      nextRange.setStartAfter(
        referenceSpan,
      )

      nextRange.collapse(true)

      selection.removeAllRanges()
      selection.addRange(
        nextRange,
      )
    }

    syncValue()

    setLinkDialogOpen(false)
    setSelectedLinkText('')
    setLinkSearch('')
    setSelectedReferenceId(null)
    selectedRangeRef.current =
      null

    editor.focus()
  }

  useEffect(() => {
    const editor =
      editorRef.current

    if (!editor) {
      return
    }

    editor.innerHTML =
      markupToHtml(value)

    internalValueRef.current =
      value

    editor.focus()
  }, [])

  return (
    <div className="journal-item-editor">
      {fieldDefinition?.presentation ===
        'inline' && (
        <p className="journal-item-editor-help">
          Commas separate values into independently stored Items.
        </p>
      )}

      {error && (
        <div
          className="journal-item-editor-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {fieldDefinition?.valueType !==
        'number' && (
        <div className="journal-item-editor-toolbar">
          <button
            type="button"
            title="Bold"
            onMouseDown={(
              event,
            ) => {
              event.preventDefault()
            }}
            onClick={() => {
              applyFormatting(
                'bold',
              )
            }}
          >
            <strong>B</strong>
          </button>

          <button
            type="button"
            title="Italic"
            onMouseDown={(
              event,
            ) => {
              event.preventDefault()
            }}
            onClick={() => {
              applyFormatting(
                'italic',
              )
            }}
          >
            <em>I</em>
          </button>

          <button
            type="button"
            title="Underline"
            onMouseDown={(
              event,
            ) => {
              event.preventDefault()
            }}
            onClick={() => {
              applyFormatting(
                'underline',
              )
            }}
          >
            <u>U</u>
          </button>

          <button
  type="button"
  className={
    selectedEditorReference
      ? 'journal-item-editor-link-button active'
      : 'journal-item-editor-link-button'
  }
  title={
    selectedEditorReference
      ? canUnlinkSelectedReference
        ? 'Unlink'
        : 'This Reference belongs to another Journal owner'
      : 'Add Link'
  }
  disabled={
    Boolean(
      selectedEditorReference &&
      !canUnlinkSelectedReference,
    )
  }
  onMouseDown={(
    event,
  ) => {
    event.preventDefault()
  }}
  onClick={() => {
    if (
      selectedEditorReference
    ) {
      unlinkSelectedReference()
      return
    }

    openLinkDialog()
  }}
>
  {selectedEditorReference
    ? 'Unlink'
    : 'Link...'}
</button>
        </div>
      )}

      {fieldDefinition?.valueType ===
        'number' ? (
        <input
          className="journal-item-editor-number"
          type={
            fieldDefinition.presentation ===
            'inline'
              ? 'text'
              : 'number'
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          autoFocus
        />
      ) : (
        <div
          ref={editorRef}
          className="journal-item-editor-input"
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onClick={(event) => {
    const target =
    event.target

  if (
    target instanceof
      HTMLElement
  ) {
    const reference =
      target.closest<HTMLElement>(
        '.journal-editor-reference[data-reference-entry-id]',
      )

    if (
      reference &&
      editorRef.current?.contains(
        reference,
      )
    ) {
      editorRef.current
  ?.querySelectorAll(
    '.journal-editor-reference.selected',
  )
  .forEach(
    (element) =>
      element.classList.remove(
        'selected',
      ),
  )

reference.classList.add(
  'selected',
)
      setSelectedEditorReference(
        reference,
      )

      return
    }
  }
  editorRef.current
  ?.querySelectorAll(
    '.journal-editor-reference.selected',
  )
  .forEach(
    (element) =>
      element.classList.remove(
        'selected',
      ),
  )
  setSelectedEditorReference(
    null,
  )
}}
          onDoubleClick={() => {
            trimSelectedWhitespace()
          }}
          style={{
            fontFamily,
            fontSize:
              `${fontSize}px`,
          }}
          onInput={() => {
            syncValue()
          }}
          onKeyDown={(event) => { 

  if (
    event.key !== 'Tab'
  ) {
    return
  }

            event.preventDefault()

            insertTab()
          }}
        />
      )}

      {linkDialogOpen && (
        <div className="journal-link-dialog">
          <div className="journal-link-dialog-header">
            Add Link
          </div>

          <div className="journal-link-selected-text">
            <span>
              Selected text
            </span>

            <strong>
              {selectedLinkText}
            </strong>
          </div>

          <label className="journal-link-search">
            <span>
              Find Journal Page
            </span>

            <input
              type="text"
              value={linkSearch}
              onChange={(
                event,
              ) => {
                setLinkSearch(
                  event.target.value,
                )
              }}
              autoFocus
            />
          </label>

          <div className="journal-link-results">
            {filteredReferenceCandidates
              .length === 0 ? (
              <div className="journal-link-empty">
                No matching Journal Pages.
              </div>
            ) : (
              filteredReferenceCandidates
                .map(
                  (candidate) => (
                    <button
                      key={
                        candidate.id
                      }
                      type="button"
                      className={
                        candidate.id ===
                        selectedReferenceId
                          ? 'journal-link-result selected'
                          : 'journal-link-result'
                      }
                      onClick={() => {
                        setSelectedReferenceId(
                          candidate.id,
                        )
                      }}
                    >
                      <strong>
                        {candidate.title}
                      </strong>

                      {candidate.subtitle && (
                        <span className="journal-link-result-subtitle">
                          {candidate.subtitle}
                        </span>
                      )}

                      {candidate.brief && (
                        <span className="journal-link-result-brief">
                          {candidate.brief}
                        </span>
                      )}
                    </button>
                  ),
                )
            )}
          </div>

          {selectedReference && (
            <div className="journal-link-connection">
              <span>
                Link to
              </span>

              <strong>
                {selectedReference.title}
              </strong>
            </div>
          )}

          <div className="journal-link-dialog-actions">
            <button
              type="button"
              className="journal-item-editor-confirm"
              disabled={
                !selectedReferenceId
              }
              onClick={() => {
                confirmLink()
              }}
            >
              Confirm Link
            </button>

            <button
              type="button"
              className="journal-item-editor-close"
              onClick={() => {
                closeLinkDialog()
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="journal-item-editor-actions">
        <button
          type="button"
          className="journal-item-editor-confirm"
          title="Confirm changes"
          onClick={onConfirm}
        >
          Confirm
        </button>

        <button
          type="button"
          className="journal-item-editor-close"
          title="Close editor"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
