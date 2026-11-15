import { redirect } from 'next/navigation';

// Orders used to live at /feed. Old bookmarks, shared links and the installed app's shortcut still land here.
export default function FeedRedirect() {
  redirect('/orders');
}
