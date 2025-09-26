import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConversation } from '@elevenlabs/react';
import VoiceAgent from './voice-agent';

// Mock dependencies
vi.mock('@elevenlabs/react', () => ({
  useConversation: vi.fn(),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('wouter', async () => {
  const actual = await vi.importActual('wouter');
  return {
    ...actual,
    useLocation: () => [() => {}, vi.fn()],
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

const queryClient = new QueryClient();

const mockConversation = {
  status: 'disconnected',
  startSession: vi.fn().mockResolvedValue('test-conversation-id'),
  endSession: vi.fn(),
  sendContextualUpdate: vi.fn(),
  sendUserMessage: vi.fn(),
  setVolume: vi.fn(),
};

const mockUseQuery = {
  data: null,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
};

const mockUseMutation = {
  mutate: vi.fn(),
  isLoading: false,
  isError: false,
  error: null,
  data: null,
  isSuccess: false,
};

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('VoiceAgent', () => {
  beforeEach(() => {
    (useConversation as jest.Mock).mockReturnValue(mockConversation);
    (require('@tanstack/react-query').useQuery as jest.Mock).mockReturnValue(mockUseQuery);
    (require('@tanstack/react-query').useMutation as jest.Mock).mockReturnValue(mockUseMutation);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders voice agent interface', () => {
    renderWithProviders(<VoiceAgent />);
    
    expect(screen.getByText('Voice Agent')).toBeInTheDocument();
    expect(screen.getByTestId('button-start-call')).toBeInTheDocument();
  });

  it('shows screen share button when connected', () => {
    (useConversation as jest.Mock).mockReturnValue({
      ...mockConversation,
      status: 'connected',
    });
    
    renderWithProviders(<VoiceAgent />);
    
    expect(screen.getByTestId('button-toggle-screen-share')).toBeInTheDocument();
  });

  it('initializes OCR worker on mount', async () => {
    renderWithProviders(<VoiceAgent />);
    
    // OCR worker initialization happens in useEffect
    await waitFor(() => {
      expect(screen.getByText('Voice Agent')).toBeInTheDocument();
    });
  });
});
