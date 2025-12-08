;; Harneet Programming Language - Syntax Highlighting for Helix Editor

;; Keywords
[
  "var"
  "const"
  "type"
  "enum"
  "function"
  "return"
  "defer"
  "if"
  "else"
  "for"
  "in"
  "switch"
  "case"
  "default"
  "match"
  "import"
  "as"
  "go"
  "package"
  "struct"
  "interface"
  "map"
  "and"
  "or"
  "not"
] @keyword

;; Statements (for break/continue which are anonymous)
(break_statement) @keyword
(continue_statement) @keyword

;; Types
(simple_type) @type

;; Literals
(boolean) @constant.builtin
(none) @constant.builtin
(number) @constant.numeric
(float) @constant.numeric
(string) @string
(rune) @string

;; Comments
(comment) @comment

;; Operators
[
  "="
  ":="
  "+="
  "-="
  "*="
  "/="
  "%="
  "+"
  "-"
  "*"
  "/"
  "%"
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "!"
  "=>"
] @operator

;; Punctuation
[
  ";"
  ":"
  ","
  "."
] @punctuation.delimiter

[
  "("
  ")"
  "{"
  "}"
  "["
  "]"
] @punctuation.bracket

;; Functions
(function_declaration name: (identifier) @function)
(call_expression function: (expression (identifier) @function))

;; Variables
(variable_declaration name: (identifier) @variable)
(const_declaration name: (identifier) @constant)
(parameter name: (identifier) @variable.parameter)
(identifier) @variable

;; Error
(ERROR) @error