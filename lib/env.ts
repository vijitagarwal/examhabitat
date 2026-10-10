import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().refine((value) => /^https?:\/\//.test(value)),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})
// Empty examples and malformed config must show setup UI, never crash or use fallback credentials.
export const env = parsed.success ? parsed.data : { NEXT_PUBLIC_SUPABASE_URL: undefined, NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined }
export const hasSupabaseEnv = parsed.success
