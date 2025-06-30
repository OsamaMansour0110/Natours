import axios from 'axios';
import { showAlert } from './alerts';

// type -> update email,name || password
export const UpdateSettings = async (data, type) => {
  try {
    const url = type === 'password' ? 'updatePassword' : 'updateMe';

    // Access Url -> Run all middlewares are related to our URL
    const res = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:3000/api/v1/users/${url}`,
      data
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Updated Successfully');
      setTimeout(() => location.reload(true), 1000);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
