import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

describe('App', () => {
  it('renders the member overview and message board navigation links', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getAllByRole('link', { name: /會員總覽/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /留言板/i }).length).toBeGreaterThan(0)
  })
})
