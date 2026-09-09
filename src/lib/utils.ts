import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { APP_NAME } from "@/constants";

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export const generateId = (length = 16): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  return result;
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCodePoint(bytes[i]);
  }
  return btoa(binary);
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.codePointAt(i) ?? 0;
  }
  return bytes.buffer;
};

export const base64UrlEncode = (str: string): string =>
  btoa(str).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");

export const base64UrlDecode = (base64str: string): string =>
  atob(base64str.replaceAll("-", "+").replaceAll("_", "/"));

export const titleTemplate = (title: string): string =>
  title ? `${title} | ${APP_NAME}` : APP_NAME;
