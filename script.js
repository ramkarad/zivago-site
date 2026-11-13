
// =====================================
// ZIVAGO WEBSITE - COMPLETE SCRIPT.JS
// PRODUCT + INDEXEDDB + CART + WHATSAPP
// =====================================

const PRODUCT_KEY = "freshsip_products";
const CART_KEY = "freshsip_cart";

const DB_NAME = "zivago_database";
const DB_VERSION = 1;
const STORE_NAME = "products";

// =====================================
// 1. DEFAULT PRODUCTS
// =====================================

const defaultProducts = [
    {
        id: 1,
        name: "Sea Buckthorn Juice - 500ml",
        price: 289,
        description: "Enjoy the natural goodness of Sea Buckthorn Juice Concentrate. Packed with antioxidants, this vegan-friendly juice contains no added sugar and offers a naturally tangy flavour. Perfect for adding to your daily wellness routine, it comes in a convenient 500 ml bottle, specially designed for adults.",
        image: "/two.jpg"
    },
    {
        id: 2,
        name: "Sea Buckthorn Juice - 2*500ml",
        price: 529,
        description: "Enjoy the natural goodness of Sea Buckthorn Juice Concentrate. Packed with antioxidants, this vegan-friendly juice contains no added sugar and offers a naturally tangy flavour. Perfect for your daily wellness routine, this pack includes 2 convenient bottles of 500 ml each (Total 1 Litre), specially designed for adults.",
        image: "/ai.jpg"
    }
 ];

// =====================================
// 2. INDEXEDDB CONNECTION
// =====================================

function openProductDB() {
    return new Promise((resolve, reject) => {

        if (!window.indexedDB) {
            reject(new Error("IndexedDB is not supported."));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function(event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, {
                    keyPath: "id"
                });
            }
        };

        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}

// =====================================
// 3. IMAGE PATH - VERCEL FIX
// =====================================

function getImagePath(image) {

    if (!image) {
        return "https://placehold.co/600x400?text=Fresh+Juice";
    }

    image = String(image).trim();

    if (
        image.startsWith("https://") ||
        image.startsWith("http://") ||
        image.startsWith("data:") ||
        image.startsWith("blob:")
    ) {
        return image;
    }

    image = image.replace(/^\.\/+/, "");

    return "/" + image.replace(/^\/+/, "");
}

// =====================================
// 4. IMAGE ERROR HANDLING
// =====================================

function imageError(img) {

    console.error("Image failed to load:", img.src);

    img.onerror = null;

    img.src =
        "https://placehold.co/600x400?text=Image+Not+Available";
}

// =====================================
// 5. GET ALL PRODUCTS
// =====================================

async function getProducts() {

    const db = await openProductDB();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            STORE_NAME,
            "readonly"
        );

        const store = transaction.objectStore(STORE_NAME);

        const request = store.getAll();

        request.onsuccess = () => {

            const products = request.result || [];

            const updatedProducts = products.map(product => ({
                ...product,
                image: getImagePath(product.image)
            }));

            resolve(updatedProducts);

            db.close();
        };

        request.onerror = () => {

            reject(request.error);

            db.close();
        };
    });
}

// =====================================
// 6. SAVE PRODUCT
// =====================================

async function saveProduct(product) {

    const db = await openProductDB();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            STORE_NAME,
            "readwrite"
        );

        const updatedProduct = {
            ...product,
            image: getImagePath(product.image)
        };

        transaction.objectStore(STORE_NAME).put(updatedProduct);

        transaction.oncomplete = () => {
            resolve(true);
            db.close();
        };

        transaction.onerror = () => {
            reject(transaction.error);
            db.close();
        };

        transaction.onabort = () => {
            reject(transaction.error);
            db.close();
        };
    });
}

// =====================================
// 7. DELETE PRODUCT
// =====================================

async function deleteStoredProduct(id) {

    const db = await openProductDB();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            STORE_NAME,
            "readwrite"
        );

        transaction.objectStore(STORE_NAME).delete(id);

        transaction.oncomplete = () => {
            resolve(true);
            db.close();
        };

        transaction.onerror = () => {
            reject(transaction.error);
            db.close();
        };
    });
}

// =====================================
// 8. INITIALIZE PRODUCTS
// =====================================

async function initializeProducts() {

    try {

        let products = await getProducts();

        if (products.length === 0) {

            let oldProducts = [];

            try {

                oldProducts = JSON.parse(
                    localStorage.getItem(PRODUCT_KEY) || "[]"
                );

            } catch (error) {
                oldProducts = [];
            }

            const initialProducts =
                Array.isArray(oldProducts) && oldProducts.length
                    ? oldProducts
                    : defaultProducts;

            for (const product of initialProducts) {
                await saveProduct(product);
            }

            localStorage.removeItem(PRODUCT_KEY);
        }

        return await getProducts();

    } catch (error) {

        console.error("Product database error:", error);

        return defaultProducts;
    }
}

// =====================================
// 9. CART FUNCTIONS
// =====================================

function getCart() {

    try {

        const cart = JSON.parse(
            localStorage.getItem(CART_KEY) || "[]"
        );

        return Array.isArray(cart) ? cart : [];

    } catch (error) {
        return [];
    }
}

function saveCart(cart) {

    localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
    );

    updateCartCount();
}

// =====================================
// 10. ESCAPE HTML
// =====================================

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// =====================================
// 11. MOBILE MENU
// =====================================

function toggleMenu() {

    const navbar = document.getElementById("navbar");

    if (navbar) {
        navbar.classList.toggle("show");
    }
}

// =====================================
// 12. UPDATE CART COUNT
// =====================================

function updateCartCount() {

    const count = getCart().reduce(
        (sum, item) =>
            sum + (Number(item.quantity) || 0),
        0
    );

    document.querySelectorAll(".cart-count").forEach(element => {
        element.textContent = count;
    });
}

// =====================================
// 13. CART SUCCESS MESSAGE
// =====================================

let cartToastTimer;

function showCartToast(productName) {

    let toast = document.getElementById("cart-toast");

    if (!toast) {

        toast = document.createElement("div");

        toast.id = "cart-toast";

        toast.style.cssText = `
            position:fixed;
            top:20px;
            right:20px;
            width:min(360px,calc(100% - 30px));
            background:#fff;
            padding:20px;
            border-radius:15px;
            box-shadow:0 10px 35px rgba(0,0,0,.18);
            border-top:5px solid #398342;
            z-index:999999;
            opacity:0;
            visibility:hidden;
            transform:translateY(-15px);
            transition:.3s ease;
        `;

        toast.innerHTML = `
            <button id="freshToastClose"
                style="float:right;border:0;background:none;font-size:23px;cursor:pointer;">
                ×
            </button>

            <strong style="color:#398342;font-size:16px">
                ✓ Added to Cart Successfully!
            </strong>

            <p id="freshToastMessage"
                style="color:#666;font-size:14px;line-height:1.5">
            </p>

            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:15px;">

                <span id="freshToastCount"
                    style="font-size:12px;color:#398342;font-weight:bold;">
                </span>

                <a href="/cart.html"
                    style="background:#f28c28;color:white;padding:9px 14px;border-radius:25px;text-decoration:none;font-size:12px;">
                    View Cart →
                </a>
            </div>
        `;

        document.body.appendChild(toast);

        document.getElementById("freshToastClose")
            .addEventListener("click", closeCartToast);
    }

    const message = document.getElementById("freshToastMessage");
    const count = document.getElementById("freshToastCount");

    if (message) {
        message.textContent =
            productName + " has been added to your cart.";
    }

    const total = getCart().reduce(
        (sum, item) =>
            sum + Number(item.quantity || 0),
        0
    );

    if (count) {
        count.textContent = `🛒 ${total} items in your cart`;
    }

    clearTimeout(cartToastTimer);

    toast.style.opacity = "1";
    toast.style.visibility = "visible";
    toast.style.transform = "translateY(0)";

    cartToastTimer = setTimeout(closeCartToast, 3500);
}

// =====================================
// 14. CLOSE CART MESSAGE
// =====================================

function closeCartToast() {

    const toast = document.getElementById("cart-toast");

    if (!toast) return;

    toast.style.opacity = "0";
    toast.style.visibility = "hidden";
    toast.style.transform = "translateY(-15px)";

    clearTimeout(cartToastTimer);
}

// =====================================
// 15. PRODUCT CARD
// =====================================

function productCard(product) {

    const image = escapeHTML(getImagePath(product.image));
    const name = escapeHTML(product.name);
    const description = escapeHTML(product.description);
    const id = escapeHTML(product.id);
    const price = Number(product.price) || 0;

    return `
        <div class="product-card">

            <img
                src="${image}"
                alt="${name}"
                loading="lazy"
                onerror="imageError(this)">

            <div class="product-info">

                <h3>${name}</h3>

                <p>${description}</p>

                <div class="product-bottom">

                    <span class="price">
                        ₹${price.toFixed(2)}
                    </span>

                    <button
                        class="add-btn"
                        onclick="addToCart('${id}')">
                        Add to Cart +
                    </button>

                </div>
            </div>
        </div>
    `;
}

// =====================================
// 16. DISPLAY PRODUCTS
// =====================================

async function displayProducts() {

    const products = await getProducts();

    const featured =
        document.getElementById("featured-products");

    const all =
        document.getElementById("all-products");

    const empty =
        document.getElementById("empty-products");

    if (featured) {

        featured.innerHTML = products
            .slice(0, 3)
            .map(productCard)
            .join("");
    }

    if (all) {

        all.innerHTML = products
            .map(productCard)
            .join("");

        if (empty) {
            empty.hidden = products.length !== 0;
        }
    }
}

// =====================================
// 17. ADD TO CART
// =====================================

async function addToCart(id) {

    try {

        const products = await getProducts();

        const product = products.find(
            item => String(item.id) === String(id)
        );

        if (!product) {
            alert("Product not found!");
            return;
        }

        const cart = getCart();

        const existing = cart.find(
            item => String(item.id) === String(id)
        );

        if (existing) {

            existing.quantity =
                (Number(existing.quantity) || 0) + 1;

        } else {

            cart.push({
                id: product.id,
                quantity: 1
            });
        }

        saveCart(cart);

        showCartToast(product.name);

    } catch (error) {

        console.error("Add to cart error:", error);

        alert("Unable to add product to cart.");
    }
}

// =====================================
// 18. DISPLAY CART
// =====================================

async function displayCart() {

    const container =
        document.getElementById("cart-items");

    const summary =
        document.getElementById("cart-summary");

    if (!container || !summary) return;

    const products = await getProducts();

    let cart = getCart();

    cart = cart.filter(item =>
        products.some(product =>
            String(product.id) === String(item.id)
        )
    );

    saveCart(cart);

    if (cart.length === 0) {

        container.innerHTML = `
            <div class="empty-cart">
                <h2>🛒 Your Cart is Empty</h2>
                <p>Add your favourite fresh juices!</p>
                <a href="/products.html" class="btn">
                    Shop Now
                </a>
            </div>
        `;

        summary.hidden = true;
        return;
    }

    summary.hidden = false;

    let total = 0;

    container.innerHTML = cart.map(item => {

        const product = products.find(
            p => String(p.id) === String(item.id)
        );

        if (!product) return "";

        const price = Number(product.price) || 0;

        const quantity = Math.max(
            1,
            Number(item.quantity) || 1
        );

        const subtotal = price * quantity;

        total += subtotal;

        const id = escapeHTML(item.id);

        return `
            <div class="cart-row">

                <img
                    src="${escapeHTML(getImagePath(product.image))}"
                    alt="${escapeHTML(product.name)}"
                    onerror="imageError(this)">

                <div class="cart-details">

                    <h3>${escapeHTML(product.name)}</h3>

                    <p>₹${price.toFixed(2)}</p>

                    <div class="quantity-control">

                        <button onclick="changeQuantity('${id}',-1)">
                            −
                        </button>

                        <span>${quantity}</span>

                        <button onclick="changeQuantity('${id}',1)">
                            +
                        </button>

                    </div>

                    <button
                        class="remove-btn"
                        onclick="removeFromCart('${id}')">
                        Remove
                    </button>

                </div>

                <strong>₹${subtotal.toFixed(2)}</strong>

            </div>
        `;

    }).join("");

    const totalElement =
        document.getElementById("cart-total");

    if (totalElement) {
        totalElement.textContent =
            "₹" + total.toFixed(2);
    }
}

// =====================================
// 19. CHANGE QUANTITY
// =====================================

function changeQuantity(id, change) {

    const cart = getCart();

    const item = cart.find(
        p => String(p.id) === String(id)
    );

    if (!item) return;

    item.quantity =
        (Number(item.quantity) || 0) + change;

    const updated = cart.filter(
        p => p.quantity > 0
    );

    saveCart(updated);

    displayCart();
}

// =====================================
// 20. REMOVE FROM CART
// =====================================

function removeFromCart(id) {

    const updated = getCart().filter(
        item => String(item.id) !== String(id)
    );

    saveCart(updated);

    displayCart();
}

// =====================================
// 21. WHATSAPP ORDER
// =====================================

async function orderWhatsApp() {

    const cart = getCart();

    const products = await getProducts();

    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    let total = 0;

    let message =
        "Hello ZivaGo! I want to place an order:\n\n";

    cart.forEach(item => {

        const product = products.find(
            p => String(p.id) === String(item.id)
        );

        if (!product) return;

        const subtotal =
            Number(product.price) * Number(item.quantity);

        total += subtotal;

        message +=
            `${product.name} x ${item.quantity} = ₹${subtotal.toFixed(2)}\n`;
    });

    message += `\nTotal Amount: ₹${total.toFixed(2)}`;
    message += "\n\nPlease confirm my order.";

    window.open(
        "https://wa.me/919724307705?text=" +
        encodeURIComponent(message),
        "_blank",
        "noopener"
    );
}

// =====================================
// 22. WEBSITE INITIALIZATION
// =====================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("ZivaGo website initialized.");

    updateCartCount();

    try {

        await initializeProducts();

        await displayProducts();

        await displayCart();

    } catch (error) {

        console.error(
            "Website initialization error:",
            error
        );
    }
});

// =====================================
// END OF SCRIPT.JS
// =====================================
