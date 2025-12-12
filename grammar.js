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
    [$.array_pattern, $.array_literal],
  ],

  rules: {
    source_file: $ => repeat($._statement),

    // ----------------------
    // Lexical
    // ----------------------
    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,
    blank_identifier: _ => '_',
    
    number: _ => token(choice(
      /0[xX][0-9a-fA-F]+/,           // Hex
      /0[oO][0-7]+/,                  // Octal
      /0[bB][01]+/,                   // Binary
      /-?(?:0|[1-9][0-9]*)/,          // Integer
    )),
    
    float: _ => token(seq(
      optional('-'),
      choice(
        seq(/(?:0|[1-9][0-9]*)/, '.', /[0-9]+/),
        seq(/(?:0|[1-9][0-9]*)/, /[eE][+-]?[0-9]+/),
        seq(/(?:0|[1-9][0-9]*)/, '.', /[0-9]+/, /[eE][+-]?[0-9]+/),
      )
    )),
    
    string: _ => token(choice(
      seq('"', repeat(choice(/[^"\\\n]/, /\\./)), '"'),
      seq('`', repeat(choice(/[^`\\]/, /\\./)), '`'),  // Raw strings
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
      $.for_statement,
      $.for_in_statement,
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
      field('name', $.identifier),
      optional(field('type', $._type)),
      optional(seq('=', field('value', $.expression)))
    )),
    
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
      choice(
        $.struct_type,
        $.interface_type,
        $._type
      )
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
      field('name', $.identifier),
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

    for_statement: $ => seq(
      'for',
      optional(field('condition', $.expression)),
      field('body', $.block)
    ),
    
    for_in_statement: $ => seq(
      'for',
      field('left', $.identifier),
      optional(seq(',', field('left2', $.identifier))),
      'in',
      field('right', $.expression),
      field('body', $.block)
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
      $.identifier,
    ),
    
    simple_type: _ => choice(
      'int', 'int8', 'int16', 'int32', 'int64',
      'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr', 'byte',
      'float32', 'float64', 'decimal',
      'string', 'bool', 'rune', 'error', 'any'
    ),
    
    array_type: $ => prec.left(seq('[', ']', $._type)),
    
    map_type: $ => prec.right(seq('map', '[', $._type, ']', $._type)),
    
    function_type: $ => prec.right(seq(
      'function',
      '(', optional(seq($._type, repeat(seq(',', $._type)))), ')',
      optional($._type)
    )),
    
    // Tuple type: (int, string, bool) or () or (int,)
    tuple_type: $ => seq(
      '(',
      optional(seq(
        $._type,
        choice(
          seq(repeat1(seq(',', $._type)), optional(',')),  // Multi-element: (int, string) or (int, string,)
          ','  // Single-element: (int,)
        )
      )),
      ')'
    ),
    
    struct_type: $ => seq(
      'struct',
      '{',
      optional(seq($.struct_field, repeat(seq(choice(';', /\n/), $.struct_field)))),
      '}'
    ),
    
    struct_field: $ => seq(
      field('name', $.identifier),
      field('type', $._type)
    ),
    
    interface_type: $ => seq(
      'interface',
      '{',
      optional(seq($.interface_method, repeat(seq(choice(';', /\n/), $.interface_method)))),
      '}'
    ),
    
    interface_method: $ => seq(
      field('name', $.identifier),
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
    ),
    
    // do expression for async task spawning
    do_expression: $ => prec.right(seq(
      'do',
      field('task', $.expression)
    )),
    
    // Pipe expression as a completely separate rule
    pipe_expression: $ => prec.left(seq(
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
      $.array_literal,
      $.map_literal,
      $.struct_literal,
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

    array_literal: $ => seq('[', optional(seq($.expression, repeat(seq(',', $.expression)), optional(','))), ']'),

    map_literal: $ => seq('{', optional(seq($.map_entry, repeat(seq(',', $.map_entry)), optional(','))), '}'),
    map_entry: $ => seq(field('key', $.expression), ':', field('value', $.expression)),
    
    struct_literal: $ => prec(1, seq(
      field('type', $.identifier),
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
    ),
    
    // Receive pattern for channel select: receive(ch) as val
    receive_pattern: $ => seq(
      'receive',
      '(',
      field('channel', $.expression),
      ')',
      'as',
      field('binding', choice($.identifier, $.blank_identifier))
    ),
    
    array_pattern: $ => seq('[', optional(seq($.pattern, repeat(seq(',', $.pattern)))), ']'),
    
    // Arrow functions - use GLR parsing with explicit conflict
    arrow_function: $ => prec.right(1, seq(
      field('parameters', $.identifier),
      '=>',
      field('body', choice($.expression, $.block))
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
