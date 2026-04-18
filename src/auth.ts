import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = process.env.ADMIN_EMAIL
        const hash = process.env.ADMIN_PASSWORD_HASH
        if (!email || !hash) return null
        if (credentials.email !== email) return null
        const valid = await bcrypt.compare(credentials.password as string, hash)
        if (!valid) return null
        return { id: '1', email, name: 'Nath' }
      },
    }),
  ],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
})
