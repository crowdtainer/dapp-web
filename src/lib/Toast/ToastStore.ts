import { writable } from "svelte/store";
import type { MessageType } from "./MessageType";

export const toasts = writable(new Array<ToastData>());

export type ToastData = {
  id: number,
  type: MessageType,
  dismissible: boolean,
  timeout: number,
  message: string
};

export const addToast = (toast: ToastData) => {
  toasts.update((all) => [{ ...toast }, ...all]);
  if (toast.timeout > 0) setTimeout(() => dismissToast(toast.id), toast.timeout);
};

export const dismissToast = (id: number) => {
  toasts.update((all) => all.filter((t) => t.id !== id));
};