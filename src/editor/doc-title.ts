import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Document-level Title and Subtitle block styles.
 * Rendered as attributed <div> elements so they never collide with the
 * heading parse rules of the Heading extension.
 */

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    docTitle: {
      setDocTitle: () => ReturnType
    }
    docSubtitle: {
      setDocSubtitle: () => ReturnType
    }
  }
}

const titleNode = (name: string, cssClass: string, ariaLabel: string) =>
  Node.create({
    name,
    content: 'inline*',
    group: 'block',
    defining: true,
    marks: '',

    parseHTML() {
      return [{ tag: `div[data-doc-${name}]` }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'div',
        mergeAttributes(HTMLAttributes, {
          [`data-doc-${name}`]: '',
          class: cssClass,
          role: 'heading',
          'aria-level': ariaLabel === 'Title' ? 1 : 2,
        }),
        0,
      ]
    },
  })

export const DocTitle = titleNode('docTitle', 'doc-title', 'Title')
export const DocSubtitle = titleNode('docSubtitle', 'doc-subtitle', 'Subtitle')
