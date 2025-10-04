package tree_sitter_harneet_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_harneet "github.com/tree-sitter/tree-sitter-harneet/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_harneet.Language())
	if language == nil {
		t.Errorf("Error loading Harneet grammar")
	}
}
