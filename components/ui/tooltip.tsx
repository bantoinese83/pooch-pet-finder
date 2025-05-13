"use client"

import React, { useState, useRef } from "react"

export function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [visible, setVisible] = useState(false)
  const timeout = useRef<NodeJS.Timeout | null>(null)

  function show() {
    timeout.current = setTimeout(() => setVisible(true), 100)
  }
  function hide() {
    if (timeout.current) clearTimeout(timeout.current)
    setVisible(false)
  }

  return (
    <span className="relative inline-block" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} tabIndex={0}>
      {children}
      {visible && (
        <span className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 px-3 py-1 rounded bg-gray-900 text-white text-xs shadow-lg whitespace-nowrap pointer-events-none animate-fade-in">
          {content}
        </span>
      )}
    </span>
  )
}
