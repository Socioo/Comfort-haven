
import axios from 'axios';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const secret = 'sk_test_your_key_here'; // Replace if you have a real one, but usually it works if it's in the env

async function test() {
  try {
    const response = await axios.get(`${PAYSTACK_BASE_URL}/bank`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY || secret}` },
    });
    console.log(JSON.stringify(response.data.data.slice(0, 5), null, 2));
  } catch (e) {
    console.error(e.message);
  }
}

test();
