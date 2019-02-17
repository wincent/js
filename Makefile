PACKAGES := $(wildcard packages/*)

ifdef YARN_WRAP_OUTPUT
	# Already running inside yarn context.
	TSC := tsc
	BABEL := babel
else
	TSC := yarn tsc
	BABEL := yarn babel
endif

all: $(PACKAGES) declarations

clean:
	rm -rf packages/*/lib/*

declarations:
	$(TSC) --emitDeclarationOnly --declaration --project tsconfig-declaration.json
	find packages -path 'packages/*/src/*' -and -name '*.d.ts' -and -not -path '*/node_modules/*' -exec bash -c 'mv "$$0" "$${0/\/src\///lib//}"' {} \;

$(PACKAGES):
	env BABEL_ENV=production $(BABEL) --root-mode upward --source-root $@/src --ignore '**/__tests__/**/*' --relative -d ../lib --extensions .js,.ts $@/src
	env BABEL_ENV=es $(BABEL) --keep-file-extension --root-mode upward --source-root $@/src --ignore '**/__tests__/**/*' --relative -d ../lib --extensions .js,.ts $@/src
	find $@/lib -name '*.ts' -not -name '*.d.ts' -exec sh -c 'mv -f "$$0" "$${0%.ts}.mjs"' {} \;
	find $@/src -name '*.js.flow' -exec bash -c 'cp "$$0" "$${0/\/src\///lib//}"' {} \;

.PHONY: all clean declarations $(PACKAGES)
