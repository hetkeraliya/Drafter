"use client";

import { useParams } from "next/navigation";
import { NotesView } from "@/components/NotesView";

export default function FolderPage() {
  const { id } = useParams<{ id: string }>();
  return <NotesView folderId={id} />;
}
