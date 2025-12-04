;; Harneet Programming Language - Syntax Highlighting for Helix Editor
;; Tree-sitter highlighting queries matching grammar.js

;; ----------------------
;; Keywords
;; ----------------------

;; Storage/Declaration keywords
[
  "var"
  "const"
  "type"
  "enum"
] @keyword.storage

;; Function keywords
[
  "function"
  "return"
  "defer"
] @keyword.function

;; Control flow keywords
[
  "if"
  "else"
  "for"
  "in"
  "switch"
  "case"
  "default"
  "match"
  "break"
  "continue"
] @keyword.control

;; Import keywords
[
  "import"
  "as"
  "go"
  "package"
] @keyword.import

;; Type definition keywords
[
  "struct"
  "interface"
] @keyword.storage.type

;; ----------------------
;; Types
;; ----------------------

(simple_type) @type.builtin

;; Map keyword as type
"map" @type.builtin

;; User-defined type names
(type_declaration name: (identifier) @type)
(enum_declaration name: (identifier) @type.enum)
(struct_type) @type
(interface_type) @type

;; Type annotations
(parameter type: (_) @type)
(variable_declaration type: (_) @type)
(const_declaration type: (_) @type)

;; ----------------------
;; Literals
;; ----------------------

(boolean) @constant.builtin.boolean
(none) @constant.builtin

(number) @constant.numeric.integer
(float) @constant.numeric.float
(string) @string
(rune) @constant.character

;; ----------------------
;; Comments
;; ----------------------

(comment) @comment

;; ----------------------
;; Operators
;; ----------------------

[
  "="
  ":="
  "+="
  "-="
  "*="
  "/="
  "%="
] @operator

[
  "+"
  "-"
  "*"
  "/"
  "%"
  "**"
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "and"
  "or"
  "not"
  "!"
  "&"
  "|"
  "^"
  "<<"
  ">>"
] @operator

;; Arrow operator for match and arrow functions
"=>" @operator

;; ----------------------
;; Punctuation
;; ----------------------

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

;; ----------------------
;; Functions
;; ----------------------

;; Function declarations
(function_declaration name: (identifier) @function)

;; Function calls - nested expression handling
(call_expression
  function: (expression
    (identifier) @function.call))

(call_expression
  function: (expression
    (member_expression
      property: (identifier) @function.method)))

;; Anonymous functions
(anonymous_function) @function

;; Arrow functions
(arrow_function) @function

;; ----------------------
;; Variables and Parameters
;; ----------------------

;; Parameters
(parameter name: (identifier) @variable.parameter)

;; Variable declarations
(variable_declaration name: (identifier) @variable)
(const_declaration name: (identifier) @constant)

;; Blank identifier
(blank_identifier) @variable.builtin

;; General identifiers (lower priority - will be overridden by more specific rules)
(identifier) @variable

;; ----------------------
;; Struct and Enum
;; ----------------------

;; Struct fields
(struct_field name: (identifier) @variable.other.member)
(struct_field_value name: (identifier) @variable.other.member)

;; Enum variants
(enum_variant name: (identifier) @constant)

;; Struct literals
(struct_literal type: (identifier) @type)

;; ----------------------
;; Match expressions
;; ----------------------

(match_arm pattern: (identifier) @variable)
(match_arm pattern: (literal) @constant)

;; ----------------------
;; Imports and Packages
;; ----------------------

(package_declaration name: (identifier) @namespace)
(import_spec path: (identifier) @namespace)
(import_spec path: (string) @string)
(import_spec alias: (identifier) @namespace)

;; ----------------------
;; Member access
;; ----------------------

(member_expression
  property: (identifier) @variable.other.member)

;; Module method calls (fmt.Println, etc.)
(call_expression
  function: (expression
    (member_expression
      object: (expression (identifier) @namespace)
      property: (identifier) @function.method)))

;; ----------------------
;; Special patterns
;; ----------------------

;; Constants (ALL_CAPS identifiers)
((identifier) @constant
 (#match? @constant "^[A-Z][A-Z_0-9]+$"))

;; Built-in modules
((identifier) @module
 (#match? @module "^(fmt|math|strings|datetime|os|path|file|log|errors|json|regex|http|sync|encoding|cast|db|box)$"))

;; Error highlighting
(ERROR) @error