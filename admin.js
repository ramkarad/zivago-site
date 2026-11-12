const DB_NAME = "zivago_database";
const DB_VERSION = 1;
const STORE_NAME = "products";

const ADMIN_USERNAME = "JAY";
const ADMIN_PASSWORD = "JAY123";

let uploadedImage = "";

// =====================================
// 1. DATABASE CONNECTION
// =====================================

function openAdminDB() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function(event) {

            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {

                db.createObjectStore(STORE_NAME, {
                    keyPath: "id"
                });

            }
        };

        request.onsuccess = () => resolve(request.result);

        request.onerror = () => reject(request.error);

    });
}

// =====================================
// 2. GET PRODUCTS
// =====================================

async function getAdminProducts() {

    const db = await openAdminDB();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(STORE_NAME, "readonly");

        const request = transaction.objectStore(STORE_NAME).getAll();

        request.onsuccess = () => resolve(request.result || []);

        request.onerror = () => reject(request.error);

    });
}

// =====================================
// 3. SAVE PRODUCT
// =====================================

async function saveAdminProduct(product) {

    const db = await openAdminDB();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(STORE_NAME, "readwrite");

        transaction.objectStore(STORE_NAME).put(product);

        transaction.oncomplete = () => resolve(true);

        transaction.onerror = () => reject(transaction.error);

    });
}

// =====================================
// 4. DELETE PRODUCT
// =====================================

async function removeAdminProduct(id) {

    const db = await openAdminDB();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(STORE_NAME, "readwrite");

        transaction.objectStore(STORE_NAME).delete(id);

        transaction.oncomplete = () => resolve(true);

        transaction.onerror = () => reject(transaction.error);

    });
}

// =====================================
// 5. HTML SECURITY
// =====================================

function escapeAdminHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// =====================================
// 6. INITIALIZE ADMIN
// =====================================

document.addEventListener("DOMContentLoaded", async () => {

    const loginBox = document.getElementById("login-box");

    const dashboard = document.getElementById("dashboard");

    const loginForm = document.getElementById("login-form");

    const productForm = document.getElementById("product-form");

    const imageInput = document.getElementById("product-image");

    if (!loginBox || !dashboard || !loginForm || !productForm || !imageInput) {

        console.error("Admin HTML elements are missing.");

        return;
    }

    // Check login

    if (sessionStorage.getItem("freshsip_admin") === "true") {

        loginBox.hidden = true;

        dashboard.hidden = false;

        await loadAdminProducts();
    }

    // =====================================
    // LOGIN
    // =====================================

    loginForm.addEventListener("submit", async function(e) {

        e.preventDefault();

        const username =
            document.getElementById("username").value.trim();

        const password =
            document.getElementById("password").value;

        const error =
            document.getElementById("login-error");

        if (
            username === ADMIN_USERNAME &&
            password === ADMIN_PASSWORD
        ) {

            sessionStorage.setItem("freshsip_admin", "true");

            loginBox.hidden = true;

            dashboard.hidden = false;

            error.textContent = "";

            try {

                await loadAdminProducts();

            } catch (err) {

                error.textContent = "Database connection failed.";

                console.error(err);
            }

        } else {

            error.textContent = "Invalid username or password!";

        }

    });

    // =====================================
    // IMAGE PREVIEW
    // =====================================

    imageInput.addEventListener("change", function() {

        const file = this.files[0];

        const preview =
            document.getElementById("image-preview");

        uploadedImage = "";

        preview.hidden = true;

        if (!file) return;

        if (!file.type.startsWith("image/")) {

            alert("Please select a valid image.");

            this.value = "";

            return;
        }

        // Limit to 5 MB

        if (file.size > 5 * 1024 * 1024) {

            alert("Image size must be less than 5 MB.");

            this.value = "";

            return;
        }

        const reader = new FileReader();

        reader.onload = function(event) {

            uploadedImage = event.target.result;

            preview.src = uploadedImage;

            preview.hidden = false;

        };

        reader.onerror = function() {

            alert("Unable to read image.");

        };

        reader.readAsDataURL(file);

    });

    // =====================================
    // ADD PRODUCT
    // =====================================

    productForm.addEventListener("submit", async function(e) {

        e.preventDefault();

        const message =
            document.getElementById("save-message");

        if (sessionStorage.getItem("freshsip_admin") !== "true") {

            message.textContent = "Please login first.";

            return;
        }

        const name =
            document.getElementById("product-name").value.trim();

        const price =
            Number(document.getElementById("product-price").value);

        const description =
            document.getElementById("product-description").value.trim();

        if (!name || !description || !uploadedImage || !Number.isFinite(price) || price <= 0) {

            message.textContent = "Please complete all product details.";

            return;
        }

        const newProduct = {

            id: Date.now(),

            name: name,

            price: price,

            description: description,

            image: uploadedImage

        };

        try {

            message.textContent = "Saving product...";

            await saveAdminProduct(newProduct);

            this.reset();

            uploadedImage = "";

            const preview =
                document.getElementById("image-preview");

            preview.src = "";

            preview.hidden = true;

            message.textContent = "✓ Product added successfully!";

            await loadAdminProducts();

        } catch (error) {

            console.error("Product saving error:", error);

            message.textContent =
                "Unable to save product. Please check browser storage.";

        }

    });

});

// =====================================
// 7. LOAD ADMIN PRODUCTS
// =====================================

async function loadAdminProducts() {

    const container =
        document.getElementById("admin-products");

    const count =
        document.getElementById("admin-product-count");

    if (!container || !count) return;

    try {

        const products = await getAdminProducts();

        count.textContent = products.length;

        if (products.length === 0) {

            container.innerHTML = "<p>No products added yet.</p>";

            return;
        }

        container.innerHTML = products.map(product => {

            return `

                <div class="admin-product">

                    <img
                        src="${escapeAdminHTML(product.image)}"
                        alt="${escapeAdminHTML(product.name)}"
                        style="width:90px;height:90px;object-fit:cover;border-radius:10px"
                        onerror="this.src='https://placehold.co/200x200?text=Product'">

                    <div class="admin-product-info">

                        <h3>${escapeAdminHTML(product.name)}</h3>

                        <p>₹${Number(product.price).toFixed(2)}</p>

                        <p>${escapeAdminHTML(product.description)}</p>

                    </div>

                    <button
                        class="delete-btn"
                        onclick="deleteProduct('${escapeAdminHTML(product.id)}')">

                        Delete

                    </button>

                </div>

            `;

        }).join("");

    } catch (error) {

        console.error(error);

        container.innerHTML = "<p>Unable to load products.</p>";

    }
}

// =====================================
// 8. DELETE PRODUCT
// =====================================

async function deleteProduct(id) {

    if (sessionStorage.getItem("freshsip_admin") !== "true") {

        alert("Please login first.");

        return;
    }

    const confirmDelete = confirm(
        "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {

        await removeAdminProduct(Number(id));

        await loadAdminProducts();

        alert("Product deleted successfully!");

    } catch (error) {

        console.error(error);

        alert("Unable to delete product.");

    }
}

// =====================================
// 9. LOGOUT
// =====================================

function adminLogout() {

    sessionStorage.removeItem("freshsip_admin");

    window.location.reload();

}
