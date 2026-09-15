export interface JournalTextMeasurer {
  measureText: (
    text: string,
    fontFamily: string,
    fontSize: number,
  ) => number

  getLineHeight: (
    fontFamily: string,
    fontSize: number,
  ) => number
}

export function createJournalTextMeasurer():
  JournalTextMeasurer {
  const canvas =
    document.createElement(
      'canvas',
    )

  const canvasContext =
    canvas.getContext('2d')

  if (!canvasContext) {
    throw new Error(
      'Unable to create Journal text measurement context.',
    )
  }

  const context:
    CanvasRenderingContext2D =
    canvasContext

  function setFont(
    fontFamily: string,
    fontSize: number,
  ) {
    context.font =
      `${fontSize}px ${fontFamily}`
  }

  function measureText(
    text: string,
    fontFamily: string,
    fontSize: number,
  ) {
    setFont(
      fontFamily,
      fontSize,
    )

    return context
      .measureText(text)
      .width
  }

  function getLineHeight(
    fontFamily: string,
    fontSize: number,
  ) {
    setFont(
      fontFamily,
      fontSize,
    )

    const metrics =
      context.measureText('Mg')

    const measuredHeight =
      metrics
        .actualBoundingBoxAscent +
      metrics
        .actualBoundingBoxDescent

    return Math.max(
      measuredHeight * 1.25,
      fontSize * 1.4,
    )
  }

  return {
    measureText,
    getLineHeight,
  }
}