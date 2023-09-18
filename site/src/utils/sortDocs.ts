type PartialDoc = {
  pathSegments: {
    order: number;
  }[];
}

const segmentsToOrder = (doc: PartialDoc) => parseInt(
  doc.pathSegments.map((x) => x.order).join('')
);
export const sortDocs = (a: PartialDoc, b: PartialDoc) => segmentsToOrder(a) - segmentsToOrder(b);
