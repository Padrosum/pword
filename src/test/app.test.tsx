import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import App from '../app/App'

describe('App', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory()
  })

  it('shows the home view with a start-writing action', async () => {
    render(<App />)
    expect(await screen.findByRole('button', { name: /start writing/i })).toBeInTheDocument()
    expect(screen.getByText(/proof desk/i)).toBeInTheDocument()
    expect(screen.getByText(/write privately/i)).toBeInTheDocument()
  })

  it('creates a document, shows the editor, and survives returning home', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /start writing/i }))

    // Editor chrome appears.
    await waitFor(() => {
      expect(screen.getByRole('toolbar', { name: /formatting/i })).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Document title')).toHaveValue('Untitled document')
    expect(screen.getByText('Local')).toBeInTheDocument()

    // Return home — the document should be listed.
    await user.click(screen.getByRole('button', { name: /back to documents/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /open untitled document/i })).toBeInTheDocument()
    })
  })

  it('persists a blank document created from the editor menu', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /start writing/i }))
    await waitFor(() => screen.getByRole('toolbar', { name: /formatting/i }))
    await user.click(screen.getByRole('button', { name: /document menu/i }))
    await user.click(await screen.findByRole('menuitem', { name: /new document/i }))
    await waitFor(() => screen.getByRole('toolbar', { name: /formatting/i }))
    await user.click(screen.getByRole('button', { name: /back to documents/i }))

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /open untitled document/i })).toHaveLength(2)
    })
  })

  it('opens a document from the home list', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /start writing/i }))
    await waitFor(() => screen.getByRole('toolbar', { name: /formatting/i }))
    await user.click(screen.getByRole('button', { name: /back to documents/i }))

    await user.click(await screen.findByRole('button', { name: /open untitled document/i }))
    await waitFor(() => {
      expect(screen.getByRole('toolbar', { name: /formatting/i })).toBeInTheDocument()
    })
  })

  it('renames a document via the title field', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /start writing/i }))
    await waitFor(() => screen.getByRole('toolbar', { name: /formatting/i }))

    const titleInput = screen.getByLabelText('Document title')
    await user.clear(titleInput)
    await user.type(titleInput, 'My Essay')

    await user.click(screen.getByRole('button', { name: /back to documents/i }))
    expect(await screen.findByRole('button', { name: /open my essay/i })).toBeInTheDocument()
  })
})
