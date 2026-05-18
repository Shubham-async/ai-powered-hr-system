// module-2/utils/taskProgress.js
const tasks = new Map();

export const updateTask = (id, progress, message, status = "processing") => {
  tasks.set(id, {
    progress,
    message,
    status,
    updatedAt: new Date()
  });
  console.log(`[Task ${id}] ${progress}% - ${message}`);
};

export const getTask = (id) => tasks.get(id);

export const clearOldTasks = () => {
    const hourAgo = new Date(Date.now() - 3600000);
    for (const [id, data] of tasks.entries()) {
        if (data.updatedAt < hourAgo) tasks.delete(id);
    }
};
