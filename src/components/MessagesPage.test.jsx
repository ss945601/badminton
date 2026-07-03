import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MessagesPage from './MessagesPage'

function createToken(memberId) {
  const encodeBase64Url = (value) =>
    btoa(value)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')

  const payload = JSON.stringify({ sub: memberId })
  return `header.${encodeBase64Url(payload)}.signature`
}

describe('MessagesPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('allows the owner to delete their own message', async () => {
    const fetchMock = vi.mocked(global.fetch)

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            member_id: 7,
            nickname: 'Alice',
            content: 'hello world',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: '留言刪除成功' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

    render(<MessagesPage token={createToken(7)} setStatus={vi.fn()} />)

    expect(await screen.findByText('hello world')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /刪除留言/i }))

    await waitFor(() => {
      expect(screen.queryByText('hello world')).not.toBeInTheDocument()
    })
  })
})
