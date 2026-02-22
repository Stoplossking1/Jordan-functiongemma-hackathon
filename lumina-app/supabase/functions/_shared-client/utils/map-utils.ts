export function getOrAddArray<K, V>(map: Map<K, V[]>, key: K): V[] {
  let array = map.get(key);
  if (!array) {
    array = [];
    map.set(key, array);
  }
  return array;
}
