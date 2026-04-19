/**
 * Auth mock helpers for integration tests.
 *
 * In each test file, declare at the top (vitest hoisting):
 *   vi.mock('@/auth')
 *
 * Then in beforeEach / per test:
 *   import { auth } from '@/auth'
 *   import { mockAuthenticated, mockUnauthenticated, fakeSession } from '../helpers/mock-auth'
 *   mockAuthenticated(vi.mocked(auth))
 */
import { vi } from 'vitest'
import type { Session } from 'next-auth'

export const fakeSession: Session = {
  user: { id: '1', email: 'admin@test.com', name: 'Nath' },
  expires: new Date(Date.now() + 86_400_000).toISOString(),
}

export function mockAuthenticated(authMock: ReturnType<typeof vi.fn>): void {
  authMock.mockResolvedValue(fakeSession)
}

export function mockUnauthenticated(authMock: ReturnType<typeof vi.fn>): void {
  authMock.mockResolvedValue(null)
}
