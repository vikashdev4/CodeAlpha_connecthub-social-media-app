/* =========================================================
   ConnectHub — post.js
   Drives create-post.html: image selection (click or drag &
   drop), live preview, caption character counter, and the
   multipart upload to POST /api/posts/create.
   ========================================================= */

let selectedFile = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initNavbar();

  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const previewWrap = document.getElementById('imagePreviewWrap');
  const previewImg = document.getElementById('imagePreviewImg');
  const removeBtn = document.getElementById('imagePreviewRemove');
  const captionInput = document.getElementById('captionInput');
  const charCounter = document.getElementById('charCounter');
  const form = document.getElementById('createPostForm');
  const submitBtn = document.getElementById('createPostSubmitBtn');

  uploadZone.addEventListener('click', () => fileInput.click());

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be smaller than 5MB', 'error');
      return;
    }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      uploadZone.style.display = 'none';
      previewWrap.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedFile = null;
    fileInput.value = '';
    previewWrap.style.display = 'none';
    uploadZone.style.display = 'block';
  });

  captionInput.addEventListener('input', () => {
    charCounter.textContent = `${captionInput.value.length} / 2200`;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      showToast('Please choose an image to post', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('caption', captionInput.value.trim());

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner spinner-sm" style="border-top-color:#fff;border-right-color:#fff;margin:0;"></span> Sharing...`;

    try {
      await apiRequest('/posts/create', { method: 'POST', body: formData, isFormData: true });
      showToast('Post shared!', 'success');
      setTimeout(() => (window.location.href = 'feed.html'), 500);
    } catch (err) {
      showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Share';
    }
  });
});
