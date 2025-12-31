import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CapturePage } from './CapturePage';
import * as memoriesApi from '../api/memories';

vi.mock('../api/memories');
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1', email: 'test@test.com' } }),
}));

describe('CapturePage', () => {
  it('renders capture form', () => {
    render(
      <MemoryRouter>
        <CapturePage />
      </MemoryRouter>
    );
    expect(screen.getByText('Capture Memory')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write your memory here...')).toBeInTheDocument();
  });

  it('submits memory', async () => {
    const user = userEvent.setup();
    vi.mocked(memoriesApi.createMemory).mockResolvedValue({
      id: '1',
      textContent: 'Test memory',
      state: 'SAVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(
      <MemoryRouter>
        <CapturePage />
      </MemoryRouter>
    );
    const textarea = screen.getByPlaceholderText('Write your memory here...');
    await user.type(textarea, 'Test memory');
    await user.click(screen.getByText('Save Memory'));

    await waitFor(() => {
      expect(memoriesApi.createMemory).toHaveBeenCalled();
    });
  });
});

