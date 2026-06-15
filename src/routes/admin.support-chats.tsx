import { createFileRoute } from "@tanstack/react-router";
import SupportChats from "@/pages/admin/SupportChats";

export const Route = createFileRoute("/admin/support-chats")({ component: SupportChats });
