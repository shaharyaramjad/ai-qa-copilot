import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import base from './playwright.config';

// BDD suite: Gherkin .feature files in features/, step definitions in steps/.
// playwright-bdd turns each scenario into a normal Playwright test in .features-gen/.
// Same browser settings as the main suite (baseURL, data-test attribute), separate report.
const testDir = defineBddConfig({
  features: 'features/*.feature',
  steps: 'steps/*.ts',
  outputDir: '.features-gen',
});

export default defineConfig(base, {
  testDir,
  reporter: [['html', { outputFolder: 'playwright-report-bdd', open: 'never' }], ['list']],
});
