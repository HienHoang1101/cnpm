import axios from 'axios';

const run = async () => {
  try {
    const res = await axios.get('http://localhost:5007/health', { timeout: 5000 });
    if (res.status === 200 && res.data && res.data.status === 'ok') {
      console.log('Health check passed');
      process.exit(0);
    }
    console.error('Health check failed: unexpected response', res.status, res.data);
    process.exit(2);
  } catch (err) {
    console.error('Health check failed:', err.message);
    process.exit(1);
  }
};

run();
