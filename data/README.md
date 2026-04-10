Place the NYC water sample CSV here by default:

`data/nyc-water-samples.csv`

Optional local enrichment files used by ZIP-based nearest-sample lookup:

- `data/nyc-water-samples.geocoded.json`
- `data/nyc-water-samples.geocoded.overrides.json`
- `data/nyc-zip-centroids.json`

You can also point the backend at a different local file with:

`NYC_WATER_SAMPLES_CSV_PATH=path/to/your-file.csv`

The checked-in geocode JSON is a preprocessing artifact. The API does not geocode
sample locations at request time. To regenerate it, run:

`npm run water:geocode`

Expected source columns:

- `Sample Number`
- `Sample Date`
- `Sample Time`
- `Sample Site`
- `Sample class`
- `Location`
- `Residual Free Chlorine (mg/L)`
- `Turbidity (NTU)`
- `Fluoride (mg/L)`
- `Coliform (Quanti-Tray) (MPN /100mL)`
- `E.coli (Quanti-Tray) (MPN/100mL)`
