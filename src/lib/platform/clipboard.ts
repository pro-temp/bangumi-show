export type ClipboardWriter = {
  writeText(value: string): Promise<void>;
};
