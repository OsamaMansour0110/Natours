export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

// Clear Pervious alert -- show alert for 5s only
export const showAlert = (type, message, time) => {
  hideAlert();
  const alert = `<div class="alert alert--${type}">${message}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', alert);
  window.setTimeout(hideAlert, time * 1000);
};
