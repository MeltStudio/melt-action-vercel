import { describe, expect, it } from 'vitest';

import { buildAliasUrl, slugifyRefName, truncateSlug } from './utils.js';

describe('slugifyRefName', () => {
  it('lowercases the ref name', () => {
    expect(slugifyRefName('Feature/MyBranch')).toBe('feature-mybranch');
  });

  it('replaces underscores, dots, and slashes with dashes', () => {
    expect(slugifyRefName('feat_some.branch/name')).toBe(
      'feat-some-branch-name',
    );
  });

  it('collapses consecutive dashes', () => {
    expect(slugifyRefName('feat--double')).toBe('feat-double');
  });

  it('strips non-word, non-digit, non-dash characters', () => {
    expect(slugifyRefName('feat@branch')).toBe('featbranch');
  });

  it('trims whitespace', () => {
    expect(slugifyRefName('  my-branch  ')).toBe('my-branch');
  });

  it('handles a simple branch name unchanged', () => {
    expect(slugifyRefName('my-feature')).toBe('my-feature');
  });
});

describe('truncateSlug', () => {
  it('returns the slug unchanged when under the max length', () => {
    expect(truncateSlug('short', 20)).toBe('short');
  });

  it('returns the slug unchanged when exactly at the max length', () => {
    const slug = 'a'.repeat(20);
    expect(truncateSlug(slug, 20)).toBe(slug);
  });

  it('truncates and appends a 6-char hash when exceeding max length', () => {
    const slug = 'a'.repeat(30);
    const result = truncateSlug(slug, 20);
    // maxLength(20) - hashLength(6) - dash(1) = 13 chars prefix
    expect(result.length).toBe(20);
    expect(result).toMatch(/^a{13}-[0-9a-f]{6}$/);
  });

  it('produces a deterministic hash for the same input', () => {
    const slug = 'feature-very-long-branch-name-that-exceeds-limits';
    const a = truncateSlug(slug, 20);
    const b = truncateSlug(slug, 20);
    expect(a).toBe(b);
  });

  it('produces different hashes for different inputs', () => {
    const a = truncateSlug('a'.repeat(30), 20);
    const b = truncateSlug('b'.repeat(30), 20);
    expect(a).not.toBe(b);
  });
});

describe('buildAliasUrl', () => {
  it('builds a correct alias for a short branch name', () => {
    const alias = buildAliasUrl('my-feature', 'my-app', 'my-team');
    expect(alias).toBe('my-app-my-feature-my-team.vercel.app');
  });

  it('slugifies the ref name in the alias', () => {
    const alias = buildAliasUrl('feature/MY_BRANCH', 'app', 'team');
    expect(alias).toBe('app-feature-my-branch-team.vercel.app');
  });

  it('respects the 63-char alias limit', () => {
    const longBranch = 'a'.repeat(100);
    const alias = buildAliasUrl(longBranch, 'my-app', 'my-team');
    // alias without .vercel.app suffix
    const aliasHost = alias.replace('.vercel.app', '');
    expect(aliasHost.length).toBeLessThanOrEqual(63);
  });

  it('truncates only the slug portion, preserving project and team', () => {
    const longBranch = 'x'.repeat(100);
    const alias = buildAliasUrl(longBranch, 'proj', 'team');
    expect(alias).toMatch(/^proj-.*-team\.vercel\.app$/);
  });
});
