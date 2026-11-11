import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { getCurrentProfile } from "@/lib/auth";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const p = await getCurrentProfile();
  return (
    <div>
      <h2 className="mb-4 font-display text-xl uppercase">Profile</h2>
      {p ? <ProfileForm profile={p} /> : <p className="text-muted">Profile unavailable.</p>}
    </div>
  );
}
