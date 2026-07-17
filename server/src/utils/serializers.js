const mapId = (document) => {
  if (!document) return document;
  const value = document.toObject ? document.toObject() : { ...document };
  value.id = String(value._id || value.id);
  delete value._id;
  delete value.__v;
  delete value.passwordHash;
  return value;
};

export const serialize = (value) => Array.isArray(value) ? value.map(serialize) : mapId(value);
