;; Locals (scopes) for Harneet

; Function parameters are local definitions
(parameter (identifier) @definition.parameter)

; Variable and const declarations define locals
(variable_declaration name: (identifier) @definition.var)
(const_declaration (identifier) @definition.constant)

; References
(identifier) @reference
