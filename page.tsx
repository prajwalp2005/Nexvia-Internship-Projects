import CollaborativeEditor from "@/components/CollaborativeEditor";
export default async function WorkspacePage({ params }: { params: Promise<{room:string}> }) {
  const { room } = await params;
  return <main className="shell"><header className="top"><a className="brand" href="/">NEXVIA / WORKSPACE</a><span className="tag">Collaborative room</span></header><CollaborativeEditor room={room}/></main>;
}
