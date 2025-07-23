import { validateUser } from "@/app/auth/userStoreApi";
import { Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import jwt, { JwtPayload } from "jsonwebtoken";
import { DefaultSession, DefaultUser, NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  export interface Session {
    user: {
      id?: string | null;
      propertyId?: string;
    } & DefaultSession["user"];
  }

  export interface User extends DefaultUser {
    token?: string;
    propertyId?: string;
  }
}

declare module "next-auth/jwt" {
  export interface JWT {
    id?: string | null;
    propertyId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "John Smith",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: Record<"username" | "password", string> | undefined
      ): Promise<User | null> {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Please enter both username and password.");
        }

        try {
          const user = await validateUser({
            username: credentials.username,
            temporaryPassword: credentials.password,
          });

          return user; // must be defined if 200 OK
        } catch (error: unknown) {
          // This message gets passed to the frontend error query param
          if (error instanceof Error) {
            throw new Error(error.message || "Authentication failed.");
          }
          throw new Error("Authentication failed.");
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    jwt: async ({ token, user }: { token: JWT; user?: User }) => {
      if (user) {
        token.propertyId = user.propertyId;

        if (user.token) {
          const decoded: string | JwtPayload | null = jwt.decode(user.token);
          if (
            decoded &&
            typeof decoded !== "string" &&
            "unique_name" in decoded
          ) {
            token.id = decoded.unique_name?.[0] || null;
          }
        }
      }

      return token;
    },
    session: async ({ session, token }: { session: Session; token: JWT }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id || null,
          propertyId: token.propertyId || null,
        },
      };
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 3 * 60 * 60, // 3 hours
  },
  debug: process.env.NODE_ENV === "development",
};
