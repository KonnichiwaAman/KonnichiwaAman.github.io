/**
 * PDF Compression Engine
 *
 * Pure logic module — no React dependencies. Handles all compression
 * strategies: object-level image optimization, page rasterization,
 * structural cleanup, and multi-pass pipelines.
 */
import {
  PDFArray,
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFObject,
  PDFRawStream,
  PDFRef,
  PDFStream,
  decodePDFRawStream,
} from "pdf-lib";
import { toArrayBuffer, waitForPaint } from "@/tools/shared/utils";
import { loadPdfJs } from "@/tools/pdf-utils";

// ─── Types ──────────────────────────────────────────────────────────

export type CompressionMode = "light" | "recommended" | "strong";
export type CompressionApproach = "quality-first" | "target-size";
export type SizeUnit = "KB" | "MB";

export interface CompressionModeConfig {
  id: CompressionMode;
  label: string;
  subtitle: string;
  description: string;
  maxDownsample: number;
  jpegQuality: number;
}

export interface CompressionResult {
  blob: Blob;
  mode: CompressionMode;
  requestedMode: CompressionMode;
  approach: CompressionApproach;
  imageTotal: number;
  imageOptimized: number;
  duplicateObjectsRemoved: number;
  unusedObjectsRemoved: number;
  durationMs: number;
  usedOriginalFallback: boolean;
  qualityStrategy: string;
  evaluatedProfiles: string[];
  targetSizeBytes?: number;
  metTargetSize?: boolean;
  note?: string;
}

export interface CompressionProgress {
  current: number;
  total: number;
  label: string;
}

interface ImageStreamEntry {
  ref: PDFRef;
  stream: PDFRawStream;
  width: number;
  height: number;
}

interface CompressionCandidate {
  scale: number;
  quality: number;
}

interface ObjectCompressionResult {
  blob: Blob;
  imageTotal: number;
  imageOptimized: number;
  duplicateObjectsRemoved: number;
  unusedObjectsRemoved: number;
}

// ─── Constants ──────────────────────────────────────────────────────

export const MODE_CONFIGS: CompressionModeConfig[] = [
  {
    id: "light",
    label: "Light",
    subtitle: "Less",
    description: "Highest quality. Structural cleanup only.",
    maxDownsample: 0,
    jpegQuality: 1,
  },
  {
    id: "recommended",
    label: "Recommended",
    subtitle: "Default",
    description: "Best balance of quality and size.",
    maxDownsample: 0.2,
    jpegQuality: 0.91,
  },
  {
    id: "strong",
    label: "Strong",
    subtitle: "Extreme",
    description: "Maximum compression — may slightly reduce image quality on photos.",
    maxDownsample: 0.45,
    jpegQuality: 0.78,
  },
];

export const MAX_LARGE_FILE_WARNING_MB = 50;
export const MAX_FILE_SIZE_MB = 200;

const RAW_PIXEL_FILTERS = new Set([
  "FlateDecode",
  "LZWDecode",
  "ASCII85Decode",
  "ASCIIHexDecode",
  "RunLengthDecode",
]);

// ─── Helpers ────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function toBytes(value: number, unit: SizeUnit): number {
  if (unit === "KB") return Math.round(value * 1024);
  return Math.round(value * 1024 * 1024);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.max(1, Math.round(ms))} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function savedPercent(original: number, next: number): number {
  if (original <= 0) return 0;
  return Math.max(0, ((original - next) / original) * 100);
}

export function getModeConfig(mode: CompressionMode): CompressionModeConfig {
  return MODE_CONFIGS.find((c) => c.id === mode) ?? MODE_CONFIGS[1];
}

// ─── PDF Low-Level Utilities ────────────────────────────────────────

function refEquals(a: PDFRef, b: PDFRef): boolean {
  return a.objectNumber === b.objectNumber && a.generationNumber === b.generationNumber;
}

function pdfNameValue(name: PDFName | undefined): string | null {
  if (!name) return null;
  const value = name.asString();
  return value.startsWith("/") ? value.slice(1) : value;
}

function getFilterNames(dict: PDFDict): string[] {
  const filter = dict.lookup(PDFName.of("Filter"));
  if (filter instanceof PDFName) {
    const value = pdfNameValue(filter);
    return value ? [value] : [];
  }

  if (filter instanceof PDFArray) {
    const names: string[] = [];
    for (let index = 0; index < filter.size(); index += 1) {
      const maybeName = filter.lookupMaybe(index, PDFName);
      const value = maybeName ? pdfNameValue(maybeName) : null;
      if (value) names.push(value);
    }
    return names;
  }

  return [];
}

function lookupNumber(dict: PDFDict, key: string): number | null {
  const value = dict.lookupMaybe(PDFName.of(key), PDFNumber);
  return value ? value.asNumber() : null;
}

function isImageXObject(dict: PDFDict): boolean {
  const subtype = dict.lookupMaybe(PDFName.of("Subtype"), PDFName);
  if (pdfNameValue(subtype) !== "Image") return false;

  const type = dict.lookupMaybe(PDFName.of("Type"), PDFName);
  if (!type) return true;
  return pdfNameValue(type) === "XObject";
}

function stripMetadata(pdfDoc: PDFDocument): void {
  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setKeywords([]);
  pdfDoc.setCreator("");
  pdfDoc.setProducer("");
  pdfDoc.setCreationDate(new Date(0));
  pdfDoc.setModificationDate(new Date(0));
  pdfDoc.context.trailerInfo.Info = undefined;
}

function collectImageStreams(pdfDoc: PDFDocument): ImageStreamEntry[] {
  const entries: ImageStreamEntry[] = [];

  for (const [ref, object] of pdfDoc.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFRawStream)) continue;
    if (!isImageXObject(object.dict)) continue;

    const imageMask = object.dict.lookupMaybe(PDFName.of("ImageMask"), PDFBool);
    if (imageMask?.asBoolean()) continue;

    const width = lookupNumber(object.dict, "Width") ?? 0;
    const height = lookupNumber(object.dict, "Height") ?? 0;
    if (width <= 0 || height <= 0) continue;

    entries.push({ ref, stream: object, width, height });
  }

  return entries;
}

// ─── Reference Replacement ──────────────────────────────────────────

function replaceRefInObject(object: PDFObject | undefined, fromRef: PDFRef, toRef: PDFRef): void {
  if (!object) return;

  if (object instanceof PDFDict) {
    for (const [key, value] of object.entries()) {
      if (value instanceof PDFRef && refEquals(value, fromRef)) {
        object.set(key, toRef);
        continue;
      }
      replaceRefInObject(value, fromRef, toRef);
    }
    return;
  }

  if (object instanceof PDFArray) {
    for (let index = 0; index < object.size(); index += 1) {
      const value = object.get(index);
      if (value instanceof PDFRef && refEquals(value, fromRef)) {
        object.set(index, toRef);
        continue;
      }
      replaceRefInObject(value, fromRef, toRef);
    }
    return;
  }

  if (object instanceof PDFStream) {
    replaceRefInObject(object.dict, fromRef, toRef);
  }
}

function replaceRefEverywhere(pdfDoc: PDFDocument, fromRef: PDFRef, toRef: PDFRef): void {
  for (const [, object] of pdfDoc.context.enumerateIndirectObjects()) {
    replaceRefInObject(object, fromRef, toRef);
  }

  const trailer = pdfDoc.context.trailerInfo;

  if (trailer.Root instanceof PDFRef && refEquals(trailer.Root, fromRef)) {
    trailer.Root = toRef;
  } else {
    replaceRefInObject(trailer.Root, fromRef, toRef);
  }

  if (trailer.Encrypt instanceof PDFRef && refEquals(trailer.Encrypt, fromRef)) {
    trailer.Encrypt = toRef;
  } else {
    replaceRefInObject(trailer.Encrypt, fromRef, toRef);
  }

  if (trailer.Info instanceof PDFRef && refEquals(trailer.Info, fromRef)) {
    trailer.Info = toRef;
  } else {
    replaceRefInObject(trailer.Info, fromRef, toRef);
  }

  replaceRefInObject(trailer.ID, fromRef, toRef);
}

// ─── Deduplication & Pruning ────────────────────────────────────────

function collectReferencedRefs(object: PDFObject | undefined, refs: PDFRef[], seen: Set<PDFObject>): void {
  if (!object) return;
  if (seen.has(object)) return;
  seen.add(object);

  if (object instanceof PDFRef) {
    refs.push(object);
    return;
  }

  if (object instanceof PDFDict) {
    for (const [, value] of object.entries()) {
      collectReferencedRefs(value, refs, seen);
    }
    return;
  }

  if (object instanceof PDFArray) {
    for (let index = 0; index < object.size(); index += 1) {
      collectReferencedRefs(object.get(index), refs, seen);
    }
    return;
  }

  if (object instanceof PDFStream) {
    collectReferencedRefs(object.dict, refs, seen);
  }
}

function pruneUnusedObjects(pdfDoc: PDFDocument): number {
  const reachableRefTags = new Set<string>();
  const queue: PDFRef[] = [];
  const seenObjects = new Set<PDFObject>();
  const trailer = pdfDoc.context.trailerInfo;

  collectReferencedRefs(trailer.Root, queue, seenObjects);
  collectReferencedRefs(trailer.Encrypt, queue, seenObjects);
  collectReferencedRefs(trailer.Info, queue, seenObjects);
  collectReferencedRefs(trailer.ID, queue, seenObjects);

  while (queue.length > 0) {
    const ref = queue.pop();
    if (!ref) continue;
    if (reachableRefTags.has(ref.tag)) continue;

    reachableRefTags.add(ref.tag);
    const object = pdfDoc.context.lookup(ref);
    collectReferencedRefs(object, queue, seenObjects);
  }

  let removedCount = 0;
  for (const [ref] of pdfDoc.context.enumerateIndirectObjects()) {
    if (reachableRefTags.has(ref.tag)) continue;
    pdfDoc.context.delete(ref);
    removedCount += 1;
  }

  return removedCount;
}

function bytesToHex(bytes: Uint8Array): string {
  let result = "";
  for (const value of bytes) {
    result += value.toString(16).padStart(2, "0");
  }
  return result;
}

async function hashBytes(bytes: Uint8Array): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", toArrayBuffer(bytes));
    return bytesToHex(new Uint8Array(digest));
  }

  let hash = 2166136261;
  for (const value of bytes) {
    hash ^= value;
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16)}`;
}

async function buildImageSignature(stream: PDFRawStream): Promise<string> {
  const dict = stream.dict;
  const width = lookupNumber(dict, "Width") ?? 0;
  const height = lookupNumber(dict, "Height") ?? 0;
  const bits = lookupNumber(dict, "BitsPerComponent") ?? 8;
  const filter = getFilterNames(dict).join("|") || "none";
  const colorSpace = dict.lookupMaybe(PDFName.of("ColorSpace"), PDFName);
  const colorSpaceName = colorSpace ? pdfNameValue(colorSpace) : "unknown";
  const smask = dict.lookupMaybe(PDFName.of("SMask"), PDFRef);
  const smaskTag = smask ? smask.tag : "none";
  const contentHash = await hashBytes(stream.asUint8Array());

  return `${width}x${height}:${bits}:${filter}:${colorSpaceName}:${smaskTag}:${contentHash}`;
}

async function dedupeDuplicateImageObjects(pdfDoc: PDFDocument): Promise<number> {
  const signatures = new Map<string, PDFRef>();
  let duplicatesRemoved = 0;

  for (const [ref, object] of pdfDoc.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFRawStream)) continue;
    if (!isImageXObject(object.dict)) continue;

    const signature = await buildImageSignature(object);
    const canonicalRef = signatures.get(signature);

    if (!canonicalRef) {
      signatures.set(signature, ref);
      continue;
    }

    replaceRefEverywhere(pdfDoc, ref, canonicalRef);
    pdfDoc.context.delete(ref);
    duplicatesRemoved += 1;
  }

  return duplicatesRemoved;
}

// ─── Image Decoding ─────────────────────────────────────────────────

async function decodeEncodedImage(bytes: Uint8Array, mimeType: string): Promise<HTMLCanvasElement | OffscreenCanvas | null> {
  const blob = new Blob([toArrayBuffer(bytes)], { type: mimeType });

  if ("createImageBitmap" in globalThis) {
    try {
      const bitmap = await createImageBitmap(blob);
      const canvas = typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(bitmap.width, bitmap.height)
        : document.createElement("canvas");
      if (!(canvas instanceof OffscreenCanvas)) {
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
      }
      const context = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
      if (!context) {
        bitmap.close();
        return null;
      }
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      return canvas;
    } catch {
      // Fall through to Image element decoding.
    }
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const canvas = typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(image.naturalWidth || image.width, image.naturalHeight || image.height)
        : document.createElement("canvas");
      if (!(canvas instanceof OffscreenCanvas)) {
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
      }
      const context = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
      URL.revokeObjectURL(url);
      if (!context) {
        resolve(null);
        return;
      }
      context.drawImage(image, 0, 0);
      resolve(canvas);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    image.src = url;
  });
}

function resolveRawColorSpaceName(dict: PDFDict): string | null {
  const colorSpace = dict.lookup(PDFName.of("ColorSpace"));
  if (colorSpace instanceof PDFName) return pdfNameValue(colorSpace);

  if (colorSpace instanceof PDFArray) {
    const first = colorSpace.lookupMaybe(0, PDFName);
    return first ? pdfNameValue(first) : null;
  }

  return null;
}

function decodeMaskAlpha(pdfDoc: PDFDocument, smaskRef: PDFRef, width: number, height: number): Uint8Array | null {
  const maybeStream = pdfDoc.context.lookupMaybe(smaskRef, PDFStream);
  if (!(maybeStream instanceof PDFRawStream)) return null;
  const stream = maybeStream;

  const bits = lookupNumber(stream.dict, "BitsPerComponent") ?? 8;
  if (bits !== 8) return null;

  try {
    const decoded = decodePDFRawStream(stream).decode();
    const requiredLength = width * height;
    if (decoded.length < requiredLength) return null;
    return decoded.slice(0, requiredLength);
  } catch {
    return null;
  }
}

function decodeRawPixelImage(pdfDoc: PDFDocument, stream: PDFRawStream): HTMLCanvasElement | OffscreenCanvas | null {
  const dict = stream.dict;
  const width = lookupNumber(dict, "Width") ?? 0;
  const height = lookupNumber(dict, "Height") ?? 0;
  if (width <= 0 || height <= 0) return null;

  const bits = lookupNumber(dict, "BitsPerComponent") ?? 8;
  if (bits !== 8) return null;

  const colorSpaceName = resolveRawColorSpaceName(dict);
  if (!colorSpaceName) return null;

  let channels = 0;
  if (colorSpaceName === "DeviceGray") channels = 1;
  if (colorSpaceName === "DeviceRGB") channels = 3;
  if (colorSpaceName === "DeviceCMYK") channels = 4;
  if (channels === 0) return null;

  let decoded: Uint8Array;
  try {
    decoded = decodePDFRawStream(stream).decode();
  } catch {
    return null;
  }

  const pixelCount = width * height;
  const expectedLength = pixelCount * channels;
  if (decoded.length < expectedLength) return null;

  const alphaRef = dict.lookupMaybe(PDFName.of("SMask"), PDFRef);
  const alpha = alphaRef ? decodeMaskAlpha(pdfDoc, alphaRef, width, height) : null;

  const rgba = new Uint8ClampedArray(pixelCount * 4);
  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const sourceIndex = pixelIndex * channels;
    const targetIndex = pixelIndex * 4;

    let r = 0;
    let g = 0;
    let b = 0;

    if (channels === 1) {
      const gray = decoded[sourceIndex];
      r = gray;
      g = gray;
      b = gray;
    } else if (channels === 3) {
      r = decoded[sourceIndex];
      g = decoded[sourceIndex + 1];
      b = decoded[sourceIndex + 2];
    } else {
      const c = decoded[sourceIndex] / 255;
      const m = decoded[sourceIndex + 1] / 255;
      const y = decoded[sourceIndex + 2] / 255;
      const k = decoded[sourceIndex + 3] / 255;
      r = Math.round(255 * (1 - c) * (1 - k));
      g = Math.round(255 * (1 - m) * (1 - k));
      b = Math.round(255 * (1 - y) * (1 - k));
    }

    rgba[targetIndex] = r;
    rgba[targetIndex + 1] = g;
    rgba[targetIndex + 2] = b;
    rgba[targetIndex + 3] = alpha ? alpha[pixelIndex] : 255;
  }

  const canvas = typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(width, height)
    : document.createElement("canvas");
  if (!(canvas instanceof OffscreenCanvas)) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!context) return null;

  context.putImageData(new ImageData(rgba, width, height), 0, 0);
  return canvas;
}

// ─── Compression Strategies ─────────────────────────────────────────

function determineDownsampleScale(width: number, height: number, mode: CompressionMode): number {
  if (mode === "light") return 1;

  const longestEdge = Math.max(width, height);

  if (mode === "recommended") {
    if (longestEdge <= 1200) return 0.9;
    if (longestEdge <= 2400) return 0.85;
    return 0.8;
  }

  if (longestEdge <= 1200) return 0.7;
  if (longestEdge <= 2400) return 0.62;
  return 0.55;
}




function getRasterQuality(mode: CompressionMode): number {
  if (mode === "recommended") return 0.86;
  if (mode === "strong") return 0.72;
  return 0.94;
}

function getRasterDpi(mode: CompressionMode, pageCount: number, originalSizeBytes: number): number {
  const sizeMb = originalSizeBytes / (1024 * 1024);

  let baseDpi = mode === "recommended" ? 165 : 130;

  if (pageCount > 120) baseDpi -= 25;
  else if (pageCount > 60) baseDpi -= 15;
  else if (pageCount > 20) baseDpi -= 8;

  if (sizeMb > 100) baseDpi -= 15;
  else if (sizeMb > 50) baseDpi -= 8;

  if (mode === "recommended") {
    return Math.max(130, Math.min(185, baseDpi));
  }

  return Math.max(105, Math.min(150, baseDpi));
}

function fitDimensionsToArea(width: number, height: number, maxArea: number): { width: number; height: number } {
  const currentArea = width * height;
  if (currentArea <= maxArea) {
    return { width, height };
  }

  const scale = Math.sqrt(maxArea / currentArea);
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
}

function buildCompressionCandidates(
  mode: CompressionMode,
  width: number,
  height: number,
  modeConfig: CompressionModeConfig,
): CompressionCandidate[] {
  if (mode === "light") return [];

  const baseScale = determineDownsampleScale(width, height, mode);
  const minScale = 1 - modeConfig.maxDownsample;

  if (mode === "recommended") {
    return [
      { scale: Math.max(minScale, baseScale), quality: modeConfig.jpegQuality },
      { scale: Math.max(minScale, baseScale - 0.04), quality: 0.9 },
      { scale: Math.max(minScale, baseScale - 0.07), quality: 0.88 },
    ];
  }

  return [
    { scale: Math.max(minScale, baseScale), quality: modeConfig.jpegQuality },
    { scale: Math.max(minScale, baseScale - 0.08), quality: 0.74 },
    { scale: Math.max(minScale, baseScale - 0.12), quality: 0.7 },
    { scale: Math.max(minScale, baseScale - 0.16), quality: 0.66 },
  ];
}

function canvasToBlob(canvas: HTMLCanvasElement | OffscreenCanvas, quality: number): Promise<Blob | null> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: "image/jpeg", quality });
  }
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Blob | null> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: "image/png" });
  }
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

async function decodeImageEntry(pdfDoc: PDFDocument, entry: ImageStreamEntry): Promise<HTMLCanvasElement | OffscreenCanvas | null> {
  const filterNames = getFilterNames(entry.stream.dict);

  if (filterNames.length === 1 && filterNames[0] === "DCTDecode") {
    return decodeEncodedImage(entry.stream.asUint8Array(), "image/jpeg");
  }

  if (filterNames.length === 1 && filterNames[0] === "JPXDecode") {
    return decodeEncodedImage(entry.stream.asUint8Array(), "image/jp2");
  }

  if (filterNames.length === 0 || filterNames.every((name) => RAW_PIXEL_FILTERS.has(name))) {
    return decodeRawPixelImage(pdfDoc, entry.stream);
  }

  return null;
}

async function optimizeImageEntry(
  pdfDoc: PDFDocument,
  entry: ImageStreamEntry,
  mode: CompressionMode,
  workCanvas: HTMLCanvasElement | OffscreenCanvas,
): Promise<boolean> {
  if (mode === "light") return false;

  try {
    const sourceCanvas = await decodeImageEntry(pdfDoc, entry);
    if (!sourceCanvas) return false;

    const modeConfig = getModeConfig(mode);

    const originalBytesLength = entry.stream.asUint8Array().length;
    const minGainRatio = mode === "recommended" ? 0.98 : 0.995;

    // Check if image has alpha — if so, use PNG to preserve transparency
    const hasAlpha = entry.stream.dict.lookupMaybe(PDFName.of("SMask"), PDFRef) !== undefined;

    const candidates = buildCompressionCandidates(mode, sourceCanvas.width, sourceCanvas.height, modeConfig);

    let bestBytes: Uint8Array | null = null;
    let bestSize = Number.POSITIVE_INFINITY;
    let bestUsedPng = false;

    for (const candidate of candidates) {
      const targetWidth = Math.max(1, Math.round(sourceCanvas.width * candidate.scale));
      const targetHeight = Math.max(1, Math.round(sourceCanvas.height * candidate.scale));

      workCanvas.width = targetWidth;
      workCanvas.height = targetHeight;

      if (hasAlpha) {
        // Preserve transparency by using PNG
        const context = workCanvas.getContext("2d", { alpha: true });
        if (!context) continue;
        context.clearRect(0, 0, targetWidth, targetHeight);
        context.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

        const blob = await canvasToPngBlob(workCanvas);
        if (!blob) continue;

        const pngBytes = new Uint8Array(await blob.arrayBuffer());
        if (pngBytes.length === 0) continue;

        if (pngBytes.length < bestSize) {
          bestBytes = pngBytes;
          bestSize = pngBytes.length;
          bestUsedPng = true;
        }
      } else {
        const context = workCanvas.getContext("2d", { alpha: false });
        if (!context) continue;

        // Fill with white to avoid transparent regions turning black after JPEG encoding.
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, targetWidth, targetHeight);
        context.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

        const blob = await canvasToBlob(workCanvas, candidate.quality);
        if (!blob) continue;

        const jpgBytes = new Uint8Array(await blob.arrayBuffer());
        if (jpgBytes.length === 0) continue;

        if (jpgBytes.length < bestSize) {
          bestBytes = jpgBytes;
          bestSize = jpgBytes.length;
          bestUsedPng = false;
        }
      }
    }

    if (!bestBytes) return false;
    if (bestSize >= originalBytesLength * minGainRatio) return false;

    const embeddedImage = bestUsedPng
      ? await pdfDoc.embedPng(bestBytes)
      : await pdfDoc.embedJpg(bestBytes);
    await embeddedImage.embed();

    const maybeReplacement = pdfDoc.context.lookupMaybe(embeddedImage.ref, PDFStream);
    if (!(maybeReplacement instanceof PDFRawStream)) return false;
    const replacementStream = maybeReplacement;

    pdfDoc.context.assign(entry.ref, replacementStream);
    pdfDoc.context.delete(embeddedImage.ref);

    return true;
  } catch {
    // If any individual image fails, skip it and continue with the rest.
    return false;
  }
}

// ─── Preview Rendering ──────────────────────────────────────────────

export async function renderPdfFirstPagePreview(pdfBlob: Blob): Promise<Blob> {
  const pdfjs = await loadPdfJs();
  const bytes = new Uint8Array(await pdfBlob.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data: toArrayBuffer(bytes) });
  const sourceDocument = await loadingTask.promise;

  try {
    const page = await sourceDocument.getPage(1);
    const sourceViewport = page.getViewport({ scale: 1 });
    const maxPreviewWidth = 860;
    const maxPreviewHeight = 1180;
    const fitScale = Math.min(
      maxPreviewWidth / Math.max(1, sourceViewport.width),
      maxPreviewHeight / Math.max(1, sourceViewport.height),
      1.5,
    );
    const viewport = page.getViewport({ scale: Math.max(0.2, fitScale) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Canvas context unavailable for PDF preview.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({
      canvas,
      canvasContext: context,
      viewport,
      background: "rgb(255,255,255)",
    });
    await renderTask.promise;
    page.cleanup();

    const previewBlob = await canvasToPngBlob(canvas);
    if (!previewBlob) {
      throw new Error("Unable to render PDF preview.");
    }

    return previewBlob;
  } finally {
    await sourceDocument.destroy();
  }
}

// ─── Compression Pipelines ──────────────────────────────────────────

export async function compressWithObjectStrategy(
  inputBytes: Uint8Array,
  mode: CompressionMode,
  workCanvas: HTMLCanvasElement,
  updateProgress: (progress: CompressionProgress) => void,
): Promise<ObjectCompressionResult> {
  const pdfDoc = await PDFDocument.load(inputBytes);
  stripMetadata(pdfDoc);

  const imageEntries = collectImageStreams(pdfDoc);
  let imageOptimized = 0;

  if (mode !== "light") {
    if (imageEntries.length > 0) {
      for (let index = 0; index < imageEntries.length; index += 1) {
        const optimized = await optimizeImageEntry(pdfDoc, imageEntries[index], mode, workCanvas);
        if (optimized) imageOptimized += 1;

        const current = index + 1;
        updateProgress({
          current,
          total: imageEntries.length,
          label: `Processing embedded images... ${current}/${imageEntries.length}`,
        });
        await waitForPaint();
      }
    } else {
      updateProgress({
        current: 0,
        total: 0,
        label: "No embedded images found. Running structural optimization...",
      });
      await waitForPaint();
    }
  } else {
    updateProgress({ current: 0, total: 0, label: "Light mode. Running structural optimization..." });
    await waitForPaint();
  }

  updateProgress({ current: 0, total: 0, label: "Removing duplicate objects..." });
  let duplicateObjectsRemoved = 0;
  try {
    duplicateObjectsRemoved = await dedupeDuplicateImageObjects(pdfDoc);
  } catch {
    duplicateObjectsRemoved = 0;
  }
  await waitForPaint();

  updateProgress({ current: 0, total: 0, label: "Pruning unused objects..." });
  let unusedObjectsRemoved = 0;
  try {
    unusedObjectsRemoved = pruneUnusedObjects(pdfDoc);
  } catch {
    unusedObjectsRemoved = 0;
  }
  await waitForPaint();

  updateProgress({ current: 0, total: 0, label: "Saving object-optimized PDF..." });
  const optimizedBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });

  return {
    blob: new Blob([toArrayBuffer(optimizedBytes)], { type: "application/pdf" }),
    imageTotal: imageEntries.length,
    imageOptimized,
    duplicateObjectsRemoved,
    unusedObjectsRemoved,
  };
}

export async function compressWithRasterStrategy(
  inputBytes: Uint8Array,
  mode: CompressionMode,
  workCanvas: HTMLCanvasElement,
  updateProgress: (progress: CompressionProgress) => void,
): Promise<Blob> {
  const pdfjs = await loadPdfJs();

  updateProgress({ current: 0, total: 0, label: "Starting advanced page-raster compression..." });
  await waitForPaint();

  const loadingTask = pdfjs.getDocument({ data: toArrayBuffer(inputBytes) });
  const sourceDocument = await loadingTask.promise;

  try {
    const outputDoc = await PDFDocument.create();
    const pageCount = sourceDocument.numPages;
    const renderScaleBase = getRasterDpi(mode, pageCount, inputBytes.length) / 72;
    const jpegQuality = getRasterQuality(mode);
    const maxRenderArea = mode === "recommended" ? 8_000_000 : 5_500_000;

    for (let pageIndex = 1; pageIndex <= pageCount; pageIndex += 1) {
      const page = await sourceDocument.getPage(pageIndex);

      const sourceViewport = page.getViewport({ scale: 1 });
      const trialViewport = page.getViewport({ scale: renderScaleBase });
      const fitted = fitDimensionsToArea(trialViewport.width, trialViewport.height, maxRenderArea);
      const renderScale = Math.max(0.2, fitted.width / Math.max(1, sourceViewport.width));
      const renderViewport = page.getViewport({ scale: renderScale });

      workCanvas.width = Math.max(1, Math.floor(renderViewport.width));
      workCanvas.height = Math.max(1, Math.floor(renderViewport.height));

      const context = workCanvas.getContext("2d", { alpha: false });
      if (!context) {
        throw new Error("Canvas context unavailable for raster compression.");
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, workCanvas.width, workCanvas.height);

      const renderTask = page.render({
        canvas: workCanvas,
        canvasContext: context,
        viewport: renderViewport,
        background: "rgb(255,255,255)",
      });
      await renderTask.promise;

      const jpgBlob = await canvasToBlob(workCanvas, jpegQuality);
      if (!jpgBlob) {
        throw new Error("Failed to encode rendered page as JPEG.");
      }

      const jpgBytes = new Uint8Array(await jpgBlob.arrayBuffer());
      const image = await outputDoc.embedJpg(jpgBytes);

      const outputPage = outputDoc.addPage([sourceViewport.width, sourceViewport.height]);
      outputPage.drawImage(image, {
        x: 0,
        y: 0,
        width: sourceViewport.width,
        height: sourceViewport.height,
      });

      page.cleanup();

      updateProgress({
        current: pageIndex,
        total: pageCount,
        label: `Advanced raster compression... ${pageIndex}/${pageCount}`,
      });
      await waitForPaint();
    }

    stripMetadata(outputDoc);

    const outputBytes = await outputDoc.save({ useObjectStreams: true, addDefaultPage: false });
    return new Blob([toArrayBuffer(outputBytes)], { type: "application/pdf" });
  } finally {
    await sourceDocument.destroy();
  }
}

export function buildFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.trim()) {
      const lower = error.message.toLowerCase();
      if (lower.includes("target size") || lower.includes("target-size") || lower.includes("not achievable")) {
        return error.message;
      }
    }

    const message = error.message.toLowerCase();
    if (message.includes("encrypted") || message.includes("password")) {
      return "This PDF is password-protected. Please unlock it first, then try compression again.";
    }
    if (message.includes("invalid") || message.includes("corrupt")) {
      return "This PDF appears unsupported or corrupted. Please try another file.";
    }
  }

  return "Compression failed in the browser for this document. Try Light mode or use a smaller PDF.";
}
