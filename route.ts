export async function GET() {
  return Response.json({ ok: true, service: "collaborative-workspace", timestamp: new Date().toISOString() });
}
