import { createFileRoute } from "@tanstack/react-router";
import BookingWizard from "@/pages/BookingWizard";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book an appointment — MESOB Hawassa" },
      {
        name: "description",
        content:
          "Book your visit to the MESOB Hawassa government service center in 4 simple steps.",
      },
    ],
  }),
  component: BookingWizard,
});
