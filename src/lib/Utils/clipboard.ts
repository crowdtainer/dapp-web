import { MessageType } from "$lib/Toast/MessageType.js";
import { addToast, type ToastData } from "$lib/Toast/ToastStore.js";

export function copyToClipBoardAndNotify(description: string, text?: string) {
    if (!text) return;

    navigator.clipboard.writeText(text);

    let toast: ToastData = {
        id: Math.floor(Math.random() * 10000),
        type: MessageType.Info,
        dismissible: true,
        timeout: 7000,
        message: `${description} copied to clipboard.`
    };
    addToast(toast);
}