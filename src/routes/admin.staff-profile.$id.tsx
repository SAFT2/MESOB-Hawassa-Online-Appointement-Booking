import { createFileRoute } from "@tanstack/react-router";
import ProtectedRoute from "@/components/ProtectedRoute";
import StaffProfile from "@/pages/admin/StaffProfile";

export const Route = createFileRoute("/admin/staff-profile/$id")({
  component: () => (
    <ProtectedRoute allowedRoles={["admin"]}>
      <StaffProfile />
    </ProtectedRoute>
  ),
});