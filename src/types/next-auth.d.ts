import { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      companyId: string;
      companyName: string;
    };
  }

  interface User {
    role: UserRole;
    companyId: string;
    companyName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    companyId: string;
    companyName: string;
  }
}
