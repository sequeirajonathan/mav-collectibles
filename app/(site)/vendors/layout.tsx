import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getFlags } from "@lib/data/site";

/** The Vendors section can be switched off in Admin → Site; its pages then don't exist for anyone. */
async function Gate({ children }: { children: React.ReactNode }) {
  if (!(await getFlags()).vendorsVisible) notFound();
  return <>{children}</>;
}

export default function VendorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}
