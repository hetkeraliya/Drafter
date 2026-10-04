import type { ReactNode } from "react";

type P = { size?: number };

function Svg({ size, children, fill = "none", sw = 1.8 }: { size: number; children: ReactNode; fill?: string; sw?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={fill === "none" ? "currentColor" : "none"}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const ChevronLeft = ({ size = 22 }: P) => (
  <Svg size={size} sw={2.4}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);

export const ChevronRight = ({ size = 16 }: P) => (
  <Svg size={size} sw={2.4}>
    <path d="M9 5l7 7-7 7" />
  </Svg>
);

export const BackIcon = ChevronLeft;

export const PlusIcon = ({ size = 22 }: P) => (
  <Svg size={size} sw={2}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const ComposeIcon = ({ size = 24 }: P) => (
  <Svg size={size} sw={1.7}>
    <path d="M12 4H7.5A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5V12" />
    <path d="M18.4 3.6a1.9 1.9 0 0 1 2.7 2.7l-8.3 8.3-3.6.9.9-3.6 8.3-8.3z" />
  </Svg>
);

export const MicIcon = ({ size = 22 }: P) => (
  <Svg size={size} sw={1.7}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M6 11a6 6 0 0 0 12 0M12 17v3.5M9 20.5h6" />
  </Svg>
);

export const SearchIcon = ({ size = 16 }: P) => (
  <Svg size={size} sw={2.2}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Svg>
);

export const XCircleIcon = ({ size = 16 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="var(--bg)" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const EllipsisIcon = ({ size = 28 }: P) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
    <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="9.2" cy="14" r="1.35" fill="currentColor" />
    <circle cx="14" cy="14" r="1.35" fill="currentColor" />
    <circle cx="18.8" cy="14" r="1.35" fill="currentColor" />
  </svg>
);

export const PinIcon = ({ size = 20 }: P) => (
  <Svg size={size} sw={1.8}>
    <path d="M9 4h6l-1 6 3 3H7l3-3-1-6zM12 13v7" />
  </Svg>
);

export const PinFilledIcon = ({ size = 12 }: P) => (
  <Svg size={size} fill="currentColor">
    <path d="M9 3h6l-.8 6.2 3.3 3.3a.8.8 0 0 1-.6 1.4H12.8V21h-1.6v-7.1H7.1a.8.8 0 0 1-.6-1.4l3.3-3.3L9 3z" />
  </Svg>
);

export const TrashIcon = ({ size = 20 }: P) => (
  <Svg size={size} sw={1.7}>
    <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 12.2a1.5 1.5 0 0 0 1.5 1.3h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7M10 11v6M14 11v6" />
  </Svg>
);

export const CheckIcon = ({ size = 14 }: P) => (
  <Svg size={size} sw={3.2}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);

export const XIcon = ({ size = 18 }: P) => (
  <Svg size={size} sw={2.2}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const ShareIcon = ({ size = 22 }: P) => (
  <Svg size={size} sw={1.8}>
    <path d="M12 15V3.5M8 7l4-4 4 4" />
    <path d="M7 10.5H6.5A2.5 2.5 0 0 0 4 13v5.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V13a2.5 2.5 0 0 0-2.5-2.5H17" />
  </Svg>
);

export const SparkleIcon = ({ size = 22 }: P) => (
  <Svg size={size} sw={1.7}>
    <path d="M11 4l1.7 4.6L17.5 10l-4.8 1.4L11 16l-1.7-4.6L4.5 10l4.8-1.4L11 4z" />
    <path d="M18 15l.8 2.2 2.2.8-2.2.8L18 21l-.8-2.2-2.2-.8 2.2-.8L18 15z" />
  </Svg>
);

export const ListIcon = ({ size = 20 }: P) => (
  <Svg size={size} sw={1.8}>
    <path d="M9.5 6.5H20M9.5 12H20M9.5 17.5H20" />
    <path d="M4 6.5l1 1 2-2M4 12l1 1 2-2M4 17.5l1 1 2-2" />
  </Svg>
);

export const PhotoIcon = ({ size = 20 }: P) => (
  <Svg size={size} sw={1.7}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
    <path d="M3.5 16.5l5-4 4 3 3-2.2 5 3.7" />
  </Svg>
);

export const WaveIcon = ({ size = 20 }: P) => (
  <Svg size={size} sw={2}>
    <path d="M5 10v4M9 7v10M13 4v16M17 8v8M21 11v2" />
  </Svg>
);

export const DocsIcon = ({ size = 20 }: P) => (
  <Svg size={size} sw={1.7}>
    <path d="M7 3.5h7l4 4V20.5H7z" />
    <path d="M14 3.5V8h4.5" />
    <path d="M9.5 12.5h5M9.5 16h5" />
  </Svg>
);

export const PenIcon = ({ size = 20 }: P) => (
  <Svg size={size} sw={1.7}>
    <path d="M4 20l4.2-1.1L19 8.1 15.9 5 5.1 15.8 4 20z" />
  </Svg>
);

export const CameraIcon = ({ size = 20 }: P) => (
  <Svg size={size} sw={1.7}>
    <path d="M4 8h3l1.4-2h7.2L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13" r="3.2" />
  </Svg>
);

export const GalleryIcon = PhotoIcon;

export const BellIcon = ({ size = 20 }: P) => (
  <Svg size={size} sw={1.7}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5l1.5-2zM10 21h4" />
  </Svg>
);

export const TagIcon = ({ size = 20 }: P) => (
  <Svg size={size} sw={1.7}>
    <path d="M3.5 12.2V4.5h7.7l9.3 9.3a1.5 1.5 0 0 1 0 2.1l-5.6 5.6a1.5 1.5 0 0 1-2.1 0L3.5 12.2z" />
    <circle cx="8" cy="9" r="1.2" fill="currentColor" stroke="none" />
  </Svg>
);

export const DownloadIcon = ({ size = 20 }: P) => (
  <Svg size={size} sw={1.8}>
    <path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 20h14" />
  </Svg>
);

export const PlayIcon = ({ size = 14 }: P) => (
  <Svg size={size} fill="currentColor">
    <path d="M8 5.5v13l11-6.5L8 5.5z" />
  </Svg>
);

export const InfoIcon = ({ size = 20 }: P) => (
  <Svg size={size} sw={1.7}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.8v.2" />
  </Svg>
);

export const DownloadAppIcon = ({ size = 20 }: P) => (
  <Svg size={size} sw={1.7}>
    <rect x="6" y="2.5" width="12" height="19" rx="3" />
    <path d="M12 8v6M9.5 11.8L12 14.3l2.5-2.5" />
  </Svg>
);

export const DotsIcon = EllipsisIcon;
export const PaperclipIcon = DocsIcon;

export function GoogleMark({ size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.2 2.8-2.5 3.6v3h4c2.4-2.2 3.5-5.4 3.5-8.7z" />
      <path fill="currentColor" d="M12 24c3.2 0 5.9-1 7.9-2.8l-4-3c-1.1.8-2.5 1.2-3.9 1.2-3 0-5.6-2-6.5-4.8H1.4v3.1C3.4 21.4 7.4 24 12 24z" />
      <path fill="currentColor" d="M5.5 14.6A7.2 7.2 0 0 1 5.1 12c0-.9.2-1.8.4-2.6V6.3H1.4A12 12 0 0 0 0 12c0 1.9.5 3.7 1.4 5.3l4.1-2.7z" />
      <path fill="currentColor" d="M12 4.8c1.7 0 3.3.6 4.5 1.7l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.3l4.1 3.1C6.4 6.7 9 4.8 12 4.8z" />
    </svg>
  );
}

export const SpinIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z" />
  </svg>
);

export const ChevronDown = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const ViewIcon = ({ size = 20, grid = false }: { size?: number; grid?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
    {grid ? (
      <>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
      </>
    ) : (
      <>
        <rect x="3.5" y="5" width="9" height="7.5" rx="1.8" transform="rotate(-6 8 8.7)" />
        <rect x="11.5" y="11.5" width="9" height="7.5" rx="1.8" transform="rotate(5 16 15.2)" />
      </>
    )}
  </svg>
);
