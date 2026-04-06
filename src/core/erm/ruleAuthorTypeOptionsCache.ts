import type { ErmRepo } from '@/core/repositories/ermRepo';
import type { RuleListParams } from '@/core/repositories/ermRepo';

/** همان پارامتری که برای دراپ‌داون‌ها (فیلتر، مودال قانون) استفاده می‌شود */
export const DROPDOWN_LIST_PARAMS: RuleListParams = {
  page: 1,
  limit: 500,
  api_version: 8,
};

let authorInflight: Promise<unknown> | null = null;
let authorCache: unknown | null = null;

let typeInflight: Promise<unknown> | null = null;
let typeCache: unknown | null = null;

let categoryInflight: Promise<unknown> | null = null;
let categoryCache: unknown | null = null;

export async function fetchRuleAuthorListCached(ermRepo: ErmRepo): Promise<unknown> {
  if (authorCache !== null) return authorCache;
  if (!authorInflight) {
    authorInflight = ermRepo
      .ruleAuthorList({ ...DROPDOWN_LIST_PARAMS })
      .then((res) => {
        authorCache = res;
        return res;
      })
      .finally(() => {
        authorInflight = null;
      });
  }
  return authorInflight;
}

export async function fetchRuleTypeListCached(ermRepo: ErmRepo): Promise<unknown> {
  if (typeCache !== null) return typeCache;
  if (!typeInflight) {
    typeInflight = ermRepo
      .ruleTypeList({ ...DROPDOWN_LIST_PARAMS })
      .then((res) => {
        typeCache = res;
        return res;
      })
      .finally(() => {
        typeInflight = null;
      });
  }
  return typeInflight;
}

/** `POST erm/rule/category/list` — یک بار در نشست پنل؛ درخواست‌های هم‌زمان به همان Promise وصل می‌شوند */
export async function fetchRuleCategoryListCached(ermRepo: ErmRepo): Promise<unknown> {
  if (categoryCache !== null) return categoryCache;
  if (!categoryInflight) {
    categoryInflight = ermRepo
      .ruleCategoryList({ ...DROPDOWN_LIST_PARAMS })
      .then((res) => {
        categoryCache = res;
        return res;
      })
      .finally(() => {
        categoryInflight = null;
      });
  }
  return categoryInflight;
}

export function invalidateRuleAuthorOptionsCache(): void {
  authorCache = null;
  authorInflight = null;
}

export function invalidateRuleTypeOptionsCache(): void {
  typeCache = null;
  typeInflight = null;
}

export function invalidateRuleCategoryOptionsCache(): void {
  categoryCache = null;
  categoryInflight = null;
}
