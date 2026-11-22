export function labelCategory(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function labelStatus(value: string) {
  return value.replace(/_/g, " ");
}