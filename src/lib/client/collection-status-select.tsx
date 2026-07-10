"use client";

import { HeadlessSelect } from "@/lib/client/headless-select";
import { collectionStatusLabels, collectionStatusOptions } from "@/lib/client/use-collection";
import type { CollectionStatus } from "@/lib/platform/collection-repository";

export function CollectionStatusSelect({
  current,
  label = "收藏状态",
  labelVisible = false,
  onRemove,
  onSetStatus
}: {
  current?: CollectionStatus;
  label?: string;
  labelVisible?: boolean;
  onRemove?: () => void;
  onSetStatus?: (status: CollectionStatus) => void;
}) {
  return (
    <div className="min-w-0" onClick={(event) => event.stopPropagation()}>
      <HeadlessSelect
        label={label}
        labelVisible={labelVisible}
        onChange={(value) => {
          if (value === "none") {
            onRemove?.();
            return;
          }
          onSetStatus?.(value as CollectionStatus);
        }}
        options={[
          { label: "未收藏", value: "none" },
          ...collectionStatusOptions.map((status) => ({
            label: collectionStatusLabels[status],
            value: status
          }))
        ]}
        size="compact"
        value={current ?? "none"}
      />
    </div>
  );
}
