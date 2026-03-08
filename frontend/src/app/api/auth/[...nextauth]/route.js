// File: src/app/api/auth/[...nextauth]/route.js - CREATE THIS FILE
import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'

const handler = NextAuth({
  // Required for NextAuth v4 + Next.js 15 compatibility
  trustHost: true,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          scope: "user:email repo",
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.githubId = profile?.id
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken
      session.user.githubId = token.githubId
      return session
    },
  },
  pages: {
    signIn: '/auth',
  }
})

export { handler as GET, handler as POST }