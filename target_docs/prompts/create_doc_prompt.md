cd /Users/pluton/Agents/spiral/projects && copilot --allow-all-tools -p  "
you are b2b technical support expert
look up inside folder ./tmp/source learn all files and nested folders content and based on the content create comprehensive user guide for b2b service JEBS, with creative approach and targeting most proper group as a json using 
./notion/notion_blocks_schema.json 
./notion/blocks_schema.json and ./notion/rich_text_array.json 
Requirements:  
- dont use a colors for text, only black
- dont use emoji
- for headings use only h1, h2, h3
- dont include styles
- vary layout
- use bullet lists if there more than 4 items and column_list if 4 and less
- use blocks structure preciseely as in Notion API required, check out its docs if needed
- cover at at least first 3 sections and 3+ other sections from following:
  - 01-overview.json
  - 02-getting-started
  - 03-features
  - 04-use-cases.
  - 05-workflow
  - 06-troubleshooting
  - 07-api-docs
  - 08-security-compliance
  - 09-administration
  - 10-integration-guide
  - 11-training-support
  - 12-release-notes
IMPORTANT!!! ALWAYS check validation to the Notion API
body failed validation: heading_2.rich_text should be defined, instead was undefined.
IMPORTANT!!! ALWAYS check validation to the Notion API
body failed validation: body.children[6].column_list.children[0].column.children[0].paragraph.rich_text[0].text.annotations should be not present, instead was {'bold':true}.
IMPORTANT!!! ALWAYS check validation to the Notion API
body failed validation: body.children[2].code.language should be 'abap', 'abc', 'agda', 'arduino', 'ascii art', 'assembly', 'bash', 'basic', 'bnf', 'c', 'c#', 'c++', 'clojure', 'coffeescript', 'coq', 'css', 'dart', 'dhall', 'diff', 'docker', 'ebnf', 'elixir', 'elm', 'erlang', 'f#', 'flow', 'fortran', 'gherkin', 'glsl', 'go', 'graphql', 'groovy', 'haskell', 'hcl', 'html', 'idris', 'java', 'javascript', 'json', 'julia', 'kotlin', 'latex', 'less', 'lisp', 'livescript', 'llvm ir', 'lua', 'makefile', 'markdown', 'markup', 'matlab', 'mathematica', 'mermaid', 'nix', 'notion formula', 'objective-c', 'ocaml', 'pascal', 'perl', 'php', 'plain text', 'powershell', 'prolog', 'protobuf', 'purescript', 'python', 'r', 'racket', 'reason', 'ruby', 'rust', 'sass', 'scala', 'scheme', 'scss', 'shell', 'smalltalk', 'solidity', 'sql', 'swift', 'toml', 'typescript', 'vb.net', 'verilog', 'vhdl', 'visual basic', 'webassembly', 'xml', 'yaml', or 'java/c/c++/c#', instead was 'plain_text'.
output place into ./tmp/targets/docs.json (rewrite if needed)"