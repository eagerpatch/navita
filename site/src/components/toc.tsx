"use client";

import { merge, style } from "@navita/css";
import { useMemo } from "react";
import { vars } from "@/components/layout/theme";
import { useActiveItem } from "@/hooks/useActiveItem";
import type { Item } from "@/types";

const ul = style({
  paddingLeft: "1rem"
});

const li = style({
  paddingTop: "0.5rem"
});

const link = style({
  color: `hsl(${vars.colors.mutedForeground})`,
  fontSize: ".875rem",
  lineHeight: "1.25rem",
  display: "inline-block",
  textDecoration: "none"
});

const linkActive = style({
  color: `hsl(${vars.colors.foreground})`
});

function Tree({ tree, level = 1, activeItem }: {
  tree: Item,
  level?: number,
  activeItem?: string,
}) {
  if (!tree.items) {
    return null;
  }

  return (
    <ul className={merge(level > 1 && ul)}>
      {tree.items.map((item, index) => {
        if (!item.title) {
          return null;
        }

        return (
          <li key={index} className={li}>
            <a
              href={item.url}
              className={merge(link, item.url === `#${activeItem}` && linkActive)}
            >
              {item.title}
            </a>
            {item.items?.length && (
              <Tree tree={item} level={level + 1} activeItem={activeItem} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

const toc = style({
  position: "sticky",
  paddingTop: "2.5rem",
  marginTop: "-2.5rem",
  top: "4rem",

  display: "none",
  "@media (min-width: 1280px)": {
    display: "block"
  }
});

const p = style({
  fontWeight: 500,
  marginBottom: "0.5rem"
});

interface Props {
  items: Item[];
}

export const Toc = ({ items }: Props) => {
  const tree = useMemo(() => ({ items }), [items]);
  const itemIds = useMemo(() => {
    const extractUrls = (item: Item): string[] => [
      item.url || "",
      ...(item.items || []).flatMap(extractUrls)
    ];

    return extractUrls({ url: "", items: items || [] })
      .filter(Boolean)
      .map(id => id.split("#")[1]);
  }, [items]);

  const activeHeading = useActiveItem(itemIds);

  return (
    <div className={toc}>
      <p className={p}>On This Page</p>
      <Tree tree={tree} activeItem={activeHeading} />
    </div>
  );
};
