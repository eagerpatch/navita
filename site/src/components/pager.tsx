'use client';

import { merge, style } from "@navita/css";
import Link from "next/link";
import { ghost } from "@/components/buttonVariants";
import { Chevron } from "@/components/icons/chevron";
import type { Pager as PagerProps } from "@/utils/getPagerForDoc";

const container = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const ml = style({
  marginLeft: 'auto',
});

const chevron = style({
  width: '1rem',
  height: '1rem',
});

const chevronRight = style({
  marginLeft: '0.5rem',
});

const chevronLeft = style({
  marginRight: '0.5rem',
});

export const Pager = ({ next, prev }: PagerProps) => (
  <div className={container}>
    {prev && (
      <Link className={ghost} href={prev.slug}>
        <Chevron side="left" className={merge(chevron, chevronLeft)} />
        {prev.title}
      </Link>
    )}

    {next && (
      <Link
        href={next.slug}
        className={[ghost, ml].join(' ')}
      >
        {next.title}
        <Chevron side="right" className={merge(chevron, chevronRight)} />
      </Link>
    )}
  </div>
);
