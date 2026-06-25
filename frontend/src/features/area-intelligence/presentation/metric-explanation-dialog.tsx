"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export type MetricExplanation = {
  title: string;
  description: string;
  facts: Array<{
    label: string;
    value: string;
  }>;
};

type MetricExplanationDialogProps = {
  explanation: MetricExplanation | null;
  onClose: () => void;
};

export function MetricExplanationDialog({
  explanation,
  onClose,
}: MetricExplanationDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!explanation) {
      return;
    }

    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [explanation, onClose]);

  return (
    <AnimatePresence>
      {explanation ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/35 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.18 }}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="metric-dialog-title"
            aria-describedby="metric-dialog-description"
            className="w-full max-w-xl border border-border-strong bg-surface-raised p-6 shadow-2xl"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-dark">
                  Metric Explanation
                </p>
                <h2
                  id="metric-dialog-title"
                  className="mt-3 font-serif text-3xl text-foreground"
                >
                  {explanation.title}
                </h2>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close metric explanation"
                className="inline-flex size-10 items-center justify-center border border-border-strong text-foreground-muted transition-colors hover:border-primary hover:text-primary"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <p
              id="metric-dialog-description"
              className="mt-5 text-sm leading-6 text-foreground-muted"
            >
              {explanation.description}
            </p>

            {explanation.facts.length > 0 ? (
              <dl className="mt-6 grid gap-3 border-y border-border py-4">
                {explanation.facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="grid gap-2 sm:grid-cols-[1fr_auto]"
                  >
                    <dt className="text-sm text-foreground-muted">
                      {fact.label}
                    </dt>
                    <dd className="font-mono text-sm text-foreground">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <Link
              href="/methodology"
              className="mt-5 inline-flex border-b border-primary pb-1 font-mono text-xs uppercase tracking-[0.14em] text-primary transition-colors hover:text-foreground"
            >
              Read full methodology →
            </Link>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
