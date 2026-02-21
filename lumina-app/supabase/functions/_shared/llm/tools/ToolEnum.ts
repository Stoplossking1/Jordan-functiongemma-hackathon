export interface ToolEnum<V> {
  name: string;
  value: V;
  // if set to true, bot will read back entered value and have user confirm with yes/no
  confirmInput?: boolean;
}
