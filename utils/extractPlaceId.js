function extractPlaceId(url) {
  const match = url.match(
    /\/(?:place|restaurant|hairshop|hospital|clinic|beauty|store)\/(\d+)/
  );
  return match ? match[1] : null;
}
module.exports = { extractPlaceId };
