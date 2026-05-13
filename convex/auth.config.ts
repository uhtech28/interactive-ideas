// Accept JWTs from multiple Clerk instances:
// - Live Clerk (used on uhtech.in / Vercel prod)
// - Test Clerk (used during development)
//
// All providers use the same Convex JWT template name "convex".
export default {
  providers: [
    {
      domain: "https://clerk.uhtech.in",
      applicationID: "convex",
    },
    {
      domain: "https://excited-colt-80.clerk.accounts.dev",
      applicationID: "convex",
    },
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://modern-sheep-57.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
