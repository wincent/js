PACKAGES := $(wildcard packages/*)

all: $(PACKAGES) declarations

declarations:
	tsc --emitDeclarationOnly --declaration --project tsconfig-declaration.json
	find packages -path 'packages/*/src/*' -and -name '*.d.ts' -and -not -path '*/node_modules/*' -exec bash -c 'mv "$$0" "$${0/\/src\///lib//}"' {} \;

$(PACKAGES):
	babel --root-mode upward --source-root $@/src --ignore '**/__tests__/**/*' --relative -d ../lib --extensions .js,.ts $@/src
	env BABEL_ENV=es babel --keep-file-extension --root-mode upward --source-root $@/src --ignore '**/__tests__/**/*' --relative -d ../lib --extensions .js,.ts $@/src
	find $@/lib -name '*.ts' -exec sh -c 'mv -f "$$0" "$${0%.ts}.mjs"' {} \;
	find $@/src -name '*.js.flow' -exec bash -c 'cp "$$0" "$${0/\/src\///lib//}"' {} \;

.PHONY: all clean declarations $(PACKAGES)
