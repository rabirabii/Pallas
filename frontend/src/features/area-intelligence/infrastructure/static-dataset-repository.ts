import { promises as fs } from "node:fs";
import path from "node:path";

import {
  areaDatasetSchema,
  datasetManifestSchema,
  type AreaDataset,
  type DatasetManifest,
} from "../domain/contracts";

const dataDirectory = path.join(process.cwd(), "public", "data");

async function readJsonFile(filePath: string): Promise<unknown> {
  const text = await fs.readFile(filePath, "utf-8");
  return JSON.parse(text);
}

export async function loadAreaManifest(): Promise<DatasetManifest> {
  const payload = await readJsonFile(path.join(dataDirectory, "manifest.json"));
  return datasetManifestSchema.parse(payload);
}

export async function loadAreaDataset(
  slug: string,
): Promise<AreaDataset | null> {
  const manifest = await loadAreaManifest();
  const areaExists = manifest.areas.some((area) => area.slug === slug);

  if (!areaExists) {
    return null;
  }

  const payload = await readJsonFile(
    path.join(dataDirectory, "areas", `${slug}.json`),
  );

  return areaDatasetSchema.parse(payload);
}
