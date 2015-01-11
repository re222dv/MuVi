#!/bin/bash

# Make sure we execute from our current path
cd `dirname $(realpath $0)`

# Get deps
cd ../server
npm install

cd ../client
npm install
bower install

# Build
grunt build

# Cache burst
HASH=`md5sum dist/elements/elements.vulcanized.html | awk '{print $1;}'`

mv "dist/elements/elements.vulcanized.html" "dist/elements/elements.${HASH}.html"
sed -i "s/elements\.vulcanized\.html/elements\.${HASH}\.html/" dist/index.html
sed -i "s/elements\.vulcanized\.html/elements\.${HASH}\.html/" dist/cache.appcache

HASH=`md5sum dist/cache.appcache | awk '{print $1;}'`

mv "dist/cache.appcache" "dist/${HASH}.appcache"
sed -i "s/cache\.appcache/${HASH}\.appcache/" dist/index.html

# Copy images (Grunt destroys them)
cp app/*.png dist/
cp app/*.ico dist/
