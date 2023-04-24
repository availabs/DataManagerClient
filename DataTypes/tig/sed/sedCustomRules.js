export const customRules = {
  isAllowToUpload: (state) =>
    (Number(state?.customViewAttributes?.years?.length) || 0) > 6 ? 'canUpload' : 'Error Message',
  isYearsValidate: (state) => {
    const years = state?.customViewAttributes?.years || [];
    const uniqueYears = new Set(years);
    return uniqueYears.size === years.length ? 'canUpload' : 'error message';
  },
};
