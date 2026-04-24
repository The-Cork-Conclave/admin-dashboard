import { toast } from "sonner";

export const copyToClipboard = async (text: string, message = "Copied to clipboard!") => {
  try {
    await navigator.clipboard.writeText(text);
    toast.info(message);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
};
