/**
 * Shared DB mock for integration tests.
 *
 * Uses a Proxy-based chainable mock so that any Drizzle fluent chain
 * (`.select().from(x).where(...).orderBy(...)`) resolves to the
 * configured `returnValue`.
 *
 * Usage in a test file:
 *   vi.mock('@/lib/db', () => ({ db: mockDb }))
 *
 * Override a single call:
 *   mockDb.select.mockReturnValueOnce(makeChain([{ id: '1', name: 'Driver 1' }]))
 */
import { vi } from 'vitest'

type AnyFn = (...args: unknown[]) => unknown

// Returns a Proxy that is both thenable (resolves to `value`) and has
// every method call return another identical chain.
export function makeChain(value: unknown = []): Promise<unknown> & Record<string, AnyFn> {
  const p = Promise.resolve(value)
  const handler: ProxyHandler<Promise<unknown>> = {
    get(target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        const val = (target as unknown as Record<string | symbol, unknown>)[prop]
        return val ? (val as (cb: unknown) => unknown).bind(target) : undefined
      }
      // Any drizzle method (from, where, orderBy, values, returning, set, limit, …)
      // returns a new chain carrying the same value.
      return () => makeChain(value)
    },
  }
  return new Proxy(p, handler) as Promise<unknown> & Record<string, AnyFn>
}

// A transaction mock that executes the callback synchronously with mockDb as tx.
function makeTxMock(): ReturnType<typeof vi.fn> {
  return vi.fn(async (fn: (tx: typeof mockDb) => unknown) => fn(mockDb))
}

export const mockDb = {
  select: vi.fn(() => makeChain([])),
  insert: vi.fn(() => makeChain([])),
  update: vi.fn(() => makeChain([])),
  delete: vi.fn(() => makeChain(undefined)),
  transaction: makeTxMock(),
}

// Reset all mocks between tests — call in beforeEach.
export function resetDbMocks() {
  mockDb.select.mockReset()
  mockDb.insert.mockReset()
  mockDb.update.mockReset()
  mockDb.delete.mockReset()
  mockDb.transaction.mockReset()

  mockDb.select.mockReturnValue(makeChain([]))
  mockDb.insert.mockReturnValue(makeChain([]))
  mockDb.update.mockReturnValue(makeChain([]))
  mockDb.delete.mockReturnValue(makeChain(undefined))
  mockDb.transaction.mockImplementation(async (fn: (tx: typeof mockDb) => unknown) => fn(mockDb))
}
