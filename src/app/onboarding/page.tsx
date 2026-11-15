import { redirect } from 'next/navigation';

// Setup moved into the guided wizard at /welcome. Kept as a redirect so the Setup tab, old links
// and bookmarks still land somewhere sensible.
export default function OnboardingRedirect() {
  redirect('/welcome');
}
