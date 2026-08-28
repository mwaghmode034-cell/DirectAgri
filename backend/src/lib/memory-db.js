import { ObjectId } from "mongodb";

function asId(value) {
  return value == null ? value : String(value);
}

function equals(left, right) {
  if (left instanceof ObjectId || right instanceof ObjectId) return asId(left) === asId(right);
  if (left == null && right == null) return true;
  return left === right;
}

function isOperator(value) {
  return Boolean(value) && typeof value === "object" && !(value instanceof ObjectId) && !Array.isArray(value) && value.constructor === Object;
}

function match(document, query = {}) {
  return Object.entries(query).every(([key, expected]) => {
    const actual = document[key];
    if (isOperator(expected)) {
      if ("$ne" in expected) return !equals(actual, expected.$ne);
      if ("$in" in expected) return expected.$in.some((item) => equals(actual, item));
      return false;
    }
    return equals(actual, expected);
  });
}

function sortDocuments(documents, sort) {
  if (!sort) return [...documents];
  const entries = Object.entries(sort);
  return [...documents].sort((left, right) => {
    for (const [key, direction] of entries) {
      if (left[key] === right[key]) continue;
      if (left[key] == null) return 1;
      if (right[key] == null) return -1;
      return left[key] > right[key] ? direction : -direction;
    }
    return 0;
  });
}

class MemoryCursor {
  constructor(documents) {
    this.documents = documents;
  }

  sort(sort) {
    this.documents = sortDocuments(this.documents, sort);
    return this;
  }

  limit(count) {
    this.documents = this.documents.slice(0, count);
    return this;
  }

  async toArray() {
    return this.documents.map((document) => ({ ...document }));
  }
}

class MemoryCollection {
  constructor() {
    this.documents = [];
  }

  find(query = {}) {
    return new MemoryCursor(this.documents.filter((document) => match(document, query)).map((document) => ({ ...document })));
  }

  async findOne(query = {}) {
    const document = this.documents.find((item) => match(item, query));
    return document ? { ...document } : null;
  }

  async insertOne(document) {
    const saved = { ...document, _id: document._id ?? new ObjectId() };
    this.documents.push(saved);
    return { insertedId: saved._id };
  }

  async insertMany(documents) {
    const insertedIds = [];
    for (const document of documents) {
      const saved = { ...document, _id: document._id ?? new ObjectId() };
      this.documents.push(saved);
      insertedIds.push(saved._id);
    }
    return { insertedIds };
  }

  async findOneAndUpdate(query, update, options = {}) {
    const matches = sortDocuments(
      this.documents.filter((document) => match(document, query)),
      options.sort
    );
    const current = matches[0];
    if (!current) return null;
    const index = this.documents.findIndex((document) => asId(document._id) === asId(current._id));
    const next = { ...this.documents[index], ...(update.$set ?? {}) };
    this.documents[index] = next;
    return options.returnDocument === "before" ? { ...current } : { ...next };
  }

  async countDocuments(query = {}) {
    return this.documents.filter((document) => match(document, query)).length;
  }

  async distinct(field) {
    return [...new Set(this.documents.map((document) => document[field]).filter((value) => value != null && value !== ""))];
  }

  async createIndex() {
    return "memory-index";
  }
}

export class MemoryDatabase {
  constructor() {
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) this.collections.set(name, new MemoryCollection());
    return this.collections.get(name);
  }
}
