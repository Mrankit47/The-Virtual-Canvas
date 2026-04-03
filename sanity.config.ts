import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schema } from './src/sanity/schemaTypes';
import { dataset, projectId } from './src/sanity/env';
import { deskStructure } from './src/sanity/deskStructure';

export default defineConfig({
  basePath: '/studio',
  projectId: projectId,
  dataset: dataset,
  title: 'The Virtual Canvas',
  schema,
  plugins: [
    structureTool({
      structure: deskStructure,
    }),
    visionTool({ defaultApiVersion: '2024-03-22' }),
  ],
});
