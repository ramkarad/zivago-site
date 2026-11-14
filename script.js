
// =============================================
// ZIVAGO WEBSITE - COMPLETE SCRIPT.JS
// PRODUCTS + INDEXEDDB + CART + WHATSAPP
// =============================================

const CART_KEY = "freshsip_cart";

const DB_NAME = "zivago_database";
const DB_VERSION = 1;
const STORE_NAME = "products";


// =============================================
// 1. MANAGE PRODUCTS HERE
// Add, edit or remove products in this array.
// =============================================

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
    },

    {
        id: 3,
        name: "Sea Buckthorn Juice - 2*500ml",
        price: 529,
        description: "Enjoy the natural goodness of Sea Buckthorn Juice Concentrate. Packed with antioxidants, this vegan-friendly juice contains no added sugar and offers a naturally tangy flavour. Perfect for your daily wellness routine, this pack includes 2 convenient bottles of 500 ml each (Total 1 Litre), specially designed for adults.",
        image: "/ai.jpg"
    }

];


// =============================================
// 2. ADD NEW PRODUCT EXAMPLE
// =============================================

// {
//     id: 4,
//     name: "New Juice Product",
//     price: 399,
//     description: "Your product description here.",
//     image: "/new-product.jpg"
// }


// =============================================
// 3. INDEXEDDB CONNECTION
// =============================================

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


// =============================================
// 4. IMAGE PATH
// =============================================

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


// =============================================
// 5. IMAGE ERROR HANDLING
// =============================================

function imageError(img) {

    console.error("Image failed to load:", img.src);

    img.onerror = null;

    img.src = "https://placehold.co/600x400?text=Image+Not+Available";

}


// =============================================
// 6. SYNCHRONIZE PRODUCTS WITH INDEXEDDB
// IMPORTANT:
// defaultProducts is the source of truth.
// Every page load updates IndexedDB to match it.
// =============================================

async function initializeProducts() {

    const db = await openProductDB();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            STORE_NAME,
            "readwrite"
        );

        const store = transaction.objectStore(STORE_NAME);

        // Remove old product records.
        store.clear();

        // Insert current products from script.js.
        defaultProducts.forEach(product => {

            store.put({
                ...product,
                image: getImagePath(product.image)
            });

        });

        transaction.oncomplete = function() {

            db.close();

            console.log("ZivaGO products synchronized successfully.");

            resolve(true);

        };

        transaction.onerror = function() {

            db.close();

            reject(transaction.error);

        };

        transaction.onabort = function() {

            db.close();

            reject(transaction.error);

        };

    });

}


// =============================================
// 7. GET ALL PRODUCTS
// =============================================

async function getProducts() {

    const db = await openProductDB();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            STORE_NAME,
            "readonly"
        );

        const store = transaction.objectStore(STORE_NAME);

        const request = store.getAll();

        request.onsuccess = function() {

            const products = request.result || [];

            const updatedProducts = products.map(product => ({
                ...product,
                image: getImagePath(product.image)
            }));

            db.close();

            resolve(updatedProducts);

        };

        request.onerror = function() {

            db.close();

            reject(request.error);

        };

    });

}


// =============================================
// 8. ESCAPE HTML
// =============================================

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

    })[char]);

}


// =============================================
// 9. MOBILE MENU
// =============================================

function toggleMenu() {

    const navbar = document.getElementById("navbar");

    if (navbar) {
        navbar.classList.toggle("show");
    }

}


// =============================================
// 10. CART FUNCTIONS
// =============================================

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


// =============================================
// 11. UPDATE CART COUNT
// =============================================

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


// =============================================
// 12. CART SUCCESS POPUP
// Works with existing index.html popup.
// =============================================

let cartToastTimer;


function showCartToast(productName) {

    let toast = document.getElementById("cart-toast");

    // Create popup if it does not exist.
    if (!toast) {

        toast = document.createElement("div");

        toast.id = "cart-toast";
        toast.className = "cart-toast";

        toast.innerHTML = `

            <div class="toast-icon">✓</div>

            <div class="toast-content">

                <strong>Added to Cart Successfully!</strong>

                <p id="toast-message"></p>

                <div class="toast-bottom">

                    <span class="toast-cart-count" id="toast-count"></span>

                    <a href="./cart.html" class="toast-cart-link">
                        View Cart →
                    </a>

                </div>

            </div>

            <button class="toast-close"
                onclick="closeCartToast()">
                ×
            </button>

            <div class="toast-progress"></div>

        `;

        document.body.appendChild(toast);

    }

    const message = document.getElementById("toast-message");

    const countElement = document.getElementById("toast-count");

    if (message) {

        message.textContent =
            productName + " has been added to your shopping cart.";

    }

    const total = getCart().reduce(
        (sum, item) =>
            sum + Number(item.quantity || 0),
        0
    );

    if (countElement) {

        countElement.textContent =
            "🛒 " + total + " items in your cart";

    }

    clearTimeout(cartToastTimer);

    toast.classList.remove("show");

    // Restart animation.
    void toast.offsetWidth;

    toast.classList.add("show");

    cartToastTimer = setTimeout(closeCartToast, 3500);

}


// =============================================
// 13. CLOSE CART POPUP
// =============================================

function closeCartToast() {

    const toast = document.getElementById("cart-toast");

    if (toast) {

        toast.classList.remove("show");

    }

    clearTimeout(cartToastTimer);

}


// =============================================
// 14. PRODUCT CARD
// =============================================

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


// =============================================
// 15. DISPLAY PRODUCTS
// Homepage: First 3 products.
// Products page: All products.
// =============================================

async function displayProducts() {

    try {

        const products = await getProducts();

        const featured =
            document.getElementById("featured-products");

        const all =
            document.getElementById("all-products");

        const empty =
            document.getElementById("empty-products");


        // HOMEPAGE

        if (featured) {

            featured.innerHTML = products
                .slice(0, 3)
                .map(productCard)
                .join("");

        }


        // PRODUCTS PAGE

        if (all) {

            all.innerHTML = products
                .map(productCard)
                .join("");

            if (empty) {

                empty.hidden = products.length !== 0;

            }

        }

        console.log("Products displayed:", products.length);

    } catch (error) {

        console.error("Display products error:", error);

    }

}


// =============================================
// 16. ADD TO CART
// =============================================

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


// =============================================
// 17. DISPLAY CART
// =============================================

async function displayCart() {

    const container =
        document.getElementById("cart-items");

    const summary =
        document.getElementById("cart-summary");

    if (!container || !summary) return;

    try {

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

                    <a href="./products.html" class="btn">
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

    } catch (error) {

        console.error("Display cart error:", error);

    }

}


// =============================================
// 18. CHANGE QUANTITY
// =============================================

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


// =============================================
// 19. REMOVE FROM CART
// =============================================

function removeFromCart(id) {

    const updated = getCart().filter(
        item => String(item.id) !== String(id)
    );

    saveCart(updated);

    displayCart();

}


// =============================================
// 20. WHATSAPP ORDER
// =============================================

async function orderWhatsApp() {

    try {

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

            const quantity = Number(item.quantity) || 1;

            const subtotal =
                Number(product.price) * quantity;

            total += subtotal;

            message +=
                `${product.name} x ${quantity} = ₹${subtotal.toFixed(2)}\n`;

        });

        message += `\nTotal Amount: ₹${total.toFixed(2)}`;

        message += "\n\nPlease confirm my order.";

        window.open(
            "https://wa.me/919724307705?text=" +
            encodeURIComponent(message),
            "_blank",
            "noopener"
        );

    } catch (error) {

        console.error("WhatsApp order error:", error);

        alert("Unable to process your order.");

    }

}


// =============================================
// 21. WEBSITE INITIALIZATION
// =============================================

document.addEventListener("DOMContentLoaded", async function() {

    console.log("ZivaGO website initialized.");

    updateCartCount();

    try {

        // Sync script.js products into IndexedDB.
        await initializeProducts();

        // Display homepage/products page.
        await displayProducts();

        // Display cart if cart page is open.
        await displayCart();

        updateCartCount();

        console.log("ZivaGO website ready.");

    } catch (error) {

        console.error(
            "Website initialization error:",
            error
        );

    }

});


// =============================================
// END OF SCRIPT.JS
// =============================================
