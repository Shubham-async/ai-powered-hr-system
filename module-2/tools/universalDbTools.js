import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Helper to eagerly import all models so mongoose knows about them
export const initializeAllModels = async () => {
    const modelsPath = path.resolve(process.cwd(), 'models');
    
    // Import root models
    const files = fs.readdirSync(modelsPath);
    for (const file of files) {
        if (file.endsWith('.js')) {
            try { await import(`file://${path.join(modelsPath, file)}`); } 
            catch(e) { console.error("Failed to load model:", file, e.message); }
        }
    }
};

export const databaseQuery = async (modelName, filterStr, limit = 10) => {
    try {
        const Model = mongoose.model(modelName);
        if (!Model) return `Model ${modelName} not found.`;
        
        let filter = {};
        if (filterStr && filterStr !== '{}' && filterStr !== '""') {
            filter = typeof filterStr === 'string' ? JSON.parse(filterStr) : filterStr;
        }

        const queryLimit = typeof limit === 'number' ? limit : 10;
        const results = await Model.find(filter).limit(queryLimit).lean();
        return JSON.stringify(results);
    } catch (e) {
        return `DB Query Error on ${modelName}: ${e.message}`;
    }
};

export const databaseAggregation = async (modelName, pipelineStr) => {
    try {
        const Model = mongoose.model(modelName);
        if (!Model) return `Model ${modelName} not found.`;
        
        let pipeline = typeof pipelineStr === 'string' ? JSON.parse(pipelineStr) : pipelineStr;

        const results = await Model.aggregate(pipeline);
        return JSON.stringify(results);
    } catch (e) {
        return `DB Aggregation Error on ${modelName}: ${e.message}`;
    }
};

export const executeUniversalUpdate = async (modelName, id, updateDataStr) => {
    try {
        const Model = mongoose.model(modelName);
        if (!Model) return `Model ${modelName} not found.`;
        
        let updateData = typeof updateDataStr === 'string' ? JSON.parse(updateDataStr) : updateDataStr;

        const result = await Model.findByIdAndUpdate(id, updateData, { new: true });
        return JSON.stringify(result);
    } catch (e) {
        return `DB Update Error on ${modelName}: ${e.message}`;
    }
};

export const executeUniversalDelete = async (modelName, id) => {
    try {
        const Model = mongoose.model(modelName);
        if (!Model) return `Model ${modelName} not found.`;
        
        const result = await Model.findByIdAndDelete(id);
        return JSON.stringify(result);
    } catch (e) {
        return `DB Delete Error on ${modelName}: ${e.message}`;
    }
};

export const listAvailableModels = () => {
    return mongoose.modelNames();
};
