import axios from 'axios';
import { showAlert } from './alerts';

// type -> update email,name || password
export const UpdateSettings = async (data, type) => {
  try {
    const url = type === 'password' ? 'updatePassword' : 'updateMe';

    // Access Url -> Run all middlewares are related to our URL
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${url}`,
      data
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Updated Successfully', 5);
      setTimeout(() => location.reload(true), 1000);
    }
  } catch (error) {
    showAlert('error', error.response.data.message, 5);
  }
};
