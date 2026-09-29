// public/llms.txt is the curated AI index (scripts/build-page-index.mjs renders
// it from site.official and site.llms in data/pages.json). These pin the two
// promises it makes: it names the official domain and $THREE mint, and it stays
// short enough for an agent to read whole, with every curated link a real page.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const data = JSON.parse(readFileSync(resolve(root, 'data/pages.json'), 'utf8'));
const llms = readFileSync(resolve(root, 'public/llms.txt'), 'utf8');
const full = readFileSync(resolve(root, 'public/llms-full.txt'), 'utf8');
const pages = new Map(data.sections.flatMap((s) => s.pages).map((p) => [p.path, p]));
const THREE_MINT = 'FeMbDoX7R1Psc4GEcvJdsbNbZA3bfztcyDCatJVJpump';

describe('llms.txt', () => {
	it('declares the official $THREE mint in data/pages.json', () => {
		expect(data.site.official.token.mint).toBe(THREE_MINT);
	});

	it('states the official domain and mint in both indexes', () => {
		for (const text of [llms, full]) {
			expect(text).toContain('## Official');
			expect(text).toContain(data.site.official.notice);
			expect(text).toContain(THREE_MINT);
		}
	});

	it('lists only real, indexable pages in its curated sections', () => {
		for (const group of data.site.llms) {
			for (const path of group.paths) {
				const page = pages.get(path);
				expect(page, `${path} in site.llms "${group.title}"`).toBeTruthy();
				expect(page.indexable, `${path} is not indexable`).not.toBe(false);
				expect(llms).toContain(`](${data.site.url}${path}): `);
			}
		}
	});

	it('stays curated: short enough for an agent to read whole', () => {
		expect(Buffer.byteLength(llms)).toBeLessThan(40_000);
		expect(llms).toContain(`${data.site.url}/llms-full.txt`);
	});
});
