// Tree-sitter grammar for Harneet language
// Simplified version to avoid conflicts
// Docs: https://tree-sitter.github.io/tree-sitter/creating-parsers

module.exports = grammar({
  name: 'harneet',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($.statement),

    // ----------------------
    // Lexical
    // ----------------------
    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,
    number: _ => /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?/,
    string: _ => token(seq('"', repeat(choice(/[^"\\\n]/, /\\./)), '"')),
    comment: _ => token(choice(
      seq('//', /[^\n]*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
    )),

    // ----------------------
    // Statements
    // ----------------------
    statement: $ => choice(
      $.package_declaration,
      $.import_declaration,
      $.variable_declaration,
      $.function_declaration,
      $.return_statement,
      $.expression_statement,
      $.block,
      $.if_statement,
      $.for_statement,
    ),

    package_declaration: $ => seq('package', $.identifier),
    
    import_declaration: $ => seq('import', $.string),

    variable_declaration: $ => seq(
      'var',
      $.identifier,
      optional($.simple_type),
      optional(seq('=', $.expression))
    ),

    function_declaration: $ => seq(
      'function',
      $.identifier,
      '(', optional(commaSep($.parameter)), ')',
      optional($.simple_type),
      $.block
    ),

    parameter: $ => seq($.identifier, optional($.simple_type)),

    block: $ => prec(2, seq('{', repeat($.statement), '}')),

    // Disambiguate: a bare `return` must be followed by a semicolon.
    // With an expression, semicolon is optional.
    return_statement: $ => choice(
      seq('return', $.expression, optional($.semi)),
      seq('return', $.semi)
    ),

    if_statement: $ => seq(
      'if', $.expression, $.block,
      optional(seq('else', $.block))
    ),

    for_statement: $ => seq(
      'for', $.identifier, 'in', $.expression, $.block
    ),

    expression_statement: $ => seq($.expression, $.semi),

    // ----------------------
    // Types (simplified)
    // ----------------------
    simple_type: $ => choice('int', 'string', 'bool', 'float64', 'any'),

    // ----------------------
    // Expressions (simplified)
    // ----------------------
    expression: $ => choice(
      $.literal,
      $.identifier,
      $.binary_expression,
      $.call_expression,
      $.member_expression,
      $.index_expression,
      $.array_literal,
      $.map_literal,
      $.parenthesized_expression,
    ),

    literal: $ => choice($.number, $.string, $.boolean, $.none),
    boolean: _ => choice('true', 'false'),
    none: _ => 'None',

    parenthesized_expression: $ => seq('(', $.expression, ')'),

    binary_expression: $ => prec.left(1, seq(
      $.expression,
      choice('+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', 'and', 'or', '='),
      $.expression
    )),

    call_expression: $ => prec.left(2, seq(
      $.expression,
      '(', optional(commaSep($.expression)), ')'
    )),

    member_expression: $ => prec.left(3, seq($.expression, '.', $.identifier)),

    index_expression: $ => prec.left(3, seq($.expression, '[', $.expression, ']')),

    array_literal: $ => seq('[', optional(commaSep($.expression)), ']'),

    map_literal: $ => seq('{', optional(commaSep($.map_pair)), '}'),

    map_pair: $ => seq($.expression, ':', $.expression),
    
    // Punctuation
    semi: _ => token(/;+/),
  },
});

function commaSep(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
