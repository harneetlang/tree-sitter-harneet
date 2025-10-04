{
  "targets": [
    {
      "target_name": "tree_sitter_harneet_binding",
      "include_dirs": ["<!(node -e \"require('node-addon-api').include\")"],
      "sources": [
        "src/parser.c"
      ],
      "cflags_c": ["-std=c11"],
      "conditions": [
        ["OS==\"mac\"", { }],
        ["OS==\"linux\"", { }],
        ["OS==\"win\"", { }]
      ]
    }
  ]
}
