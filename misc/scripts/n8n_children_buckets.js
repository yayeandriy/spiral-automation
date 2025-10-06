// Loop over input items and split children into buckets of at most 50 items
// const data = $input.all()[0].json;
const notion_page_id = $input.all()[0].json.id;
const children = $input.all().slice(1);

// Split children into buckets of 50
const bucketSize = 50;
const res = [];

for (let i = 0; i < children.length; i += bucketSize) {
  const bucket = children.slice(i, i + bucketSize);
  const bucketChildren = bucket.map(ch => ch.json);
  
  res.push({
    val: { children: bucketChildren },
    notion_page_id
  });
}

return res;//, data: {children:data}};