import shortListedCandidatesForJD, { processAppliedCandidatesForJD } from '../services/aiResumeShortListService.js';

/**
 * ⚡ REDIS-FREE IN-MEMORY TRIGGER
 * Replaces Bull Queue to avoid external Redis dependencies.
 * Processes extraction and shortlisting directly in-process.
 */
const resumeQueue = {
  add: async (taskName, data) => {
    console.log(`[Queue Mock] Triggering task: ${taskName} for JD: ${data.jdId}`);
    
    // Execute logic asynchronously without blocking the request, but without Redis
    (async () => {
      try {
        if (taskName === 'resumeShortlistQueue') {
          const result = await shortListedCandidatesForJD(data.jdId);
          console.log(`✅ Resume shortlisting completed: ${result.message}`);
        } else if (taskName === 'resumeExtractQueue') {
          const result = await processAppliedCandidatesForJD(data.jdId);
          console.log(`✅ Resume extraction completed: ${result.message}`);
        }
      } catch (error) {
        console.error(`❌ Task ${taskName} failed:`, error.message);
      }
    })();

    return { id: `mock_${Date.now()}` }; 
  }
};

export default resumeQueue;
