"use client";

import { merge, style } from "@navita/css";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useCallback } from "react";
import { vars } from "@/components/layout/theme";
import type { DocTree } from "@/utils/buildDocumentationTree";

const h4 = style({
  fontWeight: 500,
});

const sub = style({
  borderLeftWidth: '1px',
  paddingLeft: '.75rem',
  marginLeft: '0.75rem',
});

const item = style({
  marginTop: '0.5rem',
  height: '2rem',
  alignItems: 'center',
  display: 'flex',
  paddingLeft: '0.75rem',
  paddingRight: '0.75rem',
});

const link = style({
  borderRadius: `calc(${vars.radius} - 2px)`,
  width: '100%',
  ':hover': {
    background: `hsl(${vars.colors.muted})`,
  }
});

const active = style({
  background: `hsl(${vars.colors.accent})`,
});

const mergedLink = merge(item, link);
const mergedH4 = merge(item, h4);

interface Props extends DocTree {
  onClick?: () => void;
}

export const Menu = ({ title, children, onClick = undefined }: Props) => {
  const pathname = usePathname();
  const handleOnClick = useCallback(() => onClick?.(), [onClick]);

  return (
    <div>
      <h4 className={mergedH4}>{title}</h4>
      <div className={sub}>
        {children.map((child) => (
          <Link
            key={child.id}
            className={merge(mergedLink, pathname === child.slug && active)}
            href={child.slug}
            onClick={handleOnClick}
          >
            {child.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
