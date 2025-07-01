import '@babel/polyfill';
import { login, logout } from './login.js';
import { UpdateSettings } from './updatesettings.js';
// import { display_map } from './mapbox.js';
import { bookTour } from './stripe.js';
import { showAlert } from './alerts.js';

// EVENTS
const mapbox = document.getElementById('map');
const logoutButton = document.querySelector('.nav__el--logout');
const savingPasswordBtn = document.querySelector('.btn--save-password');
const loginForm = document.querySelector('.form--login');
const SaveSettingForm = document.querySelector('.form-user-data');
const SavePasswordForm = document.querySelector('.form-user-settings');
const BookTourBtn = document.getElementById('book-tour');

// FIELDS-Ligin
const email = document.getElementById('email');
const password = document.getElementById('password');

// FIELDS-Update Data
const name = document.getElementById('name');

// FIELDS-Update Password
const CurrentPassword = document.getElementById('password-current');
const NewPassword = document.getElementById('password');
const ConfirmNewPassword = document.getElementById('password-confirm');

// IMAGE-FIELDS
const NewPhoto = document.getElementById('photo');

// Handle error for Page Hasn't map
// if (mapbox) {
//   const locations = JSON.parse(
//     document.getElementById('map').dataset.locations
//   );
//   display_map(locations);
// }

// Handle error for Page Hasn't loginForm
if (loginForm) {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.form').addEventListener('submit', (e) => {
      e.preventDefault();
      login(email.value, password.value);
    });
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', logout);
}

if (SaveSettingForm) {
  SaveSettingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Creating form (name,email,photo) -> pass it to update setting
    const form = new FormData();
    form.append('email', email.value);
    form.append('name', name.value);
    form.append('photo', NewPhoto.files[0]);
    UpdateSettings(form, 'data');
  });
}

if (SavePasswordForm) {
  SavePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    savingPasswordBtn.textContent = 'Updating...';
    await UpdateSettings(
      {
        passwordCurrent: CurrentPassword.value,
        password: NewPassword.value,
        passwordConfirm: ConfirmNewPassword.value
      },
      'password'
    );
    // Clear pasword fields, change btn Content
    savingPasswordBtn.textContent = 'save password';
    CurrentPassword.value = '';
    NewPassword.value = '';
    ConfirmNewPassword.value = '';
  });
}

// BOOKING button
if (BookTourBtn)
  BookTourBtn.addEventListener('click', (e) => {
    e.target.textContent = 'processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
    setTimeout(() => {
      e.target.textContent = 'book tour now!';
    }, 1500);
  });

const alertMessage = document.querySelector('body').dataset.alert;
if (alert) showAlert('success', alertMessage, 10);
