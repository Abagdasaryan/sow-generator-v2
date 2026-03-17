import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

const ALLOWED_EMAILS = ["abagdasaryan12@gmail.com"];

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = (params.email as string).toLowerCase();
        if (!ALLOWED_EMAILS.includes(email)) {
          throw new Error("This email is not authorized to use this app.");
        }
        return {
          email,
          name: params.name as string,
        };
      },
    }),
  ],
});
