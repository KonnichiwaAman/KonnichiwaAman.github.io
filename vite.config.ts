import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

function resolveManualChunk(id: string): string | undefined {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  if (id.includes("react") || id.includes("react-router-dom") || id.includes("zustand")) {
    return "vendor-core";
  }

  if (id.includes("pdf-lib")) {
    return "vendor-pdf-lib";
  }

  if (id.includes("pdfjs-dist")) {
    return "vendor-pdfjs";
  }

  if (id.includes("@pdfsmaller/pdf-encrypt-lite")) {
    return "vendor-pdf-encrypt";
  }

  if (id.includes("@ffmpeg/ffmpeg") || id.includes("@ffmpeg/util")) {
    return "vendor-media";
  }

  if (id.includes("tesseract.js")) {
    return "vendor-ocr";
  }

  if (id.includes("@imgly/background-removal")) {
    return "vendor-bgremoval";
  }

  if (id.includes("docx")) {
    return "vendor-docx";
  }

  if (id.includes("mammoth")) {
    return "vendor-mammoth";
  }

  if (id.includes("heic2any")) {
    return "vendor-heic";
  }

  if (id.includes("jszip")) {
    return "vendor-zip";
  }

  if (id.includes("qrcode")) {
    return "vendor-qrcode";
  }

  return undefined;
}

// https://vite.dev/config/
export default defineConfig(() => {
  const shouldAnalyze = process.env.ANALYZE === "true";
  const shouldGenerateSourceMap = shouldAnalyze || process.env.SOURCE_MAP === "true";

  const plugins: PluginOption[] = [
    react(),
    tailwindcss(),
  ];

  if (shouldAnalyze) {
    plugins.push(
      visualizer({
        filename: "dist/bundle-analysis.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
    );
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    build: {
      target: "es2020",
      sourcemap: shouldGenerateSourceMap,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: resolveManualChunk,
        },
      },
    },
  };
});
