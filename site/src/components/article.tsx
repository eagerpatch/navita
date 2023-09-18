import { style } from "@navita/css";
import type { ComponentProps } from "react";
import { vars } from "@/components/layout/theme";
import { Mdx } from "@/components/mdx";
import { Pager } from "@/components/pager";

const h1 = style({
  fontSize: '2.25rem',
  lineHeight: '2.5rem',
  fontFamily: vars.fonts.heading,
  display: 'inline-block',
  '@media (min-width: 1024px)': {
    fontSize: '3rem',
    lineHeight: '1',
  }
});

const p = style({
  marginTop: '1rem',
  marginBottom: 0,
  color: `hsl(${vars.colors.mutedForeground})`,
  fontSize: '1.25rem',
  lineHeight: '1.75rem',
});

const hr = style({
  marginTop: '1rem',
  marginBottom: '1rem',
  height: 0,
  borderTopWidth: '1px',
  color: 'inherit',
});

const hrPager = style({
  '@media (min-width: 768px)': {
    marginTop: '1.5rem',
    marginBottom: '1.5rem',
  }
});

type Pager = ComponentProps<typeof Pager>;

interface Props {
  title: string;
  code: string;
  length?: number;
  description?: string;
  pager?: Pager;
}

export const Article = ({ title, description, code, pager, length }: Props) => {
  return (
    <article>
      <div>
        <h1 className={h1}>{title}</h1>
        {description && (<p className={p}>{description}</p>)}
      </div>
      {length === undefined || length > 0 && (
        <>
          <hr className={hr} />
          <Mdx code={code} />
        </>
      )}
      {pager && (
        <>
          <hr className={[hr, hrPager].join(' ')} />
          <Pager {...pager} />
        </>
      )}
    </article>
  );
}
