import { Metadata } from "next";
import RoastPoller from "@/components/RoastPoller";

async function getRoastData(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/roast/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const og = base ? `${base}/api/og/roast?id=${params.id}` : undefined;
  return {
    title: "GradeIdea Roast",
    description: "A brutally honest (and useful) startup roast.",
    openGraph: og ? { images: [{ url: og }] } : undefined,
    twitter: og ? { card: "summary_large_image", images: [og] } : undefined,
  };
}

export default async function Page({ 
  params, 
  searchParams 
}: { 
  params: { id: string };
  searchParams: { session_id?: string };
}) {
  const data = await getRoastData(params.id);
  if (!data) return <div className="p-8 text-neutral-400">Roast not found.</div>;
  const r = data.result || {};
  const hasSessionId = !!searchParams.session_id;
  
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-2xl p-6">
        {hasSessionId && (
          <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-blue-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-sm">Processing your payment...</span>
            </div>
          </div>
        )}
        
        <article id="roast-card" className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl">
          <h1 className="text-2xl font-semibold mb-4">{r.title || "Your Roast"}</h1>
          <div className="mb-4">
            <div className="text-sm text-neutral-400 mb-1">Zingers</div>
            <ul className="list-disc pl-5 space-y-2">{(r.zingers || []).map((z: string, i: number) => <li key={i}>{z}</li>)}</ul>
          </div>
          <div className="mb-4">
            <div className="text-sm text-neutral-400 mb-1">Useful Takeaways</div>
            <ul className="list-disc pl-5 space-y-2">{(r.insights || []).map((t: string, i: number) => <li key={i}>{t}</li>)}</ul>
          </div>
          <div className="text-neutral-300"><span className="text-neutral-400">Verdict:</span> {r.verdict}</div>
        </article>
        
        {hasSessionId && <RoastPoller id={params.id} initial={data} />}
      </div>
    </main>
  );
}
