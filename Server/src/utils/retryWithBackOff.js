export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is503 = err.message?.includes('UNAVAILABLE') || err.message?.includes('503');
      const isLastAttempt = attempt === maxRetries;

      if (!is503 || isLastAttempt) {
        throw err; // not a retryable error, or we've used up our retries
      }

      const delay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s...
      console.log(`Gemini overloaded, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};