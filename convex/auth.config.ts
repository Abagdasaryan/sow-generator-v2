import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://sweeping-locust-66.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
