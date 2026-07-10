import type { Metadata } from "next";
import { CollectionClient } from "./collection-client";

export const metadata: Metadata = {
  title: "我的收藏"
};

export default function CollectionPage() {
  return <CollectionClient />;
}
