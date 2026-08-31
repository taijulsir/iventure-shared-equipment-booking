import { CenteredLoader } from "@/components/ui/CenteredLoader";

export default function ReservationsLoading() {
  return (
    <CenteredLoader
      title="Loading reservations..."
      subtitle="Fetching booking schedules and ownership records"
    />
  );
}
