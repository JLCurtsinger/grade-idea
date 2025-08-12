import { Metadata } from "next";

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

export default async function Page({ params }: { params: { id: string } }) {
  const data = await getRoastData(params.id);
  if (!data) return <div className="p-8 text-neutral-400">Roast not found.</div>;
  const r = data.result || {};
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-2xl p-6">
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
      </div>
    </main>
  );
}
