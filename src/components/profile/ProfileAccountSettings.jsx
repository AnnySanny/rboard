
import ProfilePasswordSettings from "./ProfilePasswordSettings";
import ProfileDeleteAccount from "./ProfileDeleteAccount";

export default function ProfileAccountSettings({
  disabled = false,
}) {
  return (
    <div className="space-y-4">
      <ProfilePasswordSettings disabled={disabled} />

      <ProfileDeleteAccount disabled={disabled} />
    </div>
  );
}
