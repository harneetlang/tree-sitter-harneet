;; Harneet Programming Language - Language Injection Rules for Helix Editor
;; Tree-sitter injection queries for embedded languages

;; ----------------------
;; SQL Injection
;; ----------------------

;; SQL strings (common pattern in many languages)
((string) @injection.content
 (#match? @injection.content "(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)")
 (#set! injection.language "sql"))

;; ----------------------
;; JSON Injection
;; ----------------------

;; JSON strings  
((string) @injection.content
 (#match? @injection.content "^\"\\s*[{\\[]")
 (#set! injection.language "json"))

;; ----------------------
;; HTML Injection
;; ----------------------

;; HTML strings
((string) @injection.content
 (#match? @injection.content "^\"\\s*<[^>]+>")
 (#set! injection.language "html"))

;; ----------------------
;; Regex Injection
;; ----------------------

;; Regular expressions in regex module calls
(call_expression
  function: (member_expression
    object: (identifier) @_module
    property: (identifier))
  arguments: (argument_list
    (string) @injection.content)
  (#eq? @_module "regex")
  (#set! injection.language "regex"))

;; ----------------------
;; Comment Injections
;; ----------------------

;; Comments are already handled by the comment node type
(comment) @injection.content
(#set! injection.language "comment")