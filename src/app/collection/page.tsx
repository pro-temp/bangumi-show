import type { Metadata } from "next";
import { CollectionClient } from "./collection-client";

export const metadata: Metadata = {
  title: "本地收藏 - Bangumi Show"
};

export default function CollectionPage() {
  return <CollectionClient />;
}
