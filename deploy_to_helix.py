#!/usr/bin/env python3
"""
Deploy tree-sitter-harneet grammar to Helix editor.

This script:
1. Regenerates the tree-sitter parser from grammar.js
2. Builds the shared library (.so/.dylib)
3. Copies the grammar and query files to your Helix fork

Usage:
    python deploy_to_helix.py [helix_path]
    
If helix_path is not provided, you will be prompted to enter it.
The path is saved to .helix_path for future runs.
"""

import sys
import shutil
import subprocess
from pathlib import Path

# ANSI colors for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_step(msg: str) -> None:
    print(f"{Colors.BLUE}{Colors.BOLD}==>{Colors.END} {msg}")

def print_success(msg: str) -> None:
    print(f"{Colors.GREEN}✓{Colors.END} {msg}")

def print_warning(msg: str) -> None:
    print(f"{Colors.YELLOW}⚠{Colors.END} {msg}")

def print_error(msg: str) -> None:
    print(f"{Colors.RED}✗{Colors.END} {msg}")

def run_command(cmd: list[str], cwd: Path, description: str) -> bool:
    """Run a command and return True if successful."""
    print_step(description)
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print_error(f"Command failed: {' '.join(cmd)}")
            if result.stderr:
                print(f"  stderr: {result.stderr.strip()}")
            if result.stdout:
                print(f"  stdout: {result.stdout.strip()}")
            return False
        print_success(description)
        return True
    except FileNotFoundError:
        print_error(f"Command not found: {cmd[0]}")
        return False

def get_script_dir() -> Path:
    """Get the directory where this script is located."""
    return Path(__file__).parent.resolve()

def get_helix_path_file() -> Path:
    """Get the path to the saved helix path file."""
    return get_script_dir() / ".helix_path"

def load_saved_helix_path() -> str | None:
    """Load previously saved Helix path."""
    path_file = get_helix_path_file()
    if path_file.exists():
        return path_file.read_text().strip()
    return None

def save_helix_path(path: str) -> None:
    """Save Helix path for future runs."""
    path_file = get_helix_path_file()
    path_file.write_text(path)
    print_success(f"Saved Helix path to {path_file}")

def get_helix_path(cli_arg: str | None = None) -> Path | None:
    """Get the Helix fork path from CLI arg, saved file, or user input."""
    # Priority 1: CLI argument
    if cli_arg:
        helix_path = Path(cli_arg).expanduser().resolve()
        if validate_helix_path(helix_path):
            save_helix_path(str(helix_path))
            return helix_path
        return None
    
    # Priority 2: Saved path
    saved_path = load_saved_helix_path()
    if saved_path:
        helix_path = Path(saved_path).expanduser().resolve()
        if helix_path.exists():
            print(f"Using saved Helix path: {Colors.BOLD}{helix_path}{Colors.END}")
            use_saved = input("Use this path? [Y/n]: ").strip().lower()
            if use_saved in ('', 'y', 'yes'):
                if validate_helix_path(helix_path):
                    return helix_path
    
    # Priority 3: User input
    print("\nPlease enter the path to your Helix fork:")
    print("(e.g., /Users/username/sandbox/helix or ~/sandbox/helix)")
    user_input = input("> ").strip()
    
    if not user_input:
        print_error("No path provided. Please provide a valid Helix fork path.")
        sys.exit(1)
    
    helix_path = Path(user_input).expanduser().resolve()
    if validate_helix_path(helix_path):
        save_helix_path(str(helix_path))
        return helix_path
    
    return None

def validate_helix_path(helix_path: Path) -> bool:
    """Validate that the path is a valid Helix repository."""
    if not helix_path.exists():
        print_error(f"Path does not exist: {helix_path}")
        return False
    
    # Check for expected Helix structure
    runtime_dir = helix_path / "runtime"
    languages_toml = helix_path / "languages.toml"
    
    if not runtime_dir.exists():
        print_error(f"Not a valid Helix repo: missing 'runtime' directory")
        return False
    
    if not languages_toml.exists():
        print_error(f"Not a valid Helix repo: missing 'languages.toml'")
        return False
    
    print_success(f"Valid Helix repository: {helix_path}")
    return True

def clean_build_artifacts(tree_sitter_dir: Path) -> None:
    """Remove old build artifacts to force a fresh build."""
    print_step("Cleaning old build artifacts...")
    
    artifacts = [
        tree_sitter_dir / "harneet.so",
        tree_sitter_dir / "harneet.dylib",
        tree_sitter_dir / "src" / "parser.c",
        tree_sitter_dir / "src" / "grammar.json",
    ]
    
    for artifact in artifacts:
        if artifact.exists():
            artifact.unlink()
            print(f"  Removed: {artifact.name}")
    
    print_success("Cleaned build artifacts")

def generate_parser(tree_sitter_dir: Path) -> bool:
    """Generate parser from grammar.js."""
    return run_command(
        ["tree-sitter", "generate"],
        tree_sitter_dir,
        "Generating parser from grammar.js"
    )

def build_grammar(tree_sitter_dir: Path) -> bool:
    """Build the shared library."""
    return run_command(
        ["tree-sitter", "build"],
        tree_sitter_dir,
        "Building shared library"
    )

def find_grammar_library(tree_sitter_dir: Path) -> Path | None:
    """Find the built grammar library (.so or .dylib)."""
    for ext in [".so", ".dylib"]:
        lib_path = tree_sitter_dir / f"harneet{ext}"
        if lib_path.exists():
            return lib_path
    return None

def copy_grammar_to_helix(tree_sitter_dir: Path, helix_path: Path) -> bool:
    """Copy the grammar library to Helix runtime."""
    print_step("Copying grammar library to Helix...")
    
    grammar_lib = find_grammar_library(tree_sitter_dir)
    if not grammar_lib:
        print_error("Could not find built grammar library (harneet.so or harneet.dylib)")
        return False
    
    dest_dir = helix_path / "runtime" / "grammars"
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    # Always copy as .so for Helix compatibility
    dest_path = dest_dir / "harneet.so"
    
    shutil.copy2(grammar_lib, dest_path)
    print_success(f"Copied {grammar_lib.name} -> {dest_path}")
    return True

def copy_queries_to_helix(tree_sitter_dir: Path, helix_path: Path) -> bool:
    """Copy query files to Helix runtime."""
    print_step("Copying query files to Helix...")
    
    queries_src = tree_sitter_dir / "queries"
    queries_dest = helix_path / "runtime" / "queries" / "harneet"
    
    if not queries_src.exists():
        print_error(f"Queries directory not found: {queries_src}")
        return False
    
    queries_dest.mkdir(parents=True, exist_ok=True)
    
    query_files = list(queries_src.glob("*.scm"))
    if not query_files:
        print_warning("No .scm query files found")
        return True
    
    for query_file in query_files:
        dest_file = queries_dest / query_file.name
        shutil.copy2(query_file, dest_file)
        print(f"  Copied: {query_file.name}")
    
    print_success(f"Copied {len(query_files)} query files")
    return True

def check_helix_languages_config(helix_path: Path) -> None:
    """Check if Harneet is configured in languages.toml."""
    languages_toml = helix_path / "languages.toml"
    
    try:
        content = languages_toml.read_text()
        if 'name = "harneet"' in content:
            print_success("Harneet language is configured in languages.toml")
        else:
            print_warning("Harneet language not found in languages.toml")
            print("  You may need to add the language configuration manually.")
            print("  See: https://docs.helix-editor.com/languages.html")
    except Exception as e:
        print_warning(f"Could not check languages.toml: {e}")

def main() -> int:
    print(f"\n{Colors.BOLD}=== Tree-sitter-harneet Helix Deployer ==={Colors.END}\n")
    
    # Get the tree-sitter-harneet directory (where this script lives)
    tree_sitter_dir = get_script_dir()
    print(f"Tree-sitter directory: {Colors.BOLD}{tree_sitter_dir}{Colors.END}")
    
    # Verify grammar.js exists
    grammar_js = tree_sitter_dir / "grammar.js"
    if not grammar_js.exists():
        print_error(f"grammar.js not found in {tree_sitter_dir}")
        return 1
    
    # Get Helix path
    cli_arg = sys.argv[1] if len(sys.argv) > 1 else None
    helix_path = get_helix_path(cli_arg)
    
    if not helix_path:
        print_error("Could not determine Helix path. Aborting.")
        return 1
    
    print(f"\nHelix fork path: {Colors.BOLD}{helix_path}{Colors.END}\n")
    
    # Step 1: Clean old artifacts
    clean_build_artifacts(tree_sitter_dir)
    
    # Step 2: Generate parser
    if not generate_parser(tree_sitter_dir):
        print_error("Failed to generate parser")
        return 1
    
    # Step 3: Build grammar
    if not build_grammar(tree_sitter_dir):
        print_error("Failed to build grammar")
        return 1
    
    # Step 4: Copy grammar to Helix
    if not copy_grammar_to_helix(tree_sitter_dir, helix_path):
        print_error("Failed to copy grammar")
        return 1
    
    # Step 5: Copy queries to Helix
    if not copy_queries_to_helix(tree_sitter_dir, helix_path):
        print_error("Failed to copy queries")
        return 1
    
    # Step 6: Check configuration
    print()
    check_helix_languages_config(helix_path)
    
    # Done!
    print(f"\n{Colors.GREEN}{Colors.BOLD}✓ Deployment complete!{Colors.END}")
    print(f"\nRestart Helix to apply the changes.")
    print(f"If running a dev build, you may need to rebuild with: {Colors.BOLD}cargo build --release{Colors.END}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
