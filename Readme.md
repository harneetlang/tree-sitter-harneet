# tree-sitter-harneet

Tree-sitter grammar for the Harneet programming language.

## Features
- Packages: `package main`
- Imports: `import fmt`, `import "../mylib" as mylib`
- Variables/Constants: `var x int = 1`, `const Pi = 3.14`
- Types: basic, arrays, maps, function types
- Functions: `function name(params) { ... }`, arrow functions `(x) => x+1`
- Control flow: `if/else`, `for i in range(10) {}`, `break`, `continue`
- Pattern matching: `match expr { pattern => result }`
- Literals: numbers, strings, booleans, None, arrays, maps, structs
- Expressions: calls, member access, indexing, binary/unary ops
- Comments: `// line`, `/* block */`

## Layout
- `grammar.js` — grammar definition
- `queries/` — highlight and locals queries
- `binding.gyp` & `bindings/` — Node bindings
- `corpus/` — parser tests
- `package.json` — project metadata and scripts

## Development
1. Install the CLI (Node):
   - `npm i -D tree-sitter-cli`
2. Generate parser C sources:
   - `npm run generate`
3. Run tests:
   - `npm test`
4. Parse a file:
   - `npm run parse -- path/to/file.ha`

Alternatively, install the CLI globally:
- `npm i -g tree-sitter-cli`
- `tree-sitter generate`
- `tree-sitter test`

## Editor integration
- Neovim/NVim Treesitter: point to this repository/language and install.
- Helix: add language config pointing to the grammar.
- VSCode: use an extension consuming the generated WASM or Node binding.

## Notes
- This is an initial grammar; expect adjustments as the language evolves (e.g., packages, imports, `match`, maps/structs).
- If you add/modify syntax in Harneet, update `grammar.js` and the `corpus/` tests, then re-generate and re-test.
