const cropBatchUpdatePermissions = {
  farmer: ["cropType", "crop", "quantityKg", "pricePerKg", "status", "storageId"],
  buyer: [],
  transporter: ["status"],
  storage: ["status", "storageId", "quality"],
  government: []
};

export function assertCanUpdate(role, fields) {
  const allowed = cropBatchUpdatePermissions[String(role ?? "").toLowerCase()] ?? [];
  const blocked = fields.filter((field) => !allowed.includes(field));

  if (blocked.length) {
    const error = new Error(`${role} cannot update: ${blocked.join(", ")}`);
    error.status = 403;
    error.blockedFields = blocked;
    throw error;
  }
}
