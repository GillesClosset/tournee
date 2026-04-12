// API response types — will be populated in Lot 1+

export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  error: string
  details?: unknown
}
