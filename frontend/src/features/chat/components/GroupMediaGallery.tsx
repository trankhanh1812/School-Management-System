"use client";

import { useEffect, useState } from "react";
import chatApi from "@/features/chat/api";

type Props = { groupId: string };

export default function GroupMediaGallery({ groupId }: Props) {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, [groupId]);

  async function fetchMedia() {
    setLoading(true);
    try {
      const data = await chatApi.listGroupMessages(groupId, 0, 200);
      const items = Array.isArray(data.content) ? data.content : [];
      const mediaItems = items.filter((m) => m.mediaUrl).map((m) => ({ url: m.mediaUrl, type: m.mediaType, name: m.fileName }));
      setMedia(mediaItems);
    } catch (e) {
      console.error(e);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Đang tải tệp đa phương tiện...</div>;
  if (media.length === 0) return <div className="text-sm text-slate-500">Nhóm này chưa có tệp đa phương tiện.</div>;

  return (
    <div className="grid grid-cols-3 gap-3">
      {media.map((m, idx) => (
        <a key={idx} href={m.url} target="_blank" rel="noreferrer" className="block border rounded overflow-hidden">
          {m.type?.startsWith("image") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.url} alt={m.name || "media"} className="w-full h-40 object-cover" />
          ) : (
            <div className="p-4 flex items-center justify-center text-sm">{m.name || m.type}</div>
          )}
        </a>
      ))}
    </div>
  );
}
