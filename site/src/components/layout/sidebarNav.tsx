'use client';

import { merge, style } from "@navita/css";
import { useCallback, useState } from "react";
import { Hamburger } from "@/components/buttons/hamburger";
import { Menu } from "@/components/layout/menu";
import { vars } from "@/components/layout/theme";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { DocTree } from "@/utils/buildDocumentationTree";

const aside = style({
  zIndex: vars.zIndex.header,
  position: 'fixed',
  '@media (min-width: 768px)': {
    marginRight: '-1rem',
    paddingRight: '1rem',
    position: 'sticky',
    overflowY: 'auto',
    overflowX: 'hidden',
    height: `calc(100vh - ${vars.header.height})`,
    top: '4rem',
    zIndex: vars.zIndex.sidebar,
    display: 'block',
  },
});

const hamburger = style({
  position: 'fixed',
  top: 0,
  right: 0,
  height: vars.header.height,
  padding: '1rem',
  marginLeft: 'auto',
  '@media (min-width: 768px)': {
    display: 'none',
  }
});

const nav = style({
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  gridAutoRows: 'max-content',
  gridAutoFlow: 'row',
  display: 'none',
  position: 'fixed',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  paddingBottom: '1rem',
  '@media (min-width: 768px)': {
    position: 'initial',
    display: 'grid',
    paddingTop: '1.5rem',
  }
});

const openContainer = style({
  display: 'grid',
  marginTop: '4rem',
  paddingRight: '1rem',
  overflowY: 'auto',
  background: `hsl(${vars.colors.background})`,
});

interface Props {
  tree: DocTree[];
}

export const SidebarNav = ({ tree }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOnMenuClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  useMediaQuery('(min-width: 768px)', (matches) => {
    if (matches) {
      setIsOpen(false);
    }
  });

  const handleOpenMenu = useCallback(() => {
    setIsOpen((prevState) => !prevState);
  }, []);

  return (
    <>
      <aside className={aside}>
        <Hamburger
          className={hamburger}
          isOpen={isOpen}
          onClick={handleOpenMenu}
        />

        <nav
          className={merge(nav, isOpen && openContainer)}
          aria-label="Main menu"
        >
          {tree.map((x) => (
            <Menu
              key={x.id}
              {...x}
              onClick={handleOnMenuClick}
            >{x.children}</Menu>
          ))}
        </nav>
      </aside>
    </>
  );
}
