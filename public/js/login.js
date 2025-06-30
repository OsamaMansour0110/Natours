import axios from 'axios';
import { showAlert } from './alerts.js';

export const login = async (email, password) => {
  try {
    // It's response comming from postman 'sending request on url'
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password
      }
    });

    // If It's successful -> send the user to home page
    if (res.data.status === 'success') {
      showAlert('success', 'logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    });
    if (res.data.status === 'success') location.reload(true);
  } catch (error) {
    showAlert('error', 'Logged out Failed');
  }
};
