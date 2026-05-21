function parseJsonbBool(val) {
  if (val === true || val === false) return val;
  if (typeof val === 'string') return val === 'true' || val === '"true"';
  if (val && typeof val === 'object' && 'enabled' in val) return !!val.enabled;
  return false;
}

module.exports = { parseJsonbBool };
