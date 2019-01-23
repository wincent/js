PACKAGES := $(wildcard packages/*)

all: $(PACKAGES)
$(PACKAGES):
	babel --root-mode upward --source-root $@/src --ignore '**/__tests__/**/*' --relative -d ../lib $@/src
	env BABEL_ENV=es babel --keep-file-extension --root-mode upward --source-root $@/src --ignore '**/__tests__/**/*' --relative -d ../lib $@/src

.PHONY: all $(PACKAGES)
