import type { ImageFile } from "./printPdf";

export const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("load"));
    im.src = url;
  });
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

export interface LoadedImage {
  name: string;
  url: string;
  file: ImageFile;
}

/**
 * data URL → PDF에 넣을 수 있는 바이트.
 * PNG·JPG는 원본 바이트를 그대로 쓰고(재압축 없음), 그 밖의 형식(WEBP, SVG 예시)은 PNG로 바꾼다.
 */
export async function toImageFile(url: string, name: string): Promise<LoadedImage> {
  const im = await loadImage(url);
  const width = im.naturalWidth;
  const height = im.naturalHeight;
  const head = url.slice(0, 30);
  const mime = head.startsWith("data:image/png") ? "image/png" : head.startsWith("data:image/jpeg") ? "image/jpeg" : null;
  if (mime && url.includes(";base64,")) {
    const bin = atob(url.slice(url.indexOf(",") + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { name, url, file: { bytes, mime, width, height } };
  }
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  c.getContext("2d")!.drawImage(im, 0, 0);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  if (!blob) throw new Error("encode");
  return { name, url, file: { bytes: new Uint8Array(await blob.arrayBuffer()), mime: "image/png", width, height } };
}
