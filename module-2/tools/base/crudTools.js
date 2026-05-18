
// Generic CRUD Engine

export const createRecord = async (Model, data) => {
  if(typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (err) {
      throw new Error("Invalid JSON string provided for record creation.");
    }
  }
  return await Model.create(data);
};

export const getById = async (Model, id, populate = []) => {
  let query = Model.findById(id);
  populate.forEach(p => query = query.populate(p));
  return await query;
};

export const findRecords = async (Model, filter = {}, options = {}) => {
  let query = Model.find(filter);

  if (options.populate) {
    options.populate.forEach(p => {
      query = query.populate(p);
    });
  }

  if (options.limit) query = query.limit(options.limit);
  if (options.sort) query = query.sort(options.sort);
  if (options.skip) query = query.skip(options.skip);

  return await query;
};

export const updateRecord = async (Model, id, data) => {
  return await Model.findByIdAndUpdate(id, data, { new: true });
};

export const deleteRecord = async (Model, id) => {
  return await Model.findByIdAndDelete(id);
};

export const searchRecords = async (Model, fields, keyword) => {
  const regex = new RegExp(keyword, "i");
  return await Model.find({
    $or: fields.map(f => ({ [f]: regex }))
  });
};

export const countRecords = async (Model, filter = {}) => {
  return await Model.countDocuments(filter);
};