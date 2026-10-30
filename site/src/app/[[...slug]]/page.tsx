import { notFound } from "next/navigation";
import { Article } from "@/components/article";
import { Toc } from "@/components/toc";
import { generateToc } from "@/mdx/generateToc";
import { getDoc, getDocPages } from "@/utils/docs";

type Props = {
  params: Promise<{
    slug?: Array<string>;
  }>;
};

const toUrl = (slug?: Array<string>) => `/${slug?.join('/') ?? ''}`;

export const dynamicParams = false;

export async function generateStaticParams() {
  const pages = await getDocPages();

  return pages.map((page) => ({
    slug: page.url.split('/').filter(Boolean),
  }));
}

export async function generateMetadata({ params }: Props) {
  const doc = await getDoc(toUrl((await params).slug));

  if (!doc) {
    return {};
  }

  return {
    title: `Navita - ${doc.title}`
  };
}

export default async function DocumentPage({ params }: Props) {
  const doc = await getDoc(toUrl((await params).slug));

  if (!doc) {
    notFound();
  }

  const toc = await generateToc(doc.markdown);

  return (
    <>
      <Article
        title={doc.title}
        source={doc.markdown}
        flattenedPath={doc.flattenedPath}
        description={doc.description}
        length={doc.markdown.length}
        pager={doc.pager}
      />
      <div>
        <Toc items={toc} />
      </div>
    </>
  );
};
