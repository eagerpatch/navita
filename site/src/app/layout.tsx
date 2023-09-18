import type { Metadata } from 'next';
import { Inter, Nunito } from 'next/font/google';
import { Container } from '@/components/container';
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Hero } from "@/components/layout/hero";
import { Main } from "@/components/layout/main";
import { Responsive } from '@/components/layout/responsive';
import { SidebarNav } from '@/components/layout/sidebarNav';
import { Theme } from "@/components/layout/theme";
import { buildDocumentationTree } from "@/utils/buildDocumentationTree";
import { allDocs } from "contentlayer/generated";

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--next-font-sans'
});

const fontHeading = Nunito({
  weight: '1000',
  subsets: ['latin'],
  variable: '--next-font-heading'
});

export const metadata: Metadata = {
  title: 'Navita',
  description: 'Documentation for Navita',
};

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Props) {
  const tree = buildDocumentationTree(allDocs);

  return (
    <Theme>
      <html
        lang="en"
        className={[
          fontSans.variable,
          fontHeading.variable,
        ].join(' ')}
      >
        <body>
          <Header />
          <Hero
            title="CSS-in-JS with zero runtime"
            description="Type-safe compile time Atomic CSS-in-JS with zero runtime."
          />
          <Container>
            <Responsive>
              <SidebarNav tree={tree} />
              <Main>{children}</Main>
            </Responsive>
          </Container>
          <Footer />
        </body>
      </html>
    </Theme>
  );
}
