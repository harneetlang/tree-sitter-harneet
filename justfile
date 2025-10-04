install_tree_sitter:
    npm install -g tree-sitter

generate:
    tree-sitter generate

validate:
    tree-sitter parse samples/example.ha
    
