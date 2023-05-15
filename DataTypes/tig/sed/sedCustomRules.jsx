export const customRules = {
  isAllowToUpload: (state) =>
    (Number(state?.customViewAttributes?.years?.length) || 0) > 6 ? (
      "canUpload"
    ) : (
      <div className="bg-red-500 mt-2 p-3">
        <span> Please enter minimum 7 values </span>
      </div>
    ),
  isYearsValidate: (state) => {
    const years = state?.customViewAttributes?.years || [];
    const uniqueYears = new Set(years);
    return uniqueYears.size === years.length ? (
      "canUpload"
    ) : (
      <div className="bg-red-500 mt-2 p-3">
        <span> All years are not different </span>
      </div>
    );
  },
};
