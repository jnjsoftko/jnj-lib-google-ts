#!/bin/bash

# [syntax] ./publish.sh patch|minor|major
# default: patch

mode=${1:-patch}

yarn build && npm version $mode && npm publish