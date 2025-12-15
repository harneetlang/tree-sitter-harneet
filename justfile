install_tree_sitter:
    npm install -g tree-sitter

generate:
    tree-sitter generate

validate:
    tree-sitter parse samples/example.ha


wasm:
    tree-sitter build-wasm

deploy:
    python3 deploy_to_helix.py
