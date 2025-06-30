export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

// Clear Pervious alert -- show alert for 5s only
export const showAlert = (type, message) => {
  hideAlert();
  const alert = `<div class="alert alert--${type}">${message}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', alert);
  window.setTimeout(hideAlert, 5000);
};
