import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    // Using published key to connect frontend with backend
    const stripe = await loadStripe(
      'pk_test_51Rezun4GnGF8nSEh3MkUvV6KPjHGTOpRlKmoymggrWEQHUyfwCkD5XkibwtJDO91pkO5tmqQEeWzgwhLVSsjrJU400enx0V8H8'
    );

    // CREATE THE checkout session using our backend API
    const res = await axios({
      method: 'GET',
      url: `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    });

    // SENDING to check out page with session id Came from backend
    await stripe.redirectToCheckout({
      sessionId: res.data.session.id
    });
  } catch (error) {
    showAlert('error', error.message);
  }
};
