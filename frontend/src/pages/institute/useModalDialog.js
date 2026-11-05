import { useEffect, useEffectEvent, useRef } from "react";

// Opens a <dialog> as a modal when the component mounts and reports every way it can close
// (Escape, a form with method="dialog", or dialog.close()) through onClose.
// The parent mounts the component to open it and unmounts it in onClose.
export default function useModalDialog(onClose) {
  const ref = useRef(null);
  const notifyClose = useEffectEvent(() => onClose?.());

  useEffect(() => {
    const dialog = ref.current;
    // "close" fires asynchronously. In development StrictMode the cleanup below closes the dialog
    // and the effect reopens it straight away, so a late event from that first close must be ignored.
    const handleClose = () => {
      if (!dialog.open) notifyClose();
    };
    dialog.addEventListener("close", handleClose);
    if (!dialog.open) dialog.showModal();
    return () => {
      dialog.removeEventListener("close", handleClose);
      if (dialog.open) dialog.close();
    };
  }, []);

  return ref;
}
