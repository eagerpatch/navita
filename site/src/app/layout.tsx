import type { Metadata } from 'next';
import { Inter, Nunito } from 'next/font/google';
import { Container } from '@/components/container';
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Responsive } from '@/components/layout/responsive';
import { SidebarNav } from '@/components/layout/sidebarNav';
import { Theme } from "@/components/layout/theme";
import { getNavigation } from "@/utils/docs";

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
  hero: React.ReactNode;
}

export default async function RootLayout({ children, hero }: Props) {
  const navigation = await getNavigation();

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
          {hero}
          <Container>
            <Responsive>
              <SidebarNav navigation={navigation} />
              <Main>{children}</Main>
            </Responsive>
          </Container>
          <Footer />
        </body>
      </html>
    </Theme>
  );
}
