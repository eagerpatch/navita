import { fontFace, style } from "@navita/css";

const comicSans = fontFace({
  src: 'local("Comic Sans MS")',
})

const container = style({
  fontFamily: comicSans,
});

interface Props {
  children: React.ReactNode;
}

export const ComicSansContainer = ({ children }: Props) => (
  <div className={container}>
    {children}
  </div>
);
