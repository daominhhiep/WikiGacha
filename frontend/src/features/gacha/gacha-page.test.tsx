import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import GachaPage from './gacha-page';
import { useOpenPack, useGachaStore } from './use-gacha';
import { useAuthStore } from '../auth/auth-store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
vi.mock('./use-gacha', () => ({
  useOpenPack: vi.fn(),
  useGachaStore: vi.fn(),
}));

vi.mock('./gacha-reveal', () => ({
  default: ({ isLoading, error, cards }: any) => (
    <div data-testid="gacha-reveal">
      {isLoading && <span>LOADING_STATE</span>}
      {error && <span>ERROR_STATE</span>}
      {cards && <span>HAS_CARDS</span>}
    </div>
  ),
}));

vi.mock('../auth/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock Lucide icons to avoid rendering issues in tests
vi.mock('lucide-react', () => ({
  Terminal: () => <div data-testid="terminal-icon" />,
  ShieldAlert: () => <div data-testid="shield-alert-icon" />,
  Cpu: () => <div data-testid="cpu-icon" />,
  Database: () => <div data-testid="database-icon" />,
  Network: () => <div data-testid="network-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('GachaPage', () => {
  const mockOpenPack = vi.fn();
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuthStore as any).mockReturnValue({
      accessToken: 'mock-token',
      player: { pityCounter: 0 },
    });

    (useGachaStore as any).mockReturnValue({
      lastOpenedCards: null,
      reset: mockReset,
    });

    (useOpenPack as any).mockReturnValue({
      mutate: mockOpenPack,
      isPending: false,
      error: null,
    });
  });

  it('renders the open pack button when authenticated', () => {
    render(<GachaPage />, { wrapper });
    expect(screen.getByText('INITIATE_BREACH')).toBeInTheDocument();
  });

  it('disables the button when isOpening is true', () => {
    (useOpenPack as any).mockReturnValue({
      mutate: mockOpenPack,
      isPending: true,
      error: null,
    });

    render(<GachaPage />, { wrapper });
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // Match partial text since it has icons
    expect(screen.getByText(/BREACHING.../)).toBeInTheDocument();
  });

  it('calls openPack when button is clicked and shows reveal immediately', () => {
    render(<GachaPage />, { wrapper });
    const button = screen.getByText('INITIATE_BREACH');
    fireEvent.click(button);
    expect(mockOpenPack).toHaveBeenCalledWith('BASIC');
    expect(screen.getByTestId('gacha-reveal')).toBeInTheDocument();
  });

  it('shows error state in GachaReveal when apiError is present', () => {
    (useOpenPack as any).mockReturnValue({
      mutate: mockOpenPack,
      isPending: false,
      error: new Error('TEST_ERROR'),
    });

    render(<GachaPage />, { wrapper });

    // Trigger transition
    fireEvent.click(screen.getByText('INITIATE_BREACH'));

    expect(screen.getByTestId('gacha-reveal')).toBeInTheDocument();
    expect(screen.getByText('ERROR_STATE')).toBeInTheDocument();
  });

  it('shows login required when not authenticated', () => {
    (useAuthStore as any).mockReturnValue({
      accessToken: null,
      player: null,
    });

    render(<GachaPage />, { wrapper });
    expect(screen.getByText('LOGIN_REQUIRED')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
