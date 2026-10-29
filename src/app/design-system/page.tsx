import { notFound } from "next/navigation";
import DesignSystemReview from "./review";

export const metadata = {
  title: "PRAX · Design system",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DesignSystemReview />;
}
