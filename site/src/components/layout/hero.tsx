"use client";

import { merge, style } from "@navita/css";
import { usePathname } from "next/navigation";
import { Container } from "@/components/container";
import { vars } from "@/components/layout/theme";
import { Mdx } from "@/components/mdx";
import { allExamples } from "contentlayer/generated";

const section = style({
  paddingTop: '2.5rem',
  paddingBottom: '2.5rem',
  '@media (min-width: 1024px)': {
    paddingTop: '4rem',
    paddingBottom: '4rem',
  }
});

const container = style({
  alignItems: 'center',
  flexDirection: 'column',
  display: 'flex',
  columnGap: '1rem',
  '@media (min-width: 1024px)': {
    flexDirection: 'row',
  }
});

const column = style({
  flex: 1,
  width: '100%',
});

const columnLeft = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
});

const h1 = style({
  fontSize: '3rem',
  lineHeight: '1',
  fontFamily: vars.fonts.heading,
  marginBottom: '1rem',
  '@media (min-width: 768px)': {
    fontSize: '3.75rem',
    lineHeight: '1',
    // marginBottom: 0,
  },
  '@media (min-width: 1024px)': {
    fontSize: '4.5rem',
    lineHeight: '1',
    // marginBottom: 0,
  }
});

const p = style({
  color: `hsl(${vars.colors.mutedForeground})`,
  fontSize: '1.25rem',
  lineHeight: '2rem',
});

interface Props {
  title: string;
  description?: string;
}

export const Hero = ({ title, description }: Props) => {
  // If someone has a better idea for this, please let me know.
  // Maybe parallell routing?
  // I couldn't get it to work.
  const pathname = usePathname();

  if (pathname !== '/') {
    return null;
  }

  const randomExample = allExamples[Math.floor(Math.random() * allExamples.length)];

  return (
    <section className={section}>
      <Container className={container}>
        <div className={merge(column, columnLeft)}>
          <h1 className={h1}>{title}</h1>
          {description && (<p className={p}>{description}</p>)}
        </div>
        <div className={column}>
          <Mdx code={randomExample.body.code} />
        </div>
      </Container>
    </section>
  );
}
