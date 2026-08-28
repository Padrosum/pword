import type { JSONContent } from '@tiptap/core'
import type { PadDocument } from '../types/document'

/**
 * Client-side DOCX export: converts the editor's JSON document into a
 * .docx file using the `docx` library. The library is lazy-imported so it
 * never weighs down the initial editor bundle.
 */

const ORDERED_REF = 'pword-ordered-list'

export async function exportDocx(doc: PadDocument): Promise<Blob> {
  const docx = await import('docx')
  const {
    AlignmentType,
    BorderStyle,
    Document,
    ExternalHyperlink,
    HeadingLevel,
    ImageRun,
    LevelFormat,
    PageBreak,
    Packer,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = docx

  const contentWidthPx = 600

  type ImageRunInstance = InstanceType<typeof ImageRun>

  async function imageRun(node: JSONContent): Promise<ImageRunInstance | string | null> {
    const src = node.attrs?.src
    if (typeof src !== 'string') return null

    if (!src.startsWith('data:image/')) {
      // External images cannot be embedded offline; keep a visible placeholder.
      return '[image]'
    }

    const mimeMatch = /^data:image\/(png|jpeg|gif|bmp);base64,(.+)$/s.exec(src)
    if (!mimeMatch) return '[unsupported image]'

    const [, rawType, base64] = mimeMatch
    let data: Uint8Array
    try {
      const binary = atob(base64!)
      data = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i)
    } catch {
      return '[image]'
    }

    let width = 400
    let height = 300
    try {
      const image = new Image()
      image.src = src
      await image.decode()
      const scale = Math.min(1, contentWidthPx / Math.max(1, image.naturalWidth))
      width = Math.max(1, Math.round(image.naturalWidth * scale))
      height = Math.max(1, Math.round(image.naturalHeight * scale))
    } catch {
      // Keep default dimensions if the image cannot be decoded.
    }

    return new ImageRun({
      type: rawType === 'jpeg' ? 'jpg' : (rawType as 'png' | 'gif' | 'bmp'),
      data,
      transformation: { width, height },
    })
  }

  const hex = (color: string | undefined): string | undefined => {
    if (!color) return undefined
    const value = color.replace('#', '')
    return /^[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : undefined
  }

  const alignmentFor = (textAlign: string | undefined) => {
    switch (textAlign) {
      case 'center': return AlignmentType.CENTER
      case 'right': return AlignmentType.RIGHT
      case 'justify': return AlignmentType.JUSTIFIED
      default: return undefined
    }
  }

  const headingFor = (level: number | undefined) => {
    switch (level) {
      case 1: return HeadingLevel.HEADING_1
      case 2: return HeadingLevel.HEADING_2
      case 3: return HeadingLevel.HEADING_3
      default: return undefined
    }
  }

  const sizeToHalfPoints = (size: string | undefined): number | undefined => {
    if (!size) return undefined
    const match = /^(\d+(?:\.\d+)?)\s*pt$/.exec(size)
    if (!match) return undefined
    return Math.round(Number.parseFloat(match[1]!) * 2)
  }

  function runOptionsFromMarks(node: JSONContent) {
    const options: Record<string, unknown> = {}
    let linkHref: string | undefined
    for (const mark of node.marks ?? []) {
      switch (mark.type) {
        case 'bold': options.bold = true; break
        case 'italic': options.italics = true; break
        case 'underline': options.underline = {}; break
        case 'strike': options.strike = true; break
        case 'code': options.font = 'Courier New'; break
        case 'link': linkHref = mark.attrs?.href; break
        case 'highlight': {
          const fill = hex(mark.attrs?.color)
          if (fill) options.shading = { type: ShadingType.CLEAR, fill }
          break
        }
        case 'textStyle': {
          const color = hex(mark.attrs?.color)
          if (color) options.color = color
          const size = sizeToHalfPoints(mark.attrs?.fontSize)
          if (size) options.size = size
          if (typeof mark.attrs?.fontFamily === 'string' && mark.attrs.fontFamily) {
            // Word knows e.g. "Literata", not the bundled "Literata Variable".
            const family = mark.attrs.fontFamily.split(',')[0]!.replace(/['"]/g, '').trim()
            options.font = family ? family.replace(/ Variable$/, '') : undefined
          }
          break
        }
      }
    }
    return { options, linkHref }
  }

  async function inlineChildren(
    nodes: JSONContent[] | undefined,
    defaults: Record<string, unknown> = {},
  ): Promise<(InstanceType<typeof TextRun> | InstanceType<typeof ExternalHyperlink> | InstanceType<typeof ImageRun>)[]> {
    if (!nodes) return []
    const children: Awaited<ReturnType<typeof inlineChildren>> = []
    for (const node of nodes) {
      if (node.type === 'hardBreak') {
        children.push(new TextRun({ break: 1 }))
        continue
      }
      if (node.type === 'image') {
        const image = await imageRun(node)
        if (image instanceof ImageRun) children.push(image)
        else if (typeof image === 'string') children.push(new TextRun({ text: image, italics: true, color: '888888' }))
        continue
      }
      const text = node.type === 'text' ? (node.text ?? '') : textOfNode(node)
      if (text === '') continue
      const { options, linkHref } = runOptionsFromMarks(node)
      const run = new TextRun({ text, ...defaults, ...options })
      if (linkHref) {
        children.push(new ExternalHyperlink({ children: [run], link: linkHref }))
      } else {
        children.push(run)
      }
    }
    return children
  }

  function textOfNode(node: JSONContent): string {
    if (node.type === 'text') return node.text ?? ''
    return (node.content ?? []).map(textOfNode).join('')
  }

  function blockChildren(node: JSONContent, listDefaults: Record<string, unknown> = {}) {
    return inlineChildren(node.content, listDefaults)
  }

  function listPrefix(kind: 'bullet' | 'ordered' | 'task', level: number) {
    if (kind === 'ordered') return { numbering: { reference: ORDERED_REF, level } }
    return { bullet: { level } }
  }

  async function convertList(
    node: JSONContent,
    kind: 'bullet' | 'ordered' | 'task',
    level: number,
    out: DocxBlock[],
  ) {
    for (const item of node.content ?? []) {
      if (item.type !== 'listItem' && item.type !== 'taskItem') continue
      const checked = item.type === 'taskItem' ? !!item.attrs?.checked : undefined
      const children = item.content ?? []
      let firstParagraphDone = false
      for (const child of children) {
        if (child.type === 'paragraph' && !firstParagraphDone) {
          firstParagraphDone = true
          const prefixRun =
            kind === 'task' ? new TextRun({ text: checked ? '☑ ' : '☐ ' }) : undefined
          const childrenRuns = await blockChildren(child)
          out.push(
            new Paragraph({
              ...listPrefix(kind, level),
              children: prefixRun ? [prefixRun, ...childrenRuns] : childrenRuns,
            }),
          )
        } else if (child.type === 'bulletList') {
          await convertList(child, 'bullet', level + 1, out)
        } else if (child.type === 'orderedList') {
          await convertList(child, 'ordered', level + 1, out)
        } else if (child.type === 'taskList') {
          await convertList(child, 'task', level + 1, out)
        } else {
          await convertNodes([child], out)
        }
      }
      if (!firstParagraphDone) {
        out.push(new Paragraph({ ...listPrefix(kind, level), children: [] }))
      }
    }
  }

  async function convertNodes(nodes: JSONContent[] | undefined, out: DocxBlock[]) {
    if (!nodes) return
    for (const node of nodes) {
      switch (node.type) {
        case 'paragraph': {
          const runs = await inlineChildren(node.content)
          const alignment = alignmentFor(node.attrs?.textAlign)
          out.push(new Paragraph({ alignment, children: runs }))
          break
        }
        case 'heading': {
          const runs = await inlineChildren(node.content)
          out.push(
            new Paragraph({
              heading: headingFor(node.attrs?.level),
              alignment: alignmentFor(node.attrs?.textAlign),
              children: runs,
            }),
          )
          break
        }
        case 'docTitle': {
          const runs = await inlineChildren(node.content, { bold: true, size: 56 })
          out.push(new Paragraph({ children: runs, spacing: { after: 120 } }))
          break
        }
        case 'docSubtitle': {
          const runs = await inlineChildren(node.content, { size: 28, color: '666666' })
          out.push(new Paragraph({ children: runs, spacing: { after: 240 } }))
          break
        }
        case 'bulletList':
          await convertList(node, 'bullet', 0, out)
          break
        case 'orderedList':
          await convertList(node, 'ordered', 0, out)
          break
        case 'taskList':
          await convertList(node, 'task', 0, out)
          break
        case 'blockquote': {
          for (const child of node.content ?? []) {
            const runs = await inlineChildren(child.content, { color: '555555' })
            out.push(new Paragraph({ indent: { left: 720 }, children: runs }))
          }
          break
        }
        case 'codeBlock': {
          const text = textOfNode(node)
          out.push(
            new Paragraph({
              shading: { type: ShadingType.CLEAR, fill: 'F2F0FA' },
              children: [new TextRun({ text, font: 'Courier New', size: 20 })],
            }),
          )
          break
        }
        case 'horizontalRule': {
          out.push(
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999', space: 1 } },
              spacing: { after: 200 },
              children: [],
            }),
          )
          break
        }
        case 'pageBreak': {
          out.push(new Paragraph({ children: [new PageBreak()] }))
          break
        }
        case 'table': {
          const rows = (node.content ?? []).filter((row) => row.type === 'tableRow')
          const builtRows: InstanceType<typeof TableRow>[] = []
          for (const row of rows) {
            const cells = (row.content ?? []).filter(
              (cell) => cell.type === 'tableCell' || cell.type === 'tableHeader',
            )
            const builtCells: InstanceType<typeof TableCell>[] = []
            for (const cell of cells) {
              const children = await convertNodesToBlocks(cell.content)
              builtCells.push(new TableCell({ children }))
            }
            const isHeaderRow = cells.length > 0 && cells.every((cell) => cell.type === 'tableHeader')
            builtRows.push(new TableRow({ tableHeader: isHeaderRow, children: builtCells }))
          }
          out.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: builtRows }))
          break
        }
        case 'image': {
          const image = await imageRun(node)
          if (image instanceof ImageRun) {
            out.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [image] }))
          } else if (typeof image === 'string') {
            out.push(new Paragraph({ children: [new TextRun({ text: image, italics: true, color: '888888' })] }))
          }
          break
        }
        default: {
          // Graceful fallback: keep the text content of unknown nodes.
          const text = textOfNode(node)
          if (text.trim()) out.push(new Paragraph({ children: [new TextRun({ text })] }))
          await convertNodes(node.content, out)
        }
      }
    }
  }

  async function convertNodesToBlocks(nodes: JSONContent[] | undefined): Promise<DocxBlock[]> {
    const out: DocxBlock[] = []
    await convertNodes(nodes, out)
    return out
  }

  const children = await convertNodesToBlocks(doc.content.content ?? [])

  const wordDocument = new Document({
    numbering: {
      config: [
        {
          reference: ORDERED_REF,
          levels: Array.from({ length: 9 }, (_, i) => ({
            level: i,
            format: LevelFormat.DECIMAL,
            text: `%${i + 1}.`,
            alignment: AlignmentType.START,
          })),
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: 'Georgia', size: 24 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1361, bottom: 1361, left: 1304, right: 1304 },
          },
        },
        children,
      },
    ],
  })

  return Packer.toBlob(wordDocument)
}

type DocxBlock = import('docx').Paragraph | import('docx').Table
