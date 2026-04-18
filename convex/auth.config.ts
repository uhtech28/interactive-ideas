// For local development with Clerk
// The domain should match your Clerk instance without https://
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "modern-sheep-57.clerk.accounts.dev",
      applicationID: "convex",
    },
  ]
};
