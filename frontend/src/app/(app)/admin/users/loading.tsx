import { CenteredLoader } from "@/components/ui/CenteredLoader";

export default function UsersLoading() {
  return (
    <CenteredLoader
      title="Loading users..."
      subtitle="Fetching accounts and role assignments"
    />
  );
}
