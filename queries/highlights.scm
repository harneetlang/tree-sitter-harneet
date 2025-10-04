;; Tree-sitter highlight queries for Harneet

; Keywords
((package_declaration) @keyword)
((import_declaration) @keyword)
((function_declaration) @keyword)
((return_statement) @keyword)
((break_statement) @keyword)
((continue_statement) @keyword)
((if_statement) @keyword)
((for_in_statement) @keyword)
((match_expression) @keyword)

; Declarations
((variable_declaration (identifier) @variable))
((const_declaration (identifier) @constant))
((type_declaration (type_identifier) @type))

; Function names
(function_declaration name: (identifier) @function)

; Parameters
(parameter (identifier) @parameter)

; Types
(type_identifier) @type
(array_type) @type
(map_type) @type
(function_type) @type

; Literals
(number) @number
(string) @string
(boolean) @boolean
(none) @constant.builtin

; Calls and members
(call_expression function: (identifier) @function)
(member_expression property: (identifier) @property)

; Operators
(binary_expression operator: (_) @operator)
(unary_expression) @operator

; Punctuation
(semi) @punctuation.delimiter

; Comments
(comment) @comment
