BIN=node_modules/.bin
SRC=src/**.ts

.PHONY : all build test setup clean clean-deps

all: setup lint build

build: $(SRC)
	$(BIN)/tsc --project . --pretty --declaration

lint: $(SRC)
	$(BIN)/tslint --project . --format codeFrame

test: lint build test/*_test.ts
	$(BIN)/mocha -r ts-node/register test/*_test.ts

setup: node_modules

node_modules: package.json
	npm --loglevel=warn install

clean:
	rm -rf dist

clean-deps:
	rm -rf node_modules
