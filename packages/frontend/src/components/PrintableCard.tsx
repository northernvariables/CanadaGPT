/**
 * PrintableCard Component
 *
 * Wrapper component that makes its children print-friendly by hiding
 * the rest of the page content when printing. Use this to wrap card
 * content that should be printable via the ShareButton.
 */

'use client';

import { ReactNode } from 'react';

export interface PrintableCardProps {
  children: ReactNode;
  className?: string;
}

export function PrintableCard({ children, className }: PrintableCardProps) {
  return (
    <div className={className}>
      {/* Print styles - hides everything else on the page when printing */}
      <style jsx global>{`
        @media print {
          /* Hide everything by default */
          body * {
            visibility: hidden;
          }

          /* Show only the printable card and its children */
          .printable-card,
          .printable-card * {
            visibility: visible;
          }

          /* Position the printable card at the top left */
          .printable-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          /* Remove shadows, borders, and unnecessary decorations for print */
          .printable-card {
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          /* Ensure proper spacing and margins for printed content */
          .printable-card {
            margin: 0;
            padding: 1rem;
          }

          /* Hide interactive elements (buttons, links) in print */
          .printable-card button,
          .printable-card [role="button"] {
            display: none !important;
          }
        }
      `}</style>

      <div className="printable-card">
        {children}
      </div>
    </div>
  );
}
