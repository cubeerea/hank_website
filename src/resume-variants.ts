/**
 * The résumé portal's single source of truth.
 *
 * `/resume` renders one ledger row per available variant; `/resume/<slug>`
 * is that variant's viewer page. Both read this list, so a variant is added
 * in one place.
 *
 * TO ADD A VARIANT:
 *   1. Drop the PDF in `public/assets/` under the `file` name below.
 *   2. Flip `available` to true.
 *   3. Uncomment that variant's row in `resume.html`.
 *
 * The picker's rows are static markup rather than rendered from this list on
 * purpose: the résumé is the document a recruiter came for, and it should not
 * need JavaScript to be reachable. This list is what the viewer pages and
 * `check:facts` read.
 *
 * Unavailable variants are absent rather than shown as "coming soon" — a
 * portal advertising a document that isn't there reads as an unfinished site,
 * which is the exact failure this rebuild was meant to clear.
 *
 * IMPORTANT: every variant must state the same *facts* — dates, employer
 * names, metrics, outcomes. Variants differ in emphasis and ordering only.
 * `npm run check:facts` compares each PDF against facts.json and the
 * homepage; run it after replacing any résumé.
 */

export interface ResumeVariant {
  /** URL segment: /resume/<slug>. Also the viewer page's filename. */
  slug: string;
  label: string;
  /** Who the variant is aimed at. Not a claim about its contents. */
  blurb: string;
  /** Path under public/. */
  file: string;
  /** Filename the browser saves it as. */
  download: string;
  available: boolean;
}

export const RESUME_VARIANTS: ResumeVariant[] = [
  {
    slug: 'applied-ai',
    label: 'Applied AI',
    blurb: 'For applied AI and ML engineering roles.',
    file: '/assets/hank_sha_resume.pdf',
    download: 'hank-sha-applied-ai.pdf',
    available: true,
  },
  {
    slug: 'fde',
    label: 'Forward-Deployed Engineering',
    blurb: 'For forward-deployed and solutions engineering roles.',
    file: '/assets/resume-fde.pdf',
    download: 'hank-sha-fde.pdf',
    available: false,
  },
  {
    slug: 'data-science',
    label: 'Data Science',
    blurb: 'For data science and applied statistics roles.',
    file: '/assets/resume-data-science.pdf',
    download: 'hank-sha-data-science.pdf',
    available: false,
  },
];

export function availableVariants(): ResumeVariant[] {
  return RESUME_VARIANTS.filter((v) => v.available);
}

export function variantBySlug(slug: string): ResumeVariant | undefined {
  return RESUME_VARIANTS.find((v) => v.slug === slug);
}
