import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <SignIn
        routing="path"
        path="/sign-in"
        afterSignInUrl="/onboarding"
        appearance={{
          baseTheme: undefined,
          variables: {
            colorBackground: 'hsl(var(--background))',
            colorInputBackground: 'hsl(var(--background))',
            colorInputText: 'hsl(var(--foreground))',
            colorPrimary: 'hsl(var(--primary))',
          },
          elements: {
            formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
            card: 'bg-card border-border',
            headerTitle: 'text-foreground',
            headerSubtitle: 'text-muted-foreground',
            formFieldLabel: 'text-foreground',
            formFieldInput: 'bg-input border-border text-foreground',
            footerActionLink: 'text-primary hover:text-primary/90',
          },
        }}
      />
    </div>
  );
}
