;; Harneet Programming Language - Local Scope Queries for Helix Editor
;; Tree-sitter locals queries for semantic highlighting and navigation

;; ----------------------
;; Scopes
;; ----------------------

(block) @local.scope
(function_declaration) @local.scope
(method_declaration) @local.scope
(anonymous_function) @local.scope
(arrow_function) @local.scope
(for_statement) @local.scope
(for_in_statement) @local.scope
(if_statement) @local.scope
(switch_statement) @local.scope
(match_expression) @local.scope

;; ----------------------
;; Definitions
;; ----------------------

;; Variable declarations
(variable_declaration name: (identifier) @local.definition.var)
(const_declaration name: (identifier) @local.definition.constant)

;; Assignment creates variable (short declaration)
(assignment_statement
  left: (identifier) @local.definition.var
  operator: ":=")

;; Function declarations
(function_declaration name: (identifier) @local.definition.function)
(method_declaration name: (identifier) @local.definition.method)

;; Parameters
(parameter name: (identifier) @local.definition.parameter)

;; Receiver in method
(receiver name: (identifier) @local.definition.parameter)

;; For-in loop variables
(for_in_statement left: (identifier) @local.definition.var)

;; Match arm bindings
(match_arm pattern: (identifier) @local.definition.var)

;; ----------------------
;; Type Definitions
;; ----------------------

(type_declaration name: (identifier) @local.definition.type)
(enum_declaration name: (identifier) @local.definition.type)
(enum_variant name: (identifier) @local.definition.constant)

;; ----------------------
;; Import Definitions
;; ----------------------

(import_spec path: (identifier) @local.definition.import)
(import_spec alias: (identifier) @local.definition.import)

;; ----------------------
;; References
;; ----------------------

(identifier) @local.reference