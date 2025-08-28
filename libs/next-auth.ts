import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from '@prisma/client';
import { AuthService } from "@/modules/auth/services";
import config from "@/config";
import { PRISMA } from "./prisma";

export const authOptions = {
  // Set any random key in .env.local
  secret: process.env.NEXTAUTH_SECRET,
  adapter: {
    ...PrismaAdapter(PRISMA),
    createUser: async (user: any) => {
      const createdUser = await PRISMA.user.create({
        data: {
          ...user,
          role: user.role || Role.WORKER, // Default role if not provided
        },
      });
      return createdUser;
    },
  },
  providers: [
    GoogleProvider({
      // Follow the "Login with Google" tutorial to get your credentials
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.given_name ? profile.given_name : profile.name,
          email: profile.email,
          image: profile.picture,
          role: Role.WORKER, // Default role for new social signups
          createdAt: new Date(),
        };
      },
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name?.firstName ? `${profile.name.firstName} ${profile.name.lastName}` : profile.email,
          email: profile.email,
          image: null,
          role: Role.WORKER, // Default role for new social signups
          createdAt: new Date(),
        };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isRegister: { label: "Register", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Check if this is a registration attempt
          if (credentials.isRegister === "true") {
            const result = await AuthService.createUser({
              email: credentials.email as string,
              password: credentials.password as string,
              sendVerificationEmail: true // Enable email verification
            });

            return {
              id: result.user.id,
              email: result.user.email,
              name: result.user.name,
              image: result.user.image,
              role: result.user.role,
            };
          }

          // Login attempt
          const user = await AuthService.authenticateUser({
            email: credentials.email as string,
            password: credentials.password as string,
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          const errorMessage = error instanceof Error ? error.message : "Authentication failed";

          // NextAuth doesn't have a clean way to pass custom errors from authorize()
          // The error will be caught by the client as 'CredentialsSignin'
          // We'll handle specific error messages in the client based on the generic error
          throw new Error(errorMessage);
        }
      }
    }),
    EmailProvider({
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: config.resend.fromNoReply,
    }),
  ],
  // New users will be saved in Database using Prisma. Each user (model) has some fields like name, email, image, etc..
  // The PrismaAdapter handles user creation and management automatically.

  callbacks: {
    jwt: async ({ token, user }: any) => {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }: any) => {
      if (session?.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
    async signIn({ account }: any) {
      // If this is a credentials sign-in, user is already validated
      if (account?.provider === 'credentials') {
        return true;
      }
      return true;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  theme: {
    brandColor: config.colors.main,
    // Add you own logo below. Recommended size is rectangle (i.e. 200x50px) and show your logo + name.
    // It will be used in the login flow to display your logo. If you don't add it, it will look faded.
    logo: `https://${config.domainName}/logoAndName.png`,
  },
   // 👇 add this
   pages: {
    signIn: "/auth/login",   // your custom login page
    verifyRequest: "/auth/verify-email", // optional, for email magic links
    error: "/auth/error", // optional, custom error page
  },
  events: {
    async signIn(message: any) {
      console.log("SignIn event:", message)
    },
    async createUser(message: any) {
      console.log("CreateUser event:", message)
    }
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
