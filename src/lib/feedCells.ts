/**
 * Shared "empty cell" predicate for feed schedule amounts.
 *
 * Rule: a cell is **empty** only when it is `null`, `undefined`, or `NaN`.
 * `0` is a valid value and must NOT be treated as empty — growers explicitly
 * use 0 to indicate "no nutrient at this stage" while the row still belongs
 * to the schedule.
 */
export const isEmptyCell = (v: number | undefined | null): boolean =>
  v == null || Number.isNaN(v as number);