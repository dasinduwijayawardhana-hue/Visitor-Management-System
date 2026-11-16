import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-paper dark:bg-ink text-center px-4">
      <p className="id-number text-sm text-brass">ERROR · 404</p>
      <h1 className="font-display text-3xl font-semibold text-ink dark:text-paper">Page not found</h1>
      <p className="text-sm text-ink/55 dark:text-paper/55 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist, or you don&apos;t have a badge that grants access to it.
      </p>
      <Link to="/" className="btn-primary mt-3">
        Back to safety
      </Link>
    </div>
  )
}
