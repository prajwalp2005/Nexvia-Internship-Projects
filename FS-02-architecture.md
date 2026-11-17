# FS-02 — Collaborative Workspace Architecture

```mermaid
flowchart LR
  A[Browser A] <-->|Yjs updates + awareness| W[WebSocket service]
  B[Browser B] <-->|Yjs updates + awareness| W
  A --> I[(IndexedDB local recovery)]
  B --> J[(IndexedDB local recovery)]
  W --> L[(LevelDB Yjs persistence)]
  N[Next.js app shell] --> A
  P[(PostgreSQL / Prisma schema)] -. planned API integration .-> N
  R[(Redis coordination)] -. planned scaling .-> W
```

- Yjs CRDT updates merge concurrent document changes.
- `y-websocket` transports updates and awareness state between clients.
- Awareness exposes participant names/colors and cursor offsets in the collaborator list.
- `y-indexeddb` retains a local browser copy for recovery.
- `y-leveldb` is configured as server-side document persistence.
- The Prisma schema describes users, workspaces, memberships, documents, comments, and snapshots, but the application routes for those entities are not yet connected.

## Current limitation
The editor is a collaborative plain-text editor, not a TipTap/ProseMirror rich-text editor. Presence shows connected collaborators but does not yet render remote caret decorations inside the text area. Permissions, comments, and version-history UI remain to be implemented.
