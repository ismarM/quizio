import base from './playwright.config';
import { defineConfig } from '@playwright/test';
export default defineConfig({...base, testMatch:'errors.spec.ts', reporter:[['list']], outputDir:'ismar/error-results'});
