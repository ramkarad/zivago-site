
const PRODUCT_KEY = "freshsip_products";

// Demo admin credentials
const ADMIN_USERNAME = "JAY";
const ADMIN_PASSWORD = "JAY123";

let uploadedImage = "";

// Check login status
document.addEventListener("DOMContentLoaded", () => {
  const loginBox = document.getElementById("login-box");
  const dashboard = document.getElementById("dashboard");

  if (sessionStorage.getItem("freshsip_admin") === "true") {
    loginBox.hidden = true;
    dashboard.hidden = false;
    loadAdminProducts();
  }

  // Login
  document.getElementById("login-form").addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const error = document.getElementById("login-error");

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem("freshsip_admin", "true");

      loginBox.hidden = true;
      dashboard.hidden = false;

      error.textContent = "";
      loadAdminProducts();
    } else {
      error.textContent = "Invalid username or password!";
    }
  });

  // Image upload and preview
  document.getElementById("product-image").addEventListener("change", function() {
    const file = this.files[0];
    const preview = document.getElementById("image-preview");

    uploadedImage = "";

    if (!file) {
      preview.hidden = true;
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      this.value = "";
      preview.hidden = true;
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2 MB.");
      this.value = "";
      preview.hidden = true;
      return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
      uploadedImage = event.target.result;
      preview.src = uploadedImage;
      preview.hidden = false;
    };

    reader.readAsDataURL(file);
  });

  // Save product
  document.getElementById("product-form").addEventListener("submit", function(e) {
    e.preventDefault();

    if (sessionStorage.getItem("freshsip_admin") !== "true") {
      alert("Please login first.");
      return;
    }

    const name = document.getElementById("product-name").value.trim();
    const price = Number(document.getElementById("product-price").value);
    const description = document.getElementById("product-description").value.trim();
    const message = document.getElementById("save-message");

    if (!name || !description || !uploadedImage || !Number.isFinite(price) || price <= 0) {
      message.textContent = "Please complete all product details.";
      return;
    }

    const products = JSON.parse(localStorage.getItem(PRODUCT_KEY) || "[]");

    const newProduct = {
      id: Date.now(),
      name: name,
      image: uploadedImage,
      price: price,
      description: description
    };

    products.push(newProduct);

    try {
      localStorage.setItem(PRODUCT_KEY, JSON.stringify(products));

      this.reset();
      uploadedImage = "";

      document.getElementById("image-preview").hidden = true;

      message.textContent = "Product saved successfully!";

      loadAdminProducts();

    } catch (error) {
      message.textContent = "Storage is full. Please use a smaller image.";
    }
  });
});

// Display admin products
function loadAdminProducts() {
  const products = JSON.parse(localStorage.getItem(PRODUCT_KEY) || "[]");

  const container = document.getElementById("admin-products");
  const count = document.getElementById("admin-product-count");

  count.textContent = products.length;

  if (products.length === 0) {
    container.innerHTML = "<p>No products added yet.</p>";
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="admin-product">
      <img src="${escapeAdminHTML(product.image)}" alt="Product">

      <div class="admin-product-info">
        <h3>${escapeAdminHTML(product.name)}</h3>
        <p>₹${Number(product.price).toFixed(2)}</p>
      </div>

      <button class="delete-btn"
        onclick="deleteProduct('${product.id}')">
        Delete
      </button>
    </div>
  `).join("");
}

// Prevent HTML injection in product text
function escapeAdminHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// Delete product
function deleteProduct(id) {
  if (sessionStorage.getItem("freshsip_admin") !== "true") return;

  const confirmDelete = confirm("Are you sure you want to delete this product?");

  if (!confirmDelete) return;

  let products = JSON.parse(localStorage.getItem(PRODUCT_KEY) || "[]");

  products = products.filter(
    product => String(product.id) !== String(id)
  );

  localStorage.setItem(PRODUCT_KEY, JSON.stringify(products));

  loadAdminProducts();
}

// Logout
function adminLogout() {
  sessionStorage.removeItem("freshsip_admin");
  window.location.reload();
}
