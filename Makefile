PACKAGES := $(wildcard packages/*)

all: $(PACKAGES)
$(PACKAGES):
	babel --source-root $@/src --relative -d ../lib $@/src

.PHONY: all $(PACKAGES)
