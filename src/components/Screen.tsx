"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useNav } from "@/lib/useNav";
import { ChevronLeft } from "./Icons";

interface Props {
  title?: string;
  large?: boolean;
  back?: { href: string; label?: string };
  leading?: ReactNode;
  trailing?: ReactNode;
  footer?: ReactNode;
  bare?: boolean;
  children: ReactNode;
}

// One iOS-style screen: translucent nav bar that turns solid on scroll, optional large title that
// collapses into the bar, content column, and an optional bottom toolbar.
export function Screen({ title = "", large = false, back, leading, trailing, footer, bare = false, children }: Props) {
  const nav = useNav();
  const [scrolled, setScrolled] = useState(false);
  const [titleIn, setTitleIn] = useState(false);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 2);
      setTitleIn(y > (large ? 40 : 2));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [large]);

  return (
    <>
      {!bare && (
        <header className="nav" data-solid={scrolled}>
          <div className="nav-inner">
            <div className="nav-side">
              {leading ??
                (back && (
                  <button type="button" data-drop="parent" className="nav-btn back-btn -ml-1 pl-0" onClick={() => nav.back(back.href)} aria-label={`Back to ${back.label ?? "previous"}`}>
                    <ChevronLeft />
                    <span>{back.label ?? "Back"}</span>
                  </button>
                ))}
            </div>
            <div className="nav-title" data-show={large ? titleIn : true}>
              {title}
            </div>
            <div className="nav-side end">{trailing}</div>
          </div>
        </header>
      )}
      <div className={`screen ${bare ? "bare" : ""}`}>
        {large && <h1 className="large-title">{title}</h1>}
        {children}
      </div>
      {footer}
    </>
  );
}
