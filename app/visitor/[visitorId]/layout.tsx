import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Visitor } from "@/lib/types";
import { VisitorWelcomeHeader } from "@/components/VisitorWelcomeHeader";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ visitorId: string }>;
  children: React.ReactNode;
};

export default async function VisitorLayout({ params, children }: Props) {
  const { visitorId } = await params;

  const { data: visitorData, error } = await supabase
    .from("visitors")
    .select("*")
    .eq("id", visitorId)
    .single();

  if (error || !visitorData) notFound();

  const visitor = visitorData as Visitor;

  return (
    <div className="min-h-screen flex flex-col items-center">
      <main className="w-full max-w-[540px] min-h-screen lg:min-h-0 lg:my-8 lg:rounded-2xl lg:border lg:border-[var(--color-border)] lg:shadow-2xl lg:shadow-black/40 lg:overflow-hidden">
        <VisitorWelcomeHeader visitor={visitor} />
        {children}
      </main>
    </div>
  );
}
