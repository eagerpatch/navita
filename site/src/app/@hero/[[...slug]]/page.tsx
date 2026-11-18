import { heroExampleItem } from "../../../../qino/items/heroExample";
import { Hero } from "@/components/layout/hero";
import { Mdx } from "@/components/mdx";

type Props = {
  params: Promise<{
    slug?: Array<string>;
  }>;
};

// Only the home page has a hero
export default async function HeroSlot({ params }: Props) {
  const { slug } = await params;

  if (slug?.length) {
    return null;
  }

  const example = await heroExampleItem.getEntry();

  return (
    <Hero
      title="CSS-in-JS with zero runtime"
      description="Type-safe compile time Atomic CSS-in-JS with zero runtime."
    >
      <Mdx source={example.markdown} flattenedPath="examples/button" />
    </Hero>
  );
}
