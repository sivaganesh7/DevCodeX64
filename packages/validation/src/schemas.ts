import { z } from 'zod'

export const PaginationSchema = z.object({
  page:  z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export const UUIDSchema = z.string().uuid()

export type Pagination = z.infer<typeof PaginationSchema>
