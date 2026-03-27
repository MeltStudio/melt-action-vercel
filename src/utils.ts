import * as crypto from 'crypto';

const VERCEL_MAX_ALIAS_LENGTH = 63;
const VERCEL_HASH_LENGTH = 6;

export function slugifyRefName(refName: string): string {
  return refName
    .trim()
    .toLowerCase()
    .replace(/[_./]+/g, '-')
    .replace(/--+/, '-')
    .replace(/[^\w\d-]/, '');
}

export function truncateSlug(slug: string, maxLength: number): string {
  if (slug.length <= maxLength) {
    return slug;
  }

  const hash = crypto
    .createHash('sha256')
    .update(slug)
    .digest('hex')
    .slice(0, VERCEL_HASH_LENGTH);

  return `${slug.slice(0, maxLength - VERCEL_HASH_LENGTH - 1)}-${hash}`;
}

export function buildAliasUrl(
  refName: string,
  projectName: string,
  teamSlug: string,
): string {
  const slug = slugifyRefName(refName);
  // -2 accounts for the dashes separating project-slug-team
  const maxSlugLength =
    VERCEL_MAX_ALIAS_LENGTH - projectName.length - teamSlug.length - 2;
  const truncatedSlug = truncateSlug(slug, maxSlugLength);

  return `${projectName}-${truncatedSlug}-${teamSlug}.vercel.app`;
}
