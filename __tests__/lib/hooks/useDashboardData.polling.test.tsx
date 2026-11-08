/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';

import { useDashboardData } from '../../../lib/hooks/useDashboardData';

const useQueryMock = jest.fn((options: Record<string, unknown>) => ({
  options,
  data: undefined,
  refetch: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: Record<string, unknown>) => useQueryMock(options),
}));

test('does not poll /api/dashboard while the tab is hidden', () => {
  renderHook(() =>
    useDashboardData({ generatedAt: new Date().toISOString() } as never)
  );

  expect(useQueryMock.mock.calls[0][0].refetchIntervalInBackground).toBe(false);
});
