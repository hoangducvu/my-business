import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { findUserByEmail } from './sheets-users'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await findUserByEmail(credentials.email)
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  pages: { signIn: '/login' },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id    = user.id
        token.name  = user.name
        token.role  = (user as { role?: string }).role   ?? ''
        token.phone = (user as { phone?: string }).phone ?? ''
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id    = token.id    as string
        session.user.name  = token.name  as string
        session.user.role  = token.role  as string
        session.user.phone = token.phone as string
      }
      return session
    },
  },
}

declare module 'next-auth' {
  interface Session {
    user: { id: string; email: string; name: string; role: string; phone: string }
  }
}
declare module 'next-auth/jwt' {
  interface JWT { id: string; role: string; phone: string }
}
