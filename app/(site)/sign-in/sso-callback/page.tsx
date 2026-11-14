import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function Page() {
  // Final step of the custom OAuth flow started by signIn.sso() / signUp.sso().
  // OAuth sign-ups that still need a username or phone resume on /sign-up/continue.
  return <AuthenticateWithRedirectCallback continueSignUpUrl="/sign-up/continue" />
}
