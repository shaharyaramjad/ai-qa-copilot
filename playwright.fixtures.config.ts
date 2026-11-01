import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Same settings as the main config, but runs the planted examples in fixtures/ (used by npm run flaky / hunt).
export default defineConfig({ ...base, testDir: './fixtures' });
