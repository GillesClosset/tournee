import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = process.env.ADMIN_EMAIL
        // Hash is stored in source to avoid $ sign mangling by shell/Coolify env parser.
        // Bcrypt hashes are not secrets — they are one-way and safe to commit.
        // To rotate: run `node -e "require('bcryptjs').hash('newpassword',10).then(console.log)"`
        const hash =
          process.env.ADMIN_PASSWORD_HASH ||
          '$2b$10$vuJvDVHJXtnvbiJS43i4OORT.fmKYONJSiucmRjxonalqIW3stEQG'
        if (!email) return null
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
