export function isPolygonFeature(f: GeoJSON.Feature): f is GeoJSON.Feature<GeoJSON.Polygon, GeoJSON.GeoJsonProperties> {
  return f.geometry.type === "Polygon";
}

export function isMultiPointFeature(f: GeoJSON.Feature): f is GeoJSON.Feature<GeoJSON.MultiPoint, GeoJSON.GeoJsonProperties> {
  return f.geometry.type === "MultiPoint";
}