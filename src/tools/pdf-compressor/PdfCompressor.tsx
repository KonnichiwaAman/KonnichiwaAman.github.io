import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Download,
  FileText,
  Info,
  Loader2,
  Minimize,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { toArrayBuffer, waitForPaint } from "@/tools/shared/utils";
import {
  type CompressionMode,
  type CompressionApproach,
  type SizeUnit,
  type CompressionResult,
  type CompressionProgress,
  MODE_CONFIGS,
  MAX_LARGE_FILE_WARNING_MB,
  MAX_FILE_SIZE_MB,
  formatBytes,
  formatDuration,
  toBytes,
  savedPercent,
  getModeConfig,
  compressWithObjectStrategy,
  compressWithRasterStrategy,
  renderPdfFirstPagePreview,
  buildFriendlyError,
} from "./compressionEngine";

type PreviewStatus = "idle" | "loading" | "ready" | "error";

interface ObjectCompressionResult {
  blob: Blob;
  imageTotal: number;
  imageOptimized: number;
  duplicateObjectsRemoved: number;
  unusedObjectsRemoved: number;
}

function stripMetadataOnly(pdfDoc: PDFDocument): void {
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

export default function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<CompressionMode>("recommended");
  const [approach, setApproach] = useState<CompressionApproach>("quality-first");
  const [targetSizeValue, setTargetSizeValue] = useState("8");
  const [targetSizeUnit, setTargetSizeUnit] = useState<SizeUnit>("MB");
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [dropActive, setDropActive] = useState(false);
  const [progress, setProgress] = useState<CompressionProgress>({
    current: 0,
    total: 0,
    label: "",
  });
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const workCanvasRef = useRef<HTMLCanvasElement>(null);

  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [compressedPreviewUrl, setCompressedPreviewUrl] = useState<string | null>(null);
  const [originalPreviewStatus, setOriginalPreviewStatus] = useState<PreviewStatus>("idle");
  const [compressedPreviewStatus, setCompressedPreviewStatus] = useState<PreviewStatus>("idle");

  const currentModeConfig = useMemo(() => getModeConfig(mode), [mode]);

  const largeFileWarning = useMemo(() => {
    if (!file) return false;
    return file.size > MAX_LARGE_FILE_WARNING_MB * 1024 * 1024;
  }, [file]);

  const progressPercent = useMemo(() => {
    if (progress.total <= 0) return -1;
    return Math.round((progress.current / progress.total) * 100);
  }, [progress]);

  function parseTargetSizeBytes(): number {
    const parsed = Number.parseFloat(targetSizeValue);
    const normalized = targetSizeUnit === "KB"
      ? Math.min(Math.max(parsed || 2048, 50), 1024 * 1024)
      : Math.min(Math.max(parsed || 8, 0.1), 1024);

    return toBytes(normalized, targetSizeUnit);
  }

  useEffect(() => {
    if (!file) {
      setOriginalPreviewUrl(null);
      setOriginalPreviewStatus("idle");
      return;
    }

    let cancelled = false;
    let nextUrl: string | null = null;

    setOriginalPreviewUrl(null);
    setOriginalPreviewStatus("loading");

    const renderPreview = async () => {
      try {
        const previewBlob = await renderPdfFirstPagePreview(file);
        if (cancelled) return;

        nextUrl = URL.createObjectURL(previewBlob);
        setOriginalPreviewUrl(nextUrl);
        setOriginalPreviewStatus("ready");
      } catch {
        if (cancelled) return;
        setOriginalPreviewStatus("error");
      }
    };

    void renderPreview();

    return () => {
      cancelled = true;
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [file]);

  useEffect(() => {
    if (!compressedBlob) {
      setCompressedPreviewUrl(null);
      setCompressedPreviewStatus("idle");
      return;
    }

    let cancelled = false;
    let nextUrl: string | null = null;

    setCompressedPreviewUrl(null);
    setCompressedPreviewStatus("loading");

    const renderPreview = async () => {
      try {
        const previewBlob = await renderPdfFirstPagePreview(compressedBlob);
        if (cancelled) return;

        nextUrl = URL.createObjectURL(previewBlob);
        setCompressedPreviewUrl(nextUrl);
        setCompressedPreviewStatus("ready");
      } catch {
        if (cancelled) return;
        setCompressedPreviewStatus("error");
      }
    };

    void renderPreview();

    return () => {
      cancelled = true;
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [compressedBlob]);

  function resetAll() {
    setFile(null);
    setErrorMessage(null);
    setResult(null);
    setCompressedBlob(null);
    setProgress({ current: 0, total: 0, label: "" });
    if (inputRef.current) inputRef.current.value = "";
  }

  function applyUploadedFile(candidate: File | null | undefined) {
    if (!candidate) return;

    const isPdf = candidate.type === "application/pdf" || candidate.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setErrorMessage("Please upload a valid PDF file.");
      return;
    }

    if (candidate.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`This file is too large for browser processing. Maximum supported size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    setErrorMessage(null);
    setFile(candidate);
    setResult(null);
    setCompressedBlob(null);
    setProgress({ current: 0, total: 0, label: "" });
  }

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    applyUploadedFile(event.target.files?.[0]);
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDropActive(false);
    applyUploadedFile(event.dataTransfer.files?.[0]);
  }

  function onDrag(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDropActive(true);
    } else {
      setDropActive(false);
    }
  }

  function onModeChange(nextMode: CompressionMode) {
    if (processing) return;
    setMode(nextMode);
    setResult(null);
    setCompressedBlob(null);
    setProgress({ current: 0, total: 0, label: "" });
  }

  async function runCompressionAttempt(
    originalPdfBytes: Uint8Array,
    originalPdfBlob: Blob,
    modeCandidate: CompressionMode,
    workCanvas: HTMLCanvasElement,
  ): Promise<{
    modeUsed: CompressionMode;
    blob: Blob;
    imageTotal: number;
    imageOptimized: number;
    duplicateObjectsRemoved: number;
    unusedObjectsRemoved: number;
    usedOriginalFallback: boolean;
    notes: string[];
  }> {
    let objectResult: ObjectCompressionResult | null = null;
    let objectPipelineError: unknown = null;

    try {
      objectResult = await compressWithObjectStrategy(
        originalPdfBytes,
        modeCandidate,
        workCanvas,
        setProgress,
      );
    } catch (error) {
      objectPipelineError = error;
    }

    let selectedBlob = objectResult?.blob ?? originalPdfBlob;
    let selectedEngine: "object" | "raster" | "structural" | "original" = objectResult ? "object" : "original";
    let usedOriginalFallback = false;

    const notes: string[] = [];
    if (objectResult) {
      notes.push("Applied object-aware optimization on embedded images and PDF structure.");
    }

    if (modeCandidate !== "light") {
      const shouldTryRaster = objectResult
        ? objectResult.blob.size >= originalPdfBlob.size
          || objectResult.imageTotal === 0
          || (objectResult.imageTotal > 0 && objectResult.imageOptimized / objectResult.imageTotal < 0.3)
          || savedPercent(originalPdfBlob.size, objectResult.blob.size) < 15
        : true;

      if (shouldTryRaster) {
        try {
          const rasterBlob = await compressWithRasterStrategy(
            originalPdfBytes,
            modeCandidate,
            workCanvas,
            setProgress,
          );

          if (rasterBlob.size < selectedBlob.size) {
            selectedBlob = rasterBlob;
            selectedEngine = "raster";
            notes.push("Advanced page-raster pipeline produced a smaller result.");
          } else {
            notes.push("Advanced page-raster pipeline was tested but not selected because another result was smaller.");
          }
        } catch {
          notes.push("Advanced page-raster pipeline could not be applied to this PDF. Using fallback result.");
        }
      }
    }

    if (!objectResult) {
      try {
        setProgress({ current: 0, total: 0, label: "Trying structural-only fallback..." });
        await waitForPaint();

        const structuralDoc = await PDFDocument.load(originalPdfBytes);
        stripMetadataOnly(structuralDoc);
        const structuralBytes = await structuralDoc.save({ useObjectStreams: true, addDefaultPage: false });
        const structuralBlob = new Blob([toArrayBuffer(structuralBytes)], { type: "application/pdf" });

        if (structuralBlob.size < selectedBlob.size) {
          selectedBlob = structuralBlob;
          selectedEngine = "structural";
          notes.push("Applied structural-only fallback optimization.");
        }
      } catch {
        // Ignore structural fallback failures.
      }
    }

    if (modeCandidate !== "light" && selectedBlob.size >= originalPdfBlob.size) {
      selectedBlob = originalPdfBlob;
      selectedEngine = "original";
      usedOriginalFallback = true;
      notes.push("Returned original file to avoid size inflation.");
    }

    if (modeCandidate === "light" && selectedBlob.size >= originalPdfBlob.size && selectedEngine !== "original") {
      selectedBlob = originalPdfBlob;
      selectedEngine = "original";
    }

    if (!objectResult && selectedEngine === "original" && objectPipelineError) {
      notes.push("Primary object-aware compression failed for this PDF.");
    }

    return {
      modeUsed: modeCandidate,
      blob: selectedBlob,
      imageTotal: objectResult?.imageTotal ?? 0,
      imageOptimized: objectResult?.imageOptimized ?? 0,
      duplicateObjectsRemoved: objectResult?.duplicateObjectsRemoved ?? 0,
      unusedObjectsRemoved: objectResult?.unusedObjectsRemoved ?? 0,
      usedOriginalFallback,
      notes,
    };
  }

  async function handleCompress() {
    if (!file) return;
    if (processing) return;

    setProcessing(true);
    setErrorMessage(null);
    setResult(null);
    setCompressedBlob(null);

    const startedAt = performance.now();

    try {
      const originalPdfBytes = new Uint8Array(await file.arrayBuffer());
      const originalPdfBlob = new Blob([toArrayBuffer(originalPdfBytes)], { type: "application/pdf" });
      const workCanvas = document.createElement("canvas");

      const profiles = mode === "light"
        ? [{ key: "light", label: "Light quality-preserving profile", mode: "light" as const }]
        : mode === "recommended"
          ? [
              { key: "light", label: "Light quality-preserving profile", mode: "light" as const },
              { key: "recommended", label: "Recommended balanced profile", mode: "recommended" as const },
            ]
          : [{ key: "strong", label: "Strong extreme profile", mode: "strong" as const }];

      const attemptErrors: string[] = [];
      const evaluatedProfiles: string[] = [];
      const completedAttempts: Array<{
        key: string;
        label: string;
        mode: CompressionMode;
        attempt: Awaited<ReturnType<typeof runCompressionAttempt>>;
      }> = [];

      for (const profile of profiles) {
        setProgress({ current: 0, total: 0, label: `Trying ${profile.label}...` });
        await waitForPaint();

        try {
          const attempt = await runCompressionAttempt(
            originalPdfBytes,
            originalPdfBlob,
            profile.mode,
            workCanvas,
          );
          completedAttempts.push({ ...profile, attempt });
          evaluatedProfiles.push(profile.label);
        } catch (error) {
          attemptErrors.push(`${profile.label} failed for this file.`);
          console.warn(`Compression attempt failed in ${profile.label}`, error);
        }
      }

      if (completedAttempts.length === 0) {
        throw new Error("Compression could not produce a valid output for this PDF.");
      }

      let selectedProfile = completedAttempts[0];
      let qualityStrategy = "";

      if (mode === "light") {
        qualityStrategy = "Light mode preserves quality and only performs structural optimization.";
      } else if (mode === "recommended") {
        const lightAttempt = completedAttempts.find((entry) => entry.mode === "light");
        const recommendedAttempt = completedAttempts.find((entry) => entry.mode === "recommended");

        if (lightAttempt && recommendedAttempt) {
          const additionalGain = 1 - recommendedAttempt.attempt.blob.size / lightAttempt.attempt.blob.size;
          if (additionalGain >= 0.07) {
            selectedProfile = recommendedAttempt;
            qualityStrategy = "Recommended mode selected because it delivered meaningful additional size reduction.";
          } else {
            selectedProfile = lightAttempt;
            qualityStrategy = "Recommended mode stayed quality-first and kept the lighter profile because additional savings were minor.";
          }
        } else {
          selectedProfile = recommendedAttempt ?? lightAttempt ?? completedAttempts[0];
          qualityStrategy = "Recommended mode used the best available profile for this document.";
        }
      } else {
        selectedProfile = completedAttempts.reduce((smallest, current) => {
          return current.attempt.blob.size < smallest.attempt.blob.size ? current : smallest;
        }, completedAttempts[0]);

        qualityStrategy = "Strong mode prioritizes minimum file size and can run extra extreme passes when helpful.";

        const strongProfile = completedAttempts.find((entry) => entry.mode === "strong");
        if (strongProfile && !strongProfile.attempt.usedOriginalFallback) {
          let iterativeSeedBlob = strongProfile.attempt.blob;
          let iterativeSeedBytes = new Uint8Array(await iterativeSeedBlob.arrayBuffer());

          for (let pass = 1; pass <= 2; pass += 1) {
            setProgress({ current: 0, total: 0, label: `Running strong iterative pass ${pass}/2...` });
            await waitForPaint();

            try {
              const iterativeAttempt = await runCompressionAttempt(
                iterativeSeedBytes,
                iterativeSeedBlob,
                "strong",
                workCanvas,
              );

              const gainedEnough = iterativeAttempt.blob.size < iterativeSeedBlob.size * 0.985;
              if (!gainedEnough) {
                break;
              }

              iterativeSeedBlob = iterativeAttempt.blob;
              iterativeSeedBytes = new Uint8Array(await iterativeSeedBlob.arrayBuffer());
              evaluatedProfiles.push(`Strong iterative pass ${pass}`);

              if (iterativeAttempt.blob.size < selectedProfile.attempt.blob.size) {
                selectedProfile = {
                  key: `strong-iterative-${pass}`,
                  label: `Strong iterative pass ${pass}`,
                  mode: "strong",
                  attempt: iterativeAttempt,
                };
              }
            } catch (error) {
              attemptErrors.push(`Strong iterative pass ${pass} failed.`);
              console.warn(`Strong iterative pass ${pass} failed`, error);
              break;
            }
          }
        }
      }

      const allCandidates = [...completedAttempts];
      if (!allCandidates.some((entry) => entry.key === selectedProfile.key)) {
        allCandidates.push(selectedProfile);
      }

      let targetSizeBytes: number | undefined;
      let metTargetSize: boolean | undefined;
      let finalBlob = selectedProfile.attempt.blob;

      if (approach === "target-size") {
        const requestedTargetBytes = parseTargetSizeBytes();
        targetSizeBytes = requestedTargetBytes;
        const meetingTarget = allCandidates
          .filter((entry) => entry.attempt.blob.size <= requestedTargetBytes)
          .sort((a, b) => b.attempt.blob.size - a.attempt.blob.size);

        if (meetingTarget.length > 0) {
          selectedProfile = meetingTarget[0];
          qualityStrategy = "Target-size mode selected the highest-quality profile that still met the requested file-size limit.";
        } else {
          selectedProfile = allCandidates.reduce((smallest, current) => {
            return current.attempt.blob.size < smallest.attempt.blob.size ? current : smallest;
          }, allCandidates[0]);
          qualityStrategy = "Target-size mode is applying additional aggressive passes to reach the requested cap.";
        }

        if (selectedProfile.attempt.blob.size > requestedTargetBytes) {
          let tighteningSeedBlob = selectedProfile.attempt.blob;
          let tighteningSeedBytes = new Uint8Array(await tighteningSeedBlob.arrayBuffer());
          const tighteningMode: CompressionMode = mode === "light" ? "recommended" : "strong";

          for (let pass = 1; pass <= 4; pass += 1) {
            setProgress({ current: 0, total: 0, label: `Target-size tightening pass ${pass}/4...` });
            await waitForPaint();

            try {
              const tightenedAttempt = await runCompressionAttempt(
                tighteningSeedBytes,
                tighteningSeedBlob,
                tighteningMode,
                workCanvas,
              );

              evaluatedProfiles.push(`Target-size tightening pass ${pass}`);

              if (tightenedAttempt.blob.size < selectedProfile.attempt.blob.size) {
                selectedProfile = {
                  key: `target-tighten-${pass}`,
                  label: `Target-size tightening pass ${pass}`,
                  mode: tighteningMode,
                  attempt: tightenedAttempt,
                };
              }

              if (tightenedAttempt.blob.size <= requestedTargetBytes) {
                break;
              }

              const improvement = tighteningSeedBlob.size - tightenedAttempt.blob.size;
              tighteningSeedBlob = tightenedAttempt.blob;
              tighteningSeedBytes = new Uint8Array(await tighteningSeedBlob.arrayBuffer());

              if (improvement < Math.max(1024, tighteningSeedBlob.size * 0.005)) {
                break;
              }
            } catch (error) {
              attemptErrors.push(`Target-size tightening pass ${pass} failed.`);
              console.warn(`Target-size tightening pass ${pass} failed`, error);
              break;
            }
          }
        }

        if (selectedProfile.attempt.blob.size <= requestedTargetBytes) {
          finalBlob = selectedProfile.attempt.blob;
          metTargetSize = true;
          qualityStrategy = "Target-size mode kept the PDF under the requested cap without artificial padding.";
        } else {
          throw new Error(
            `Target size of ${formatBytes(requestedTargetBytes)} is not achievable for this PDF in-browser. Try a higher cap.`,
          );
        }
      } else {
        finalBlob = selectedProfile.attempt.blob;
      }

      const notes = [...selectedProfile.attempt.notes];
      notes.unshift(qualityStrategy);

      if (attemptErrors.length > 0) {
        notes.push(attemptErrors.join(" "));
      }

      setCompressedBlob(finalBlob);
      setResult({
        blob: finalBlob,
        mode: selectedProfile.attempt.modeUsed,
        requestedMode: mode,
        approach,
        imageTotal: selectedProfile.attempt.imageTotal,
        imageOptimized: selectedProfile.attempt.imageOptimized,
        duplicateObjectsRemoved: selectedProfile.attempt.duplicateObjectsRemoved,
        unusedObjectsRemoved: selectedProfile.attempt.unusedObjectsRemoved,
        durationMs: performance.now() - startedAt,
        usedOriginalFallback: selectedProfile.attempt.usedOriginalFallback,
        qualityStrategy,
        evaluatedProfiles,
        targetSizeBytes,
        metTargetSize,
        note: notes.length > 0 ? notes.join(" ") : undefined,
      });

      setErrorMessage(null);
      setProgress({ current: 0, total: 0, label: "" });
    } catch (error) {
      setErrorMessage(buildFriendlyError(error));
      setProgress({ current: 0, total: 0, label: "" });
      console.error("PDF compression failed", error);
    } finally {
      setProcessing(false);
    }
  }

  function handleDownload() {
    if (!file || !result) return;

    const url = URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${file.name.replace(/\.[^/.]+$/, "")}_${result.mode}_compressed.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function renderPreviewContent(
    previewUrl: string | null,
    status: PreviewStatus,
    emptyText: string,
  ) {
    if (status === "loading") {
      return (
        <div className="flex h-full min-h-[260px] items-center justify-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Rendering preview...
        </div>
      );
    }

    if (previewUrl) {
      return (
        <div className="flex h-full min-h-[260px] items-center justify-center overflow-auto p-3">
          <img
            src={previewUrl}
            alt="Rendered first page preview"
            className="h-auto max-h-[420px] w-auto max-w-full rounded bg-white shadow-sm"
            draggable={false}
          />
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-[260px] items-center justify-center px-4 text-center text-xs text-[var(--color-text-muted)]">
        {status === "error" ? "Preview unavailable for this PDF, but compression can still run." : emptyText}
      </div>
    );
  }

  const hasResult = Boolean(result);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center mb-8">
        <p className="text-sm text-[var(--color-text-muted)]">
          Compress PDFs in your browser with Light, Recommended, and Strong modes.
        </p>
      </div>

      {!file ? (
        <div className="space-y-4">
          <div
            className={`relative rounded-2xl border-2 border-dashed p-10 sm:p-12 transition-all duration-200 ${
              dropActive
                ? "border-[var(--color-text-primary)] bg-[var(--color-bg-primary)]"
                : "border-[var(--color-border-primary)] bg-[var(--color-bg-card)] hover:border-[var(--color-border-hover)]"
            }`}
            onDragEnter={onDrag}
            onDragOver={onDrag}
            onDragLeave={onDrag}
            onDrop={onDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={onInputChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-input)]">
                <UploadCloud className="h-8 w-8 text-[var(--color-text-muted)]" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  Drag and drop your PDF here
                </p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-hover)]"
                >
                  Choose File
                </button>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Client-side only. No uploads to a server.
                </p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMessage}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <FileText className="h-5 w-5 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{file.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button
                onClick={resetAll}
                className="rounded-full bg-[var(--color-bg-input)] p-2 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                aria-label="Remove selected PDF"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {largeFileWarning && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Large file detected (&gt; 50 MB)</p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Compression remains fully client-side, but processing may be slower depending on image count and device memory.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview section — always visible when file is selected */}
          <div className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">First-page preview</h3>
              <button
                type="button"
                onClick={() => setPreviewOpen((value) => !value)}
                className="rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                {previewOpen ? "Hide preview" : "Show preview"}
              </button>
            </div>

            {previewOpen && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)]">Original</p>
                  <div className="min-h-[260px] overflow-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-input)]">
                    {renderPreviewContent(originalPreviewUrl, originalPreviewStatus, "Preview unavailable")}
                  </div>
                </div>

                <div className="min-w-0 space-y-2">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {processing ? "Compressing..." : "Compressed"}
                  </p>
                  <div className="min-h-[260px] overflow-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-input)]">
                    {processing ? (
                      <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 px-4 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-text-muted)]" />
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {progress.label || "Compressing..."}
                        </p>
                        {progressPercent >= 0 && (
                          <div className="w-full max-w-[200px]">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border-primary)]">
                              <div
                                className="h-full rounded-full bg-[var(--color-text-secondary)] transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{progressPercent}%</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      renderPreviewContent(
                        compressedPreviewUrl,
                        compressedPreviewStatus,
                        "Compress the file to compare first-page output side-by-side.",
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-4 sm:p-6 space-y-5">
            <div className="grid gap-3 sm:grid-cols-3" role="tablist" aria-label="Compression mode selector">
              {MODE_CONFIGS.map((config) => {
                const selected = mode === config.id;
                return (
                  <button
                    key={config.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => onModeChange(config.id)}
                    disabled={processing}
                    className={`rounded-xl border px-4 py-4 text-left transition-all ${
                      selected
                        ? "border-[var(--color-text-primary)] bg-[var(--color-bg-primary)]"
                        : "border-[var(--color-border-primary)] bg-[var(--color-bg-input)] hover:border-[var(--color-border-hover)]"
                    } ${processing ? "opacity-70" : ""}`}
                  >
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">
                      {config.label}
                      <span className="ml-1 text-[var(--color-text-muted)]">{config.subtitle}</span>
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{config.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-medium text-[var(--color-text-secondary)]">Compression strategy</label>
                <select
                  value={approach}
                  onChange={(event) => setApproach(event.target.value as CompressionApproach)}
                  disabled={processing}
                  className="w-full rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-border-hover)]"
                >
                  <option value="quality-first">Quality-first (existing behavior)</option>
                  <option value="target-size">Target-size limit (KB/MB)</option>
                </select>
              </div>

              {approach === "target-size" && (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[var(--color-text-secondary)]">Target size</label>
                    <input
                      type="number"
                      min={targetSizeUnit === "KB" ? 50 : 0.1}
                      step={targetSizeUnit === "KB" ? 50 : 0.1}
                      value={targetSizeValue}
                      onChange={(event) => setTargetSizeValue(event.target.value)}
                      disabled={processing}
                      className="w-full rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-border-hover)]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-[var(--color-text-secondary)]">Unit</label>
                    <select
                      value={targetSizeUnit}
                      onChange={(event) => setTargetSizeUnit(event.target.value as SizeUnit)}
                      disabled={processing}
                      className="w-full rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-border-hover)]"
                    >
                      <option value="MB">MB</option>
                      <option value="KB">KB</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] p-4">
              <p className="text-xs text-[var(--color-text-muted)]">
                Quality-first compression: each mode starts from the highest-fidelity profile and only increases compression when size reduction is meaningful. Extreme mode runs additional iterative passes to reach lower file sizes.
              </p>
            </div>

            {mode === "light" && (
              <div className="inline-flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Quality preserved
              </div>
            )}

            {mode === "strong" && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
                <p className="text-xs font-medium text-[var(--color-text-primary)]">
                  Maximum compression — may slightly reduce image quality on photos.
                </p>
              </div>
            )}

            {!processing && !hasResult && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Structural cleanup (metadata removal, duplicate object cleanup, and unused stream pruning) runs in every mode.
                  </p>
                </div>
              </div>
            )}

            {processing && (
              <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-4 py-3">
                <div className="flex items-center gap-3 text-sm text-[var(--color-text-primary)]" aria-live="polite">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="flex-1">{progress.label || "Preparing PDF..."}</span>
                </div>
                {progressPercent >= 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border-primary)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-text-secondary)] transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {errorMessage}
              </div>
            )}

            {result && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 space-y-3">
                <p className="text-sm font-bold text-[var(--color-text-primary)]">Compression complete</p>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">Original</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{formatBytes(file.size)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">New</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{formatBytes(result.blob.size)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">Saved</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {savedPercent(file.size, result.blob.size).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">Time</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{formatDuration(result.durationMs)}</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Optimized images: {result.imageOptimized}/{result.imageTotal} | Removed duplicate objects: {result.duplicateObjectsRemoved} |
                  Pruned unused objects: {result.unusedObjectsRemoved}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Mode used: {getModeConfig(result.mode).label} | Requested: {getModeConfig(result.requestedMode).label} | Strategy: {result.approach === "target-size" ? "Target-size" : "Quality-first"}
                </p>
                {result.approach === "target-size" && result.targetSizeBytes && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Target: {formatBytes(result.targetSizeBytes)} | {result.metTargetSize ? "Target met" : "Target not fully reached"}
                  </p>
                )}
                <p className="text-xs text-[var(--color-text-muted)]">
                  Strategy: {result.qualityStrategy}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Evaluated profiles: {result.evaluatedProfiles.join(" -> ")}
                </p>
                {result.note && (
                  <p className="break-words text-xs text-[var(--color-text-secondary)]">
                    {result.note}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleCompress}
                disabled={processing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-text-primary)] px-6 py-3.5 text-sm font-bold text-[var(--color-bg-primary)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Minimize className="h-4 w-4" />
                {processing ? "Compressing..." : `Compress PDF (${currentModeConfig.label})`}
              </button>

              <button
                onClick={handleDownload}
                disabled={!hasResult}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-6 py-3.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-hover)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={workCanvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
