export function isVinfruitsRootHost(hostname = "") {
  const host = hostname.toLowerCase().split(":")[0];
  return (
    host === "vinfruits.com" ||
    host === "www.vinfruits.com" ||
    host === "vinfruits.localhost" ||
    host.startsWith("vinfruits.")
  );
}

export function isCurrentVinfruitsRootHost() {
  if (typeof window === "undefined") return false;
  return isVinfruitsRootHost(window.location.hostname);
}
