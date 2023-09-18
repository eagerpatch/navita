import { merge, style } from "@navita/css";
import type { MDXComponents } from 'mdx/types';
import Image from "next/image";
import { useMDXComponent } from "next-contentlayer/hooks";
import { CompiledCode } from "@/components/compiledCode";
import { vars } from "@/components/layout/theme";

const h1 = style({
  fontSize: '2.25rem',
  lineHeight: '2.5rem',
  fontWeight: '700',
  letterSpacing: '-0.025em',
  marginTop: '0.5rem',
  scrollMargin: '5rem',
});

const h2 = style({
  fontSize: '1.875rem',
  lineHeight: '2.25rem',
  fontWeight: '600',
  letterSpacing: '-0.025em',
  paddingBottom: '0.25rem',
  borderBottomWidth: '1px',
  marginTop: '2.5rem',
  ':first-child': {
    marginTop: '0',
  },
  scrollMargin: '5rem'
});

const h3 = style({
  letterSpacing: '-0.025em',
  fontWeight: '600',
  fontSize: '1.5rem',
  lineHeight: '2rem',
  scrollMargin: '5rem',
  marginTop: '2rem',
});

const h4 = style({
  letterSpacing: '-0.025em',
  fontWeight: '600',
  fontSize: '1.25rem',
  lineHeight: '1.75rem',
  scrollMargin: '5rem',
  marginTop: '2rem',
});

const h5 = style({
  letterSpacing: '-0.025em',
  fontWeight: '600',
  fontSize: '1.125rem',
  lineHeight: '1.75rem',
  scrollMargin: '5rem',
  marginTop: '2rem',
});

const h6 = style({
  letterSpacing: '-0.025em',
  fontWeight: '600',
  fontSize: '1rem',
  lineHeight: '1.5rem',
  scrollMargin: '5rem',
  marginTop: '2rem',
});

const a = style({
  textUnderlineOffset: '4px',
  textDecorationLine: 'underline',
  fontWeight: '500',
});

const p = style({
  lineHeight: '1.75rem',
  marginTop: '1.5rem',
  ':first-child': {
    marginTop: '0',
  }
});

const ul = style({
  listStyleType: 'disc',
  marginLeft: '1.5rem',
  marginTop: '1.5rem',
  marginBottom: '1.5rem',
});

const ol = style({
  listStyleType: 'decimal',
  marginLeft: '1.5rem',
  marginTop: '1.5rem',
  marginBottom: '1.5rem',
});

const li = style({
  marginTop: '0.5rem',
  lineHeight: '1.75rem',
});

const blockquote = style({
  fontStyle: 'italic',
  paddingLeft: '1.5rem',
  borderLeftWidth: '2px',
  marginTop: '1.5rem',
  '& > *': {
    color: `hsl(${vars.colors.mutedForeground})`,
  }
});

const img = style({
  borderWidth: '1px',
  borderRadius: `calc(${vars.radius} - 2px)`,
});

const hr = style({
  marginTop: '1rem',
  marginBottom: '1rem',
  '@media (min-width: 768px)': {
    marginTop: '2rem',
    marginBottom: '2rem',
  }
});

const tableContainer = style({
  overflowY: 'auto',
  width: '100%',
  marginTop: '1.5rem',
  marginBottom: '1.5rem',
});

const table = style({
  width: '100%',
});

const tr = style({
  padding: 0,
  borderTopWidth: '1px',
  margin: 0,
  ':nth-child(2n)': {
    backgroundColor: `hsl(${vars.colors.muted})`,
  }
});

const th = style({
  fontWeight: '700',
  textAlign: 'left',
  paddingTop: '0.5rem',
  paddingBottom: '0.5rem',
  paddingLeft: '1rem',
  paddingRight: '1rem',
  borderWidth: '1px',
  '& [align="right"]': {
    textAlign: 'right',
  },
  '& [align="center"]': {
    textAlign: 'center',
  },
});

const td = style({
  textAlign: 'left',
  paddingTop: '0.5rem',
  paddingBottom: '0.5rem',
  paddingLeft: '1rem',
  paddingRight: '1rem',
  borderWidth: '1px',
  '& [align="right"]': {
    textAlign: 'right',
  },
  '& [align="center"]': {
    textAlign: 'center',
  },
});

const pre = style({
  paddingTop: '1rem',
  paddingBottom: '1rem',
  backgroundColor: 'rgb(0 0 0)', // todo: fix?
  borderWidth: '1px',
  borderRadius: vars.radius,
  overflowX: 'auto',
  marginTop: '1.5rem',
  marginBottom: '1rem',
  '& code': {
    display: 'grid',
    borderWidth: 0,
  }
});

const code = style({
  fontSize: '.875rem',
  lineHeight: '1.25rem',
  borderWidth: '1px',
  fontFamily: 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  paddingTop: '0.2rem',
  paddingBottom: '0.2rem',
  paddingLeft: '0.3rem',
  paddingRight: '0.3rem',
  borderRadius: '0.25rem',
  position: 'relative',
  counterReset: 'line',
  '& [data-line]::before': {
    counterIncrement: 'line',
    content: 'counter(line)',
    display: 'inline-block',
    width: '1rem',
    marginRight: '1rem',
    textAlign: 'right',
    color: 'gray',
  },
  '& [data-line]': {
    padding: '.25rem 1rem',
  }
});

const components: MDXComponents = {
  h1: ({ className, ...props }) => (
    <h1
      className={merge(h1, className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={merge(h2, className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={merge(h3, className)}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={merge(h4, className)}
      {...props}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5
      className={merge(h5, className)}
      {...props}
    />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={merge(h6, className)}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={merge(a, className)}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={merge(p, className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul className={merge(ul, className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={merge(ol, className)} {...props} />
  ),
  li: ({ className, ...props }) => (
    <li className={merge(li, className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={merge(blockquote, className)}
      {...props}
    />
  ),
  img: ({
    className,
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={merge(img, className)} alt={alt} {...props} />
  ),
  hr: ({ className, ...props }) => <hr className={merge(hr, className)} {...props} />,
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className={tableContainer}>
      <table className={merge(table, className)} {...props} />
    </div>
  ),
  tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr
      className={merge(tr, className)}
      {...props}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={merge(th, className)}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={merge(td, className)}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={merge(pre, className)}
      {...props}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={merge(code, className)}
      {...props}
    />
  ),
  CompiledCode: ({ children, ...rest }) => <CompiledCode {...rest }>{children}</CompiledCode>,
  Image,
  Callout: ({ children, code }) => (
    <h1>
      Hejsan
      {children}
      {code}
    </h1>
  ),
}

interface MdxProps {
  code: string;
}

export function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code);

  return (
    <Component components={components} />
  );
}
