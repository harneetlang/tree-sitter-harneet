// Tree-sitter grammar for Harneet language
// Comprehensive grammar matching all current language features
// Docs: https://tree-sitter.github.io/tree-sitter/creating-parsers

module.exports = grammar({
  name: 'harneet',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.pattern, $._primary_expression],
    [$.parameter, $._primary_expression],
    [$.for_in_clause, $.expression],
    [$.qualified_type, $._primary_expression],
    [$.qualified_type, $.member_expression],
    [$.qualified_type, $.struct_literal],
    [$.variable_declaration, $.typed_var_spec],
  ],

  rules: {
    source_file: $ => repeat($._statement),

    // ----------------------
    // Lexical
    // ----------------------
    identifier: _ => /[A-Za-z][A-Za-z0-9_]*|_[A-Za-z0-9_]+/,
    blank_identifier: _ => '_',

    number: _ => token(choice(
      /0[xX][0-9a-fA-F]+/,           // Hex
      /0[oO][0-7]+/,                  // Octal
      /0[bB][01]+/,                   // Binary
      /(?:0|[1-9][0-9]*)/,            // Integer
    )),

    float: _ => token(choice(
      seq(/(?:0|[1-9][0-9]*)/, '.', /[0-9]+/),
      seq(/(?:0|[1-9][0-9]*)/, /[eE][+-]?[0-9]+/),
      seq(/(?:0|[1-9][0-9]*)/, '.', /[0-9]+/, /[eE][+-]?[0-9]+/),
    )),

    string: _ => token(choice(
      seq('"', repeat(choice(/[^"\\\n]/, /\\./)), '"'),
      seq('`', /[^`]*/, '`'),  // Raw/multiline strings - allow any char except backtick
    )),

    rune: _ => token(seq("'", choice(/[^'\\]/, /\\./), "'")),

    comment: _ => token(choice(
      seq('//', /[^\n]*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
    )),

    // ----------------------
    // Statements
    // ----------------------
    _statement: $ => choice(
      $.package_declaration,
      $.import_declaration,
      $.variable_declaration,
      $.const_declaration,
      $.type_declaration,
      $.enum_declaration,
      $.function_declaration,
      $.return_statement,
      $.defer_statement,
      $.if_statement,
      $.for_in_statement,  // Must come before for_statement
      $.for_statement,
      $.switch_statement,
      $.break_statement,
      $.continue_statement,
      $.block,
      $.assignment_statement,
      $.expression_statement,
    ),

    package_declaration: $ => seq('package', field('name', $.identifier)),

    import_declaration: $ => seq(
      'import',
      optional('go'),
      $.import_spec,
      repeat(seq(',', $.import_spec))
    ),

    import_spec: $ => seq(
      field('path', choice($.identifier, $.string)),
      optional(seq('as', field('alias', $.identifier)))
    ),

    variable_declaration: $ => prec.right(seq(
      'var',
      choice(
        // Multiple typed variables: var x int, y string = expr
        seq(
          $.typed_var_spec,
          repeat(seq(',', $.typed_var_spec)),
          optional(seq('=', field('value', $.expression)))
        ),
        // Multiple variables with shared type: var _, w1 error = expr or var x, y int = expr
        seq(
          $.multi_var_shared_type,
          optional(seq('=', field('value', $.expression)))
        ),
        // Single variable: var x = expr or var x type = expr
        seq(
          field('name', choice($.identifier, $.blank_identifier)),
          optional(field('type', $._type)),
          optional(seq('=', field('value', $.expression)))
        )
      )
    )),

    // Multiple variables sharing a single type: var x, y, z int
    multi_var_shared_type: $ => seq(
      field('name', choice($.identifier, $.blank_identifier)),
      repeat1(seq(',', field('name', choice($.identifier, $.blank_identifier)))),
      field('type', $._type)
    ),

    // Helper for typed variable in multi-var declarations
    typed_var_spec: $ => seq(
      field('name', choice($.identifier, $.blank_identifier)),
      field('type', $._type)
    ),

    const_declaration: $ => seq(
      'const',
      field('name', $.identifier),
      optional(field('type', $._type)),
      '=',
      field('value', $.expression)
    ),

    type_declaration: $ => prec.right(seq(
      'type',
      field('name', $.identifier),
      $._type
    )),

    enum_declaration: $ => seq(
      'enum',
      field('name', $.identifier),
      '{',
      optional(seq($.enum_variant, repeat(seq(',', $.enum_variant)), optional(','))),
      '}'
    ),

    enum_variant: $ => seq(
      field('name', $.identifier),
      optional(seq('{', optional(seq($.struct_field, repeat(seq(';', $.struct_field)))), '}'))
    ),

    function_declaration: $ => seq(
      'function',
      field('name', $.identifier),
      field('parameters', $.parameter_list),
      optional(field('return_type', $._type)),
      field('body', $.block)
    ),

    parameter_list: $ => seq(
      '(',
      optional(seq($.parameter, repeat(seq(',', $.parameter)))),
      ')'
    ),

    parameter: $ => seq(
      field('name', choice($.identifier, $.blank_identifier)),
      optional(field('type', $._type))
    ),

    block: $ => prec(2, seq('{', repeat($._statement), '}')),

    return_statement: $ => prec.right(seq(
      'return',
      optional($.expression)
    )),

    defer_statement: $ => seq('defer', $.expression),

    if_statement: $ => prec.right(seq(
      'if',
      field('condition', $.expression),
      field('consequence', $.block),
      optional(seq('else', field('alternative', choice($.if_statement, $.block))))
    )),

    // For-in statement: for x in collection { } or for k, v in collection { }
    // Use token.immediate to ensure 'in' is recognized as keyword, not part of expression
    for_in_statement: $ => seq(
      'for',
      $.for_in_clause,
      field('body', $.block)
    ),

    // Separate rule for the "x in collection" part to avoid ambiguity
    for_in_clause: $ => seq(
      field('left', choice($.identifier, $.blank_identifier)),
      optional(seq(',', field('left2', choice($.identifier, $.blank_identifier)))),
      'in',
      field('right', $._non_struct_expression),
    ),

    // For statement: for { } or for condition { }
    for_statement: $ => seq(
      'for',
      optional(choice(
        field('condition', $.expression),
        $.for_c_clause,
      )),
      field('body', $.block)
    ),

    for_c_clause: $ => seq(
      optional(field('init', choice($.assignment_statement, $.expression_statement))),
      ';',
      optional(field('condition', $.expression)),
      ';',
      optional(field('update', choice($.assignment_statement, $.expression_statement))),
    ),


    switch_statement: $ => prec(3, seq(
      'switch',
      optional(field('value', $.expression)),
      '{',
      repeat($.case_clause),
      optional($.default_clause),
      '}'
    )),

    case_clause: $ => seq(
      'case',
      $.expression,
      repeat(seq(',', $.expression)),
      $.block
    ),

    default_clause: $ => seq('default', $.block),

    break_statement: _ => 'break',
    continue_statement: _ => 'continue',

    assignment_statement: $ => prec.right(seq(
      field('left', choice($.identifier, $.blank_identifier, $.index_expression, $.member_expression)),
      field('operator', choice('=', ':=', '+=', '-=', '*=', '/=', '%=')),
      field('right', $.expression)
    )),

    expression_statement: $ => $.expression,

    // ----------------------
    // Types
    // ----------------------
    _type: $ => choice(
      $.simple_type,
      $.array_type,
      $.map_type,
      $.function_type,
      $.tuple_type,
      $.qualified_type,
      $.identifier,
      $.struct_type,
      $.interface_type,
    ),

    // Qualified type for module-prefixed types like db.Connection, http.Request
    qualified_type: $ => seq(
      field('module', $.identifier),
      '.',
      field('name', $.identifier)
    ),

    simple_type: _ => choice(
      'int', 'int8', 'int16', 'int32', 'int64',
      'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr', 'byte',
      'float32', 'float64', 'decimal',
      'string', 'bool', 'rune', 'error', 'any', 'tuple', 'unit',
      'time', 'duration', 'timer', 'ticker', 'location', 'WatchEvent'
    ),

    array_type: $ => prec.left(choice(
      seq('[', ']', $._type),                    // Slice type: []T
      seq('[', $.number, ']', $._type),          // Fixed-size array type: [N]T
    )),

    map_type: $ => prec.right(seq('map', '[', $._type, ']', $._type)),

    function_type: $ => prec.right(seq(
      'function',
      '(', optional(seq($._type, repeat(seq(',', $._type)))), ')',
      optional($._type)
    )),

    // Tuple type: (int, string, bool) or () or (int,)
    // Also handles parenthesized single type: (int) for return type annotations
    tuple_type: $ => seq(
      '(',
      optional(choice(
        // Single type without comma: (int) - used for return type annotations
        $._type,
        // Multi-element or single with trailing comma
        seq(
          $._type,
          choice(
            seq(repeat1(seq(',', $._type)), optional(',')),  // Multi-element: (int, string) or (int, string,)
            ','  // Single-element tuple: (int,)
          )
        )
      )),
      ')'
    ),

    struct_type: $ => seq(
      'struct',
      '{',
      optional(seq($.struct_field, repeat(seq(choice(';', /\n/), $.struct_field)), optional(choice(';', /\n/)))),
      '}'
    ),

    struct_field: $ => seq(
      field('name', $.identifier),
      field('type', $._type)
    ),

    interface_type: $ => seq(
      'interface',
      '{',
      optional(seq($.interface_method, repeat(seq(choice(';', /\n/), $.interface_method)), optional(choice(';', /\n/)))),
      '}'
    ),

    interface_method: $ => seq(
      field('name', choice($.identifier, $.blank_identifier)),
      field('parameters', $.parameter_list),
      optional(field('return_type', $._type))
    ),

    // ----------------------
    // Expressions
    // ----------------------
    expression: $ => choice(
      $._primary_expression,
      $.unary_expression,
      $.binary_expression,
      $.pipe_expression,
      $.call_expression,
      $.member_expression,
      $.index_expression,
      $.match_expression,
      $.arrow_function,
      $.anonymous_function,
      $.do_expression,
      $.type_assertion,
    ),

    // do expression for async task spawning
    do_expression: $ => prec.right(seq(
      'do',
      field('task', $.expression)
    )),

    type_assertion: $ => prec(14, seq(
      field('value', $.expression),
      '.',
      '(',
      field('type', $._type),
      ')'
    )),

    // Pipe expression as a completely separate rule
    pipe_expression: $ => prec.left(1, seq(
      $.expression,
      '|>',
      $.expression
    )),

    _primary_expression: $ => choice(
      $.literal,
      $.identifier,
      $.blank_identifier,
      $.parenthesized_expression,
      $.tuple_literal,
      $.typed_slice_literal,
      $.typed_map_literal,
      $.struct_literal,
      $.typed_array_literal,
      $.qualified_type,
    ),

    literal: $ => choice($.number, $.float, $.string, $.rune, $.boolean, $.none),
    boolean: _ => choice('true', 'false'),
    none: _ => 'None',

    parenthesized_expression: $ => seq('(', $.expression, ')'),

    // Tuple literal: (1, 2, 3) or () or (5,)
    tuple_literal: $ => prec(1, seq(
      '(',
      optional(seq(
        $.expression,
        choice(
          seq(repeat1(seq(',', $.expression)), optional(',')),  // Multi-element: (1, 2) or (1, 2,)
          ','  // Single-element: (5,)
        )
      )),
      ')'
    )),

    unary_expression: $ => prec.left(7, seq(
      field('operator', choice('-', 'not', '!')),
      field('operand', $.expression)
    )),

    binary_expression: $ => choice(
      prec.left(1, seq($.expression, 'or', $.expression)),
      prec.left(2, seq($.expression, 'and', $.expression)),
      prec.left(3, seq($.expression, choice('==', '!=', '<', '>', '<=', '>='), $.expression)),
      prec.left(4, seq($.expression, choice('|', '^'), $.expression)),
      prec.left(5, seq($.expression, '&', $.expression)),
      prec.left(6, seq($.expression, choice('<<', '>>'), $.expression)),
      prec.left(7, seq($.expression, choice('+', '-'), $.expression)),
      prec.left(8, seq($.expression, choice('*', '/', '%'), $.expression)),
      prec.right(9, seq($.expression, '**', $.expression)),
    ),

    call_expression: $ => prec.left(10, seq(
      field('function', $.expression),
      field('arguments', $.argument_list)
    )),

    argument_list: $ => seq('(', optional(seq($.expression, repeat(seq(',', $.expression)))), ')'),

    member_expression: $ => prec.left(10, seq(
      field('object', $.expression),
      '.',
      field('property', $.identifier)
    )),

    index_expression: $ => prec.left(10, seq(
      field('object', $.expression),
      '[',
      field('index', $.expression),
      ']'
    )),

    // Typed slice literal: []Type{elements} - Go-style slice literals
    // Note: Bare array literals [1, 2, 3] are no longer allowed
    typed_slice_literal: $ => seq(
      '[', ']',
      field('element_type', $._type),
      '{',
      optional(seq($.expression, repeat(seq(',', $.expression)), optional(','))),
      '}'
    ),

    // Typed array literal: [size]Type{elements} - fixed-size arrays (Go-style)
    typed_array_literal: $ => seq(
      '[',
      field('size', $.expression),
      ']',
      field('element_type', choice($.simple_type, $.identifier, $.qualified_type)),
      '{',
      optional(seq($.expression, repeat(seq(',', $.expression)), optional(','))),
      '}'
    ),

    // Note: Bare map literals {"key": value} are no longer allowed
    // Use typed map syntax: map[KeyType]ValueType{entries}
    map_entry: $ => seq(field('key', $.expression), ':', field('value', $.expression)),

    // Typed map literal: map[KeyType]ValueType{entries} - Go-style map literals
    typed_map_literal: $ => seq(
      'map',
      '[',
      field('key_type', $._type),
      ']',
      field('value_type', $._type),
      '{',
      optional(seq($.map_entry, repeat(seq(',', $.map_entry)), optional(','))),
      '}'
    ),

    // Struct literal: Type{field: value} or Type{val1, val2}
    // Use negative precedence to prefer block interpretation in ambiguous contexts
    struct_literal: $ => prec(-1, seq(
      field('type', choice($.identifier, $.qualified_type, $.member_expression)),
      '{',
      optional(choice(
        seq($.struct_field_value, repeat(seq(',', $.struct_field_value)), optional(',')),
        seq($.expression, repeat(seq(',', $.expression)), optional(','))
      )),
      '}'
    )),

    struct_field_value: $ => seq(
      field('name', $.identifier),
      ':',
      field('value', $.expression)
    ),

    // Match expression (pattern matching)
    // Supports both: match value { ... } and match { ... } (channel select)
    match_expression: $ => prec(2, seq(
      'match',
      optional(field('value', $.expression)),
      '{',
      repeat($.match_arm),
      '}'
    )),

    match_arm: $ => seq(
      field('pattern', $.pattern),
      optional(seq('if', field('guard', $.expression))),
      '=>',
      field('body', choice($.expression, $.block)),
      optional(',')
    ),

    pattern: $ => choice(
      $.literal,
      $.identifier,
      $.blank_identifier,
      $.array_pattern,
      $.receive_pattern,
      $.send_pattern,
    ),

    // Receive pattern for channel select: receive(ch) as val
    receive_pattern: $ => seq(
      'receive',
      '(',
      field('channel', $._simple_expression),
      ')',
      'as',
      field('binding', choice($.identifier, $.blank_identifier))
    ),

    // Send pattern for channel select: send(ch, val) as ok
    send_pattern: $ => seq(
      'send',
      '(',
      field('channel', $._simple_expression),
      ',',
      field('value', $._simple_expression),
      ')',
      'as',
      field('binding', choice($.identifier, $.blank_identifier))
    ),

    // Simple expression for use in patterns (avoids recursion with match_expression)
    _simple_expression: $ => choice(
      $._primary_expression,
      $.call_expression,
      $.member_expression,
      $.index_expression,
    ),

    // Expression that cannot be a struct literal (for use in for-in to avoid ambiguity with block)
    _non_struct_expression: $ => choice(
      $.literal,
      $.identifier,
      $.blank_identifier,
      $.parenthesized_expression,
      $.tuple_literal,
      $.typed_slice_literal,
      $.typed_map_literal,
      $.typed_array_literal,
      $.call_expression,
      $.member_expression,
      $.index_expression,
    ),

    array_pattern: $ => seq('[', optional(seq($.pattern, repeat(seq(',', $.pattern)))), ']'),

    // Arrow functions - supports multiple forms:
    // 1. Simple: x => x + 1
    // 2. Typed params: (x int) => x + 1
    // 3. Typed params with return: (x int) (int) => x + 1
    // 4. Multiple params: (x int, y int) (int) => x + y
    arrow_function: $ => prec.right(1, choice(
      // Simple form: identifier => body
      seq(
        field('parameters', $.identifier),
        '=>',
        field('body', choice($.expression, $.block))
      ),
      // Typed form: (params) [return_type] => body
      seq(
        field('parameters', $.parameter_list),
        optional(field('return_type', choice($.tuple_type, $._type))),
        '=>',
        field('body', choice($.expression, $.block))
      ),
    )),

    // Anonymous functions
    anonymous_function: $ => seq(
      'function',
      field('parameters', $.parameter_list),
      optional(field('return_type', $._type)),
      field('body', $.block)
    ),
  },
});
