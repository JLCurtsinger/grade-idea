import { ImageResponse } from "next/og"; // use Next’s built-in OG
export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  // Fetch roast JSON
  const api = `${process.env.NEXT_PUBLIC_SITE_URL}/api/roast/${id}`;
  const res = await fetch(api, { cache: "no-store" });
  if (!res.ok) return new Response("Not found", { status: 404 });
  const data = await res.json();
  const r = data?.result ?? {};

  const title = (r.title || "GradeIdea Roast").slice(0, 90);
  const z = ((r.zingers && r.zingers[0]) || "Brutally honest. Strangely helpful.").slice(0, 110);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #0b0b0d 0%, #16161a 60%, #1b0f13 100%)",
          color: "#f8fafc",
          padding: "56px",
          fontSize: 36,
          fontWeight: 600,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#fda4af", fontSize: 24 }}>
          🔥 Roast
        </div>
        <div style={{ marginTop: 20, fontSize: 54, lineHeight: 1.1 }}>{title}</div>
        <div style={{ marginTop: 24, fontSize: 28, color: "#cbd5e1", fontWeight: 400 }}>“{z}”</div>
        <div style={{ marginTop: "auto", fontSize: 24, color: "#a78bfa" }}>gradeidea.cc</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}  