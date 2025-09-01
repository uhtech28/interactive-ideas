import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
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
