export interface BlogSection {
  heading: string;
  paragraphs: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  tags: string[];
  isPublished: boolean;
  author: string;
  sections: BlogSection[];
}

const DEFAULT_BLOG_AUTHOR = "ObsidianKit Editorial Team";

export const blogPosts: BlogPost[] = [
  {
    slug: "compress-pdf-online-without-uploading",
    title: "How to Compress a PDF Online Without Uploading It",
    description:
      "Learn how browser-based PDF compression works, when to use light or strong compression, and how to keep sensitive documents private.",
    publishedAt: "2026-04-27",
    readingMinutes: 7,
    tags: ["PDF Compressor", "Privacy", "Local Processing", "File Optimization"],
    isPublished: true,
    author: DEFAULT_BLOG_AUTHOR,
    sections: [
      {
        heading: "Why no-upload compression matters",
        paragraphs: [
          "Many PDFs contain invoices, contracts, tax forms, school records, or internal reports. Uploading those files to a random cloud compressor can create unnecessary privacy and compliance risk.",
          "A browser-based PDF compressor keeps the workflow local. The document is opened in memory, optimized in the tab, and exported as a new file without sending the source PDF to a server.",
        ],
      },
      {
        heading: "Choose the right compression mode",
        paragraphs: [
          "Use light compression when the PDF is already clean and you mainly want metadata cleanup or duplicate object removal. It is best for forms, simple documents, and files where quality is more important than aggressive size reduction.",
          "Use recommended compression for everyday sharing. It balances document quality and file size by cleaning structure and optimizing image-heavy pages where possible.",
          "Use strong compression when email limits, upload portals, or storage constraints matter more than perfect image fidelity.",
        ],
      },
      {
        heading: "Check the result before replacing the original",
        paragraphs: [
          "Always compare the original and compressed file size, then open the output PDF before deleting the source. This is especially important for scanned PDFs because their pages are usually large image layers.",
          "For critical files, keep the original and send the compressed copy. That gives you the smaller upload while preserving a full-quality archive.",
        ],
      },
    ],
  },
  {
    slug: "png-jpg-webp-heic-image-format-guide",
    title: "PNG, JPG, WebP, and HEIC: Which Image Format Should You Use?",
    description:
      "A practical guide to choosing the right image format for screenshots, photos, transparent graphics, web pages, and phone exports.",
    publishedAt: "2026-04-24",
    updatedAt: "2026-04-27",
    readingMinutes: 8,
    tags: ["Image Converter", "PNG", "JPG", "WebP", "HEIC"],
    isPublished: true,
    author: DEFAULT_BLOG_AUTHOR,
    sections: [
      {
        heading: "Use PNG for sharp graphics and transparency",
        paragraphs: [
          "PNG is a strong default for screenshots, UI captures, diagrams, icons, and anything that needs transparent pixels. It preserves crisp edges and avoids the compression artifacts that can make text look fuzzy.",
          "The tradeoff is file size. A large PNG screenshot can be much heavier than a JPG or WebP version, especially when the image contains photo-like details.",
        ],
      },
      {
        heading: "Use JPG for photos and broad compatibility",
        paragraphs: [
          "JPG is still one of the most compatible formats for photos, email attachments, forms, and websites. It compresses photographic detail well, but it does not support transparency.",
          "Avoid repeated JPG exports when possible. Every lossy re-export can reduce quality, so keep an original copy and create new derivatives from that source.",
        ],
      },
      {
        heading: "Use WebP for modern web delivery",
        paragraphs: [
          "WebP often gives smaller file sizes than PNG or JPG while keeping good visual quality. It is useful for web pages, content previews, and image-heavy pages where performance matters.",
          "If a receiving system does not accept WebP, convert it to JPG for photos or PNG for transparent graphics.",
        ],
      },
      {
        heading: "Convert HEIC when sharing outside Apple devices",
        paragraphs: [
          "HEIC is common on iPhones and can be efficient, but many forms, school portals, and older workflows still expect JPG.",
          "When compatibility matters, convert HEIC photos to JPG before sending them. Keep the original HEIC if you want the smallest archive copy.",
        ],
      },
    ],
  },
  {
    slug: "private-browser-tools-vs-cloud-upload-tools",
    title: "Private Browser Tools vs Cloud Upload Tools",
    description:
      "Compare local browser utilities and cloud tools for privacy, speed, file limits, reliability, and everyday productivity workflows.",
    publishedAt: "2026-04-22",
    readingMinutes: 6,
    tags: ["Privacy", "Browser Tools", "Security", "Productivity"],
    isPublished: true,
    author: DEFAULT_BLOG_AUTHOR,
    sections: [
      {
        heading: "The biggest difference is where the file goes",
        paragraphs: [
          "Cloud tools upload your file to a remote server for processing. That can be useful for extremely heavy workloads, but it also means your source data leaves your device.",
          "Private browser tools process the file locally. The page may load code from the website, but the selected file itself stays inside your browser session.",
        ],
      },
      {
        heading: "Local tools are often faster for everyday files",
        paragraphs: [
          "For common PDF, image, text, and calculator tasks, local processing removes the upload and download wait. You choose the file, adjust settings, and export the result directly.",
          "Large video and audio jobs can still be demanding because the browser uses your device resources. In those cases, close heavy tabs and keep the input file reasonable for the hardware you are using.",
        ],
      },
      {
        heading: "Use cloud processing when collaboration is the product",
        paragraphs: [
          "Cloud platforms are useful when teams need shared projects, version history, approvals, or server-side automation.",
          "For quick one-off tasks involving private documents, local browser utilities are usually simpler, faster, and easier to trust.",
        ],
      },
    ],
  },
  {
    slug: "mobile-friendly-online-tools-gesture-checklist",
    title: "Mobile-Friendly Online Tools: A Gesture and UX Checklist",
    description:
      "Design better mobile utility tools with touch-safe controls, visible loading states, reachable actions, and gesture-friendly work areas.",
    publishedAt: "2026-04-19",
    readingMinutes: 7,
    tags: ["Mobile UX", "Gestures", "Accessibility", "Performance"],
    isPublished: true,
    author: DEFAULT_BLOG_AUTHOR,
    sections: [
      {
        heading: "Give every gesture enough room",
        paragraphs: [
          "Touch users need larger handles than mouse users. Croppers, sliders, reorder controls, and draggable work areas should have forgiving hit targets so users do not fight the interface.",
          "When a tool depends on dragging, use pointer events where possible. They support mouse, pen, and touch with one interaction model.",
        ],
      },
      {
        heading: "Protect the work area from accidental scrolling",
        paragraphs: [
          "If a user is cropping an image or drawing a mask, the canvas should not scroll the page mid-gesture. Applying touch-safe behavior to the active work area keeps the interaction predictable.",
          "The rest of the page should still scroll normally, so keep gesture locking scoped to the tool surface that needs it.",
        ],
      },
      {
        heading: "Show progress before users wonder if it broke",
        paragraphs: [
          "Mobile devices can take longer to process large PDFs, images, and videos. Clear loading labels, disabled buttons, and progress states reduce repeat taps and accidental duplicate work.",
          "A good tool should feel calm under pressure: it explains what is happening and keeps the next action obvious.",
        ],
      },
    ],
  },
  {
    slug: "pdf-workflow-merge-split-compress-protect",
    title: "A Simple PDF Workflow: Merge, Split, Compress, and Protect",
    description:
      "Use a clean PDF workflow to combine files, remove unwanted pages, reduce size, and add password protection before sharing.",
    publishedAt: "2026-04-16",
    readingMinutes: 6,
    tags: ["PDF Tools", "Merge PDF", "Split PDF", "Protect PDF"],
    isPublished: true,
    author: DEFAULT_BLOG_AUTHOR,
    sections: [
      {
        heading: "Start by organizing the source files",
        paragraphs: [
          "Before editing a PDF, rename the source files clearly and keep a copy of the originals. This makes it easier to recover if you choose the wrong page order or export setting.",
          "If you have many related files, merge them first so you can review the full packet as one document.",
        ],
      },
      {
        heading: "Split or reorder before compressing",
        paragraphs: [
          "Remove pages you do not need before compression. Smaller source documents process faster and often produce cleaner output because the tool has fewer objects to optimize.",
          "If page order matters, reorder the PDF before adding protection. That keeps the final shared version stable.",
        ],
      },
      {
        heading: "Compress and protect the final copy",
        paragraphs: [
          "After the content is correct, compress the PDF for email, upload portals, or storage. Then add password protection only to the final copy you intend to share.",
          "Keep an unprotected archive copy in a secure location if you may need to edit the document again.",
        ],
      },
    ],
  },
  {
    slug: "client-side-tools-seo-playbook-2026",
    title: "Client-Side Tools SEO Playbook (2026)",
    description:
      "A practical playbook for ranking client-side utility sites: metadata systems, sitemap automation, Core Web Vitals, and monetization-safe UX.",
    publishedAt: "2026-04-10",
    updatedAt: "2026-04-12",
    readingMinutes: 8,
    tags: ["SEO", "Core Web Vitals", "Monetization", "Client-Side"],
    isPublished: true,
    author: DEFAULT_BLOG_AUTHOR,
    sections: [
      {
        heading: "1. Build SEO as a system, not a checklist",
        paragraphs: [
          "Tool-heavy websites scale fast, so static meta tags break quickly. Build a reusable SEO layer that generates title, description, canonical URL, Open Graph, Twitter Card data, and JSON-LD from route data.",
          "When your metadata is generated from the same source of truth as your routes, every new tool ships with SEO coverage by default.",
        ],
      },
      {
        heading: "2. Core Web Vitals win or lose utility search traffic",
        paragraphs: [
          "Most utility traffic is impatient and mobile-first. Lazy-load expensive routes, keep bundle boundaries clean, and avoid shipping heavyweight UI effects on initial paint.",
          "Small improvements to layout stability and interaction latency can compound into higher rankings and stronger retention.",
        ],
      },
      {
        heading: "3. Monetization should support trust, not fight it",
        paragraphs: [
          "Revenue placement matters. Keep ads non-intrusive, label sponsorship areas clearly, and preserve fast access to the tool UI. For privacy-first products, explain tracking and respect DNT where possible.",
          "A clean, honest monetization layer preserves user trust and helps long-term SEO performance through better engagement signals.",
        ],
      },
    ],
  },
];

const blogPostsBySlug = new Map(blogPosts.map((post) => [post.slug, post]));

export const publishedBlogPosts: BlogPost[] = blogPosts.filter((post) => post.isPublished);

export function getPublishedBlogPostBySlug(slug: string): BlogPost | undefined {
  const post = blogPostsBySlug.get(slug);
  if (!post || !post.isPublished) return undefined;
  return post;
}
