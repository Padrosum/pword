import StarterKit from '@tiptap/starter-kit'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import { mergeAttributes } from '@tiptap/core'
import { DocSubtitle, DocTitle } from './doc-title'
import { FontSize } from './font-size'
import { PageBreak } from './page-break'

export function buildExtensions(): ReturnType<typeof collect> {
  return collect()
}

function isSafeImageSource(src: unknown): src is string {
  return typeof src === 'string' && /^data:image\/(png|jpeg|gif|webp);base64,/i.test(src)
}

const SafeImage = Image.extend({
  parseHTML() {
    return [{
      tag: 'img[src]',
      getAttrs: (element) => (isSafeImageSource(element.getAttribute('src')) ? {} : false),
    }]
  },

  renderHTML({ HTMLAttributes }) {
    if (!isSafeImageSource(HTMLAttributes.src)) {
      return [
        'span',
        { role: 'img', 'aria-label': 'Remote image blocked', 'data-blocked-image': '' },
        '[remote image blocked]',
      ]
    }
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },
})

function collect() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: { HTMLAttributes: { spellcheck: false } },
      // Long documents accumulate huge undo stacks; cap memory growth.
      history: { depth: 100, newGroupDelay: 500 },
    }),
    Underline,
    TextStyle,
    FontSize,
    Color,
    FontFamily,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      protocols: ['http', 'https', 'mailto'],
      HTMLAttributes: {
        rel: 'noopener noreferrer nofollow',
      },
    })
      // Defense-in-depth: never parse links with unsafe URL schemes from
      // imported files or pasted content. Non-matching <a> elements are
      // dropped as marks, but their text content is kept.
      .extend({
        parseHTML() {
          return [
            {
              tag:
                'a[href]:not([href^="javascript:" i]):not([href^="vbscript:" i]):not([href^="data:" i]):not([href^="file:" i])',
            },
          ]
        },
      }),
    SafeImage.configure({
      inline: false,
      allowBase64: true,
    }),
    Placeholder.configure({
      placeholder: 'Start writing…',
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: true, lastColumnResizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    DocTitle,
    DocSubtitle,
    PageBreak,
  ]
}
