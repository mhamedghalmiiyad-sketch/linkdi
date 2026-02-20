#!/usr/bin/env bash
# Force Chrome to install inside the project folder so Render doesn't delete it
export PUPPETEER_CACHE_DIR=/opt/render/project/src/.cache
npm install
npx puppeteer browsers install chrome
