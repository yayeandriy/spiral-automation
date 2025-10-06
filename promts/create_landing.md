cd /Users/pluton/Agents/spiral/projects && copilot --allow-all-tools -p  "
you are b2b marketing expert
look up inside folder ./tmp/source learn all files and nested folders content and based on the content create json which content should has a features from ./schemas/zones/product_showcase_zone.json and corresponds notion API blocks schema: ./schemas/notion_blocks_schema.json
Requirements:
- preferable 3 and 4 columns lists
- dont use a colors for text, only black and gray
- dont use emoji
- for headings use only h3 and h4
- dont include styles
- vary layout
- use in one column set same layout approach
- suggest illustrations and images, place placeholders (rects with desc)
- placeholders make as column(s) not as image with gray background and text of desc inside
- dont use image blocks, instead mage gray columns if needed
IMPORTANT!!!  all content should be in column_list type of blocks
IMPORTANT!!!  min numbers of columns in a row should be 2
IMPORTANT!!!  dont use code blocks
IMPORTANT!!!  body failed validation. Fix one: body.children[7].column_list.children[1].column.children[2].paragraph.rich_text[0].text should be defined, instead was undefined.
IMPORTANT!!!  Omit body failed validation: body.children[1].column_list.children[0].column.children[0].paragraph.rich_text[0].text.annotations should be not present, instead was {"bold":true}.
IMPORTANT!!!  body validation: body.children[0].column_list.children should be defined, instead was undefined.
IMPORTANT!!!  Use valid image urls. To not fail into Content creation Failed. Fix the following: Invalid image url.
output place into ./tmp/targets/landing.json (rewrite if needed)"