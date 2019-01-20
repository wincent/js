PACKAGES := $(wildcard packages/*)

all: $(PACKAGES)
$(PACKAGES):
	babel --config-file ./.babelrc --source-root $@/src --relative -d ../lib $@/src

.PHONY: all $(PACKAGES)
