import { createFileRoute } from "@tanstack/react-router";
import ProtectedRoute from "@/components/ProtectedRoute";
import MyAppointments from "@/pages/MyAppointments";

export const Route = createFileRoute("/my-appointments")({
  component: () => (
    <ProtectedRoute allowedRoles={["citizen", "agent", "admin"]}>
      <MyAppointments />
    </ProtectedRoute>
  ),
});