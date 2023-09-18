import { notFound } from "next/navigation";
import { Article } from "@/components/article";
import { Toc } from "@/components/toc";
import { getDocumentFromParams } from "@/utils/getDocumentFromParams";
import { allDocs } from "contentlayer/generated";

type Props = {
  params: {
    slug: string[];
  };
};

export async function generateStaticParams() {
  return allDocs.filter((x) => x.display).map((doc) => ({
    slug: doc.slugAsParams.split('/')
  }));
}

export async function generateMetadata({ params }: Props) {
  const result = getDocumentFromParams(params);

  if (!result) {
    return {};
  }

  const { doc } = result;
  const { title } = doc;

  return {
    title: `Navita - ${title}`
  };
}

export default function DocumentPage({ params }: Props) {
  const result = getDocumentFromParams(params);

  if (!result) {
    notFound();
  }

  const { doc, pager } = result;

  return (
    <>
      <Article
        title={doc.title}
        code={doc.body.code}
        description={doc.description}
        length={doc.body.raw.length}
        pager={pager}
      />
      <div>
        <Toc items={doc.toc} />
      </div>
    </>
  );
};
