export function navigateTo(page: string) {
  const path = `/${page}`;
  if (typeof window !== 'undefined') {
    window.location.assign(path);
  }
}
