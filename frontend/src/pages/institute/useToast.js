import { useEffect, useState } from "react";

// A short-lived confirmation message. show(message) replaces any current one.
export default function useToast(duration = 3500) {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(timer);
  }, [toast, duration]);

  const show = (message) => setToast((t) => ({ id: (t?.id ?? 0) + 1, message }));
  return [toast, show];
}
