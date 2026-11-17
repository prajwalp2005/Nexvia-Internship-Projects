"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";

type Peer = { name: string; color: string; cursor?: number };
const palette = ["#2563eb", "#059669", "#9333ea", "#ea580c", "#db2777", "#0891b2"];

export default function CollaborativeEditor({ room }: { room: string }) {
  const [status, setStatus] = useState("Connecting…");
  const [text, setText] = useState("");
  const [peers, setPeers] = useState<Peer[]>([]);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState("Local recovery enabled");
  const docRef = useRef<Y.Doc | null>(null);
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const applying = useRef(false);
  const clientColor = useMemo(() => palette[Math.floor(Math.random() * palette.length)], []);

  useEffect(() => {
    const guest = `Guest ${Math.floor(100 + Math.random() * 900)}`;
    const displayName = window.localStorage.getItem("nexvia-display-name") || guest;
    setName(displayName);
    const doc = new Y.Doc(); docRef.current = doc;
    const ytext = doc.getText("content");
    const localDb = new IndexeddbPersistence(`nexvia-${room}`, doc);
    const provider = new WebsocketProvider(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234", room, doc);
    providerRef.current = provider;
    provider.awareness.setLocalStateField("user", { name: displayName, color: clientColor, cursor: 0 });
    const sync = () => { applying.current = true; setText(ytext.toString()); applying.current = false; setSaved("Changes saved locally"); };
    const updatePeers = () => {
      const list: Peer[] = [];
      provider.awareness.getStates().forEach((state, clientId) => {
        if (clientId === doc.clientID || !state.user) return;
        list.push({ name: state.user.name || "Guest", color: state.user.color || "#64748b", cursor: state.user.cursor });
      });
      setPeers(list);
    };
    const onStatus = (event: { status: string }) => setStatus(event.status === "connected" ? "Live" : "Offline · reconnecting");
    ytext.observe(sync); provider.awareness.on("change", updatePeers); provider.on("status", onStatus); sync(); updatePeers();
    localDb.on("synced", () => setSaved("Local recovery ready"));
    return () => { ytext.unobserve(sync); provider.awareness.off("change", updatePeers); provider.off("status", onStatus); provider.destroy(); localDb.destroy(); doc.destroy(); };
  }, [room, clientColor]);

  function update(value: string) {
    setText(value);
    if (applying.current || !docRef.current) return;
    const ytext = docRef.current.getText("content");
    // Apply the smallest contiguous text edit rather than replacing the whole shared document.
    let prefix = 0;
    while (prefix < text.length && prefix < value.length && text[prefix] === value[prefix]) prefix++;
    let oldEnd = text.length, newEnd = value.length;
    while (oldEnd > prefix && newEnd > prefix && text[oldEnd - 1] === value[newEnd - 1]) { oldEnd--; newEnd--; }
    docRef.current.transact(() => {
      if (oldEnd > prefix) ytext.delete(prefix, oldEnd - prefix);
      if (newEnd > prefix) ytext.insert(prefix, value.slice(prefix, newEnd));
    });
    setSaved("Syncing changes…");
  }
  function updateCursor() {
    const cursor = textRef.current?.selectionStart ?? 0;
    providerRef.current?.awareness.setLocalStateField("user", { name, color: clientColor, cursor });
  }
  function rename() {
    const next = window.prompt("Name shown to collaborators", name);
    if (!next?.trim()) return;
    const clean = next.trim().slice(0, 32); setName(clean); window.localStorage.setItem("nexvia-display-name", clean);
    providerRef.current?.awareness.setLocalStateField("user", { name: clean, color: clientColor, cursor: textRef.current?.selectionStart ?? 0 });
  }

  return <div className="panel editor-panel">
    <div className="top editor-toolbar"><div><b>Untitled document</b><small className="muted">Room: {room}</small></div><div className="presence"><span className={status === "Live" ? "live-dot" : "offline-dot"}/><span className="tag">{status}</span><button className="rename-btn" onClick={rename}>{name} · Edit name</button>{peers.map((p, i) => <span className="avatar" title={p.name} style={{ background: p.color }} key={`${p.name}-${i}`}>{p.name.slice(0, 1).toUpperCase()}</span>)}</div></div>
    <textarea ref={textRef} className="field doc" aria-label="Collaborative document" value={text} onChange={e => update(e.target.value)} onSelect={updateCursor} onKeyUp={updateCursor} onClick={updateCursor} placeholder="Start writing. Open this room in another browser to collaborate…" />
    <div className="editor-footer"><span>{saved}</span><span>{peers.length + 1} participant{peers.length === 0 ? "" : "s"} · CRDT sync</span></div>
    {peers.length > 0 && <div className="peer-list">Also here: {peers.map(p => <span key={p.name} style={{ color: p.color }}>{p.name}</span>).reduce((a, b) => <>{a}, {b}</>)}</div>}
  </div>;
}
