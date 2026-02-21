export enum TextType {
  NONE,
  REGULAR,
  SUMMARY,
  DONE,
}

export type TextStreamer = (textMessages: Array<[string, TextType]>, isEndOfStream: boolean) => void;
