const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Footer,
  PageNumber,
} = require("docx");

async function generateDocx(documentModel) {
  const children = [];

  for (const block of documentModel) {
    if (block.type === "heading") {
      children.push(
        new Paragraph({
          text: block.text,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
        }),
      );
    } else if (block.type === "paragraph") {
      children.push(
        new Paragraph({
          text: block.text,
          spacing: { after: 120 },
        }),
      );
    } else if (block.type === "bulletList" && Array.isArray(block.items)) {
      for (const item of block.items) {
        children.push(
          new Paragraph({
            text: item,
            bullet: { level: 0 },
            spacing: { after: 80 },
          }),
        );
      }
    } else if (block.type === "code") {
      children.push(
        new Paragraph({
          text: block.text,
          spacing: { after: 120 },
          style: "CodeStyle",
        }),
      );
    } else if (block.type === "spacer") {
      children.push(
        new Paragraph({
          text: "",
          spacing: { after: 200 },
        }),
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun("Page "),
                  PageNumber.CURRENT,
                  new TextRun(" of "),
                  PageNumber.TOTAL_PAGES,
                ],
              }),
            ],
          }),
        },
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

module.exports = generateDocx;
