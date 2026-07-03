import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters")
})

export type LoginSchemaType = z.infer<typeof LoginSchema>
export type RegisterSchemaType = z.infer<typeof registerSchema>

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshSchemaType = z.infer<typeof refreshSchema>;

