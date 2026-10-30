// The DB may store role names as STUDENT or Student; the API always says Student / Operator / Admin.
exports.normalizeRole = (name) =>
  name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : name;
