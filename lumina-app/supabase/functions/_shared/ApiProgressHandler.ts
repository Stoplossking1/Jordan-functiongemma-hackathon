export interface ApiProgressHandler<T = any> {
  onRequestInitiated: (promise: Promise<T>) => void;
}
