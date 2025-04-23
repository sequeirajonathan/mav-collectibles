import { Metadata } from 'next'
import SignUpForm from './SignUpForm'

export const metadata: Metadata = {
  title: 'Sign Up | MAV Collectables',
  description: 'Create a new account to start shopping at MAV Collectables',
}

export default function SignUpPage() {
  return <SignUpForm />
}
