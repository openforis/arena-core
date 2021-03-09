export interface SRS {
  code: string
  name: string
  wkt: string
}

export const DEFAULT_SRS: SRS = {
  code: '4326',
  name: 'GCS WGS 1984',
  wkt: `
  GEOGCS["WGS 84",
      DATUM["WGS_1984",
          SPHEROID["WGS 84",6378137,298.257223563,
              AUTHORITY["EPSG","7030"]],
          AUTHORITY["EPSG","6326"]],
      PRIMEM["Greenwich",0,
          AUTHORITY["EPSG","8901"]],
      UNIT["degree",0.01745329251994328,
          AUTHORITY["EPSG","9122"]],
      AUTHORITY["EPSG","4326"]]
      `,
}
