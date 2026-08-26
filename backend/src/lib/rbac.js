const cropBatchUpdatePermissions = {
  FARMER: ["cropType", "quantityKg", "pricePerKg", "status", "storageId"],
  BUYER: [],
  TRANSPORTER: ["status"],
  STORAGE: ["status", "storageId"],
  GOVERNMENT: []
};

export function assertCanUpdate(role, fields) {
  const allowed = cropBatchUpdatePermissions[role] ?? [];
  const blocked = fields.filter((field) => !allowed.includes(field));

  if (blocked.length) {
    const error = new Error(`${role} cannot update: ${blocked.join(", ")}`);
    error.status = 403;
    error.blockedFields = blocked;
    throw error;
  }
}
