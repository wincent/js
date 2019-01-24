PACKAGES := $(wildcard packages/*)

all: $(PACKAGES)
$(PACKAGES):
	babel --root-mode upward --source-root $@/src --ignore '**/__tests__/**/*' --relative -d ../lib --extensions .js,.ts $@/src
	env BABEL_ENV=es babel --keep-file-extension --root-mode upward --source-root $@/src --ignore '**/__tests__/**/*' --relative -d ../lib --extensions .js,.ts $@/src
	find $@/lib -name '*.ts' -exec sh -c 'mv -f "$$0" "$${0%.ts}.mjs"' {} \;

.PHONY: all $(PACKAGES)
