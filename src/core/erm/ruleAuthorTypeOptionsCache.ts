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

let lightListInflight: Promise<unknown> | null = null;
let lightListCache: unknown | null = null;

let domainTreeInflight: Promise<unknown> | null = null;
let domainTreeCache: unknown | null = null;

let warrantyListInflight: Promise<unknown> | null = null;
let warrantyListCache: unknown | null = null;

let mandatoryUnitListInflight: Promise<unknown> | null = null;
let mandatoryUnitListCache: unknown | null = null;

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

/** `POST erm/rule/light-list` — لیست سبک `{ id, rule }` برای دراپ‌داون‌ها */
export async function fetchRuleLightListCached(ermRepo: ErmRepo): Promise<unknown> {
  if (lightListCache !== null) return lightListCache;
  if (!lightListInflight) {
    lightListInflight = ermRepo
      .ruleLightList({ ...DROPDOWN_LIST_PARAMS })
      .then((res) => {
        lightListCache = res;
        return res;
      })
      .finally(() => {
        lightListInflight = null;
      });
  }
  return lightListInflight;
}

/** `POST erm/domain/tree` */
export async function fetchDomainTreeCached(ermRepo: ErmRepo): Promise<unknown> {
  if (domainTreeCache !== null) return domainTreeCache;
  if (!domainTreeInflight) {
    domainTreeInflight = ermRepo
      .domainTree({ ...DROPDOWN_LIST_PARAMS })
      .then((res) => {
        domainTreeCache = res;
        return res;
      })
      .finally(() => {
        domainTreeInflight = null;
      });
  }
  return domainTreeInflight;
}

/** `POST erm/warranty/list` */
export async function fetchWarrantyListCached(ermRepo: ErmRepo): Promise<unknown> {
  if (warrantyListCache !== null) return warrantyListCache;
  if (!warrantyListInflight) {
    warrantyListInflight = ermRepo
      .warrantyList({ ...DROPDOWN_LIST_PARAMS })
      .then((res) => {
        warrantyListCache = res;
        return res;
      })
      .finally(() => {
        warrantyListInflight = null;
      });
  }
  return warrantyListInflight;
}

/** `POST erm/mandatory-unit/list` */
export async function fetchMandatoryUnitListCached(ermRepo: ErmRepo): Promise<unknown> {
  if (mandatoryUnitListCache !== null) return mandatoryUnitListCache;
  if (!mandatoryUnitListInflight) {
    mandatoryUnitListInflight = ermRepo
      .mandatoryUnitList({ ...DROPDOWN_LIST_PARAMS })
      .then((res) => {
        mandatoryUnitListCache = res;
        return res;
      })
      .finally(() => {
        mandatoryUnitListInflight = null;
      });
  }
  return mandatoryUnitListInflight;
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

export function invalidateRuleLightListCache(): void {
  lightListCache = null;
  lightListInflight = null;
}

export function invalidateDomainTreeCache(): void {
  domainTreeCache = null;
  domainTreeInflight = null;
}

export function invalidateWarrantyListCache(): void {
  warrantyListCache = null;
  warrantyListInflight = null;
}

export function invalidateMandatoryUnitListCache(): void {
  mandatoryUnitListCache = null;
  mandatoryUnitListInflight = null;
}

/** پس از افزودن/ویرایش/حذف در مدیریت حوزه، نوع تعهد یا واحدهای اجباری — صدا بزنید تا دراپ‌داون‌ها دوباره از API پر شوند */
export function invalidateDomainWarrantyMandatoryCaches(): void {
  invalidateDomainTreeCache();
  invalidateWarrantyListCache();
  invalidateMandatoryUnitListCache();
}
