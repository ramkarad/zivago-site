
const PRODUCT_KEY = "freshsip_products";
const CART_KEY = "freshsip_cart";

// =====================================
// 1. DEFAULT PRODUCTS
// =====================================

const defaultProducts = [
    {
        id: 1,
        name: "Fresh Orange Juice",
        price: 99,
        description: "Fresh and refreshing orange juice.",
        image: "/two.jpg"
    },
    {
        id: 2,
        name: "Fresh Watermelon Juice",
        price: 79,
        description: "Sweet and refreshing watermelon juice.",
        image: "/watermelon.jpg"
    }
];

// =====================================
// 2. INITIALIZE PRODUCTS
// =====================================

function initializeProducts() {

    if (!localStorage.getItem(PRODUCT_KEY)) {
        localStorage.setItem(
            PRODUCT_KEY,
            JSON.stringify(defaultProducts)
        );
    }
}

initializeProducts();

// =====================================
// 3. GET PRODUCTS
// =====================================

function getProducts() {

    try {
        const products = JSON.parse(
            localStorage.getItem(PRODUCT_KEY)
        );

        return Array.isArray(products) ? products : defaultProducts;

    } catch (error) {
        return defaultProducts;
    }
}

// =====================================
// 4. GET CART
// =====================================

function getCart() {

    try {
        const cart = JSON.parse(
            localStorage.getItem(CART_KEY)
        );

        return Array.isArray(cart) ? cart : [];

    } catch (error) {
        return [];
    }
}

// =====================================
// 5. SAVE CART
// =====================================

function saveCart(cart) {

    localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
    );

    updateCartCount();
}

// =====================================
// 6. IMAGE PATH FIX FOR VERCEL
// =====================================

function getImagePath(image) {

    if (!image) {
        return "https://placehold.co/600x400?text=Fresh+Juice";
    }

    image = String(image).trim();

    // External image URLs
    if (
        image.startsWith("https://") ||
        image.startsWith("http://") ||
        image.startsWith("data:")
    ) {
        return image;
    }

    // Root-relative image paths
    if (image.startsWith("/")) {
        return image;
    }

    // Relative paths become root-relative
    return "/" + image.replace(/^\.\/+/, "");
}

// =====================================
// 7. IMAGE ERROR HANDLER
// =====================================

function imageError(image) {

    image.onerror = null;

    image.src =
        "https://placehold.co/600x400?text=Fresh+Juice";
}

// =====================================
// 8. ESCAPE HTML
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
// 9. MOBILE MENU
// =====================================

function toggleMenu() {

    const navbar = document.getElementById("navbar");

    if (navbar) {
        navbar.classList.toggle("show");
    }
}

// =====================================
// 10. UPDATE CART COUNT
// =====================================

function updateCartCount() {

    const count = getCart().reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
    );

    document.querySelectorAll(".cart-count").forEach(el => {
        el.textContent = count;
    });

    const popupCount =
        document.getElementById("popupCartCount");

    if (popupCount) {
        popupCount.textContent =
            `🛒 ${count} items in your cart`;
    }
}

// =====================================
// 11. CREATE CART POPUP
// =====================================

function createCartPopup() {

    if (document.getElementById("cartSuccessPopup")) {
        return;
    }

    const popup = document.createElement("div");

    popup.id = "cartSuccessPopup";
    popup.className = "cart-success-popup";

    popup.setAttribute("role", "status");
    popup.setAttribute("aria-live", "polite");

    popup.innerHTML = `
        <button
            class="popup-close"
            id="popupClose"
            aria-label="Close">
            &times;
        </button>

        <div class="popup-heading">

            <div class="popup-check">✓</div>

            <div class="popup-title">
                <h3>Added to Cart!</h3>
                <span>Successfully added</span>
            </div>

        </div>

        <p
            class="popup-description"
            id="popupProductName">
            Your fresh juice has been added.
        </p>

        <div class="popup-divider"></div>

        <div class="popup-bottom">

            <span
                class="popup-cart-count"
                id="popupCartCount">
                🛒 0 items in your cart
            </span>

            <a href="/cart.html" class="popup-view-cart">
                View Cart →
            </a>

        </div>

        <div class="popup-progress"></div>
    `;

    document.body.appendChild(popup);

    document.getElementById("popupClose")
        .addEventListener("click", closeCartPopup);
}

// =====================================
// 12. CLOSE CART POPUP
// =====================================

let popupTimer;

function closeCartPopup() {

    const popup =
        document.getElementById("cartSuccessPopup");

    if (popup) {
        popup.classList.remove("active");
    }

    clearTimeout(popupTimer);
}

// =====================================
// 13. SHOW CART POPUP
// =====================================

function showCartToast(productName) {

    createCartPopup();

    const popup =
        document.getElementById("cartSuccessPopup");

    const productMessage =
        document.getElementById("popupProductName");

    const cartCount =
        document.getElementById("popupCartCount");

    if (!popup) return;

    productMessage.textContent =
        productName + " has been added to your cart.";

    const totalItems = getCart().reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
    );

    cartCount.textContent =
        `🛒 ${totalItems} items in your cart`;

    clearTimeout(popupTimer);

    popup.classList.remove("active");

    void popup.offsetWidth;

    popup.classList.add("active");

    popupTimer = setTimeout(() => {
        popup.classList.remove("active");
    }, 3500);
}

// =====================================
// 14. PRODUCT CARD
// =====================================

function productCard(product) {

    const image = escapeHTML(
        getImagePath(product.image)
    );

    const name = escapeHTML(product.name);

    const description =
        escapeHTML(product.description);

    const price = Number(product.price) || 0;

    const id = escapeHTML(product.id);

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
// 15. DISPLAY PRODUCTS
// =====================================

function displayProducts() {

    const products = getProducts();

    const featured =
        document.getElementById("featured-products");

    const all =
        document.getElementById("all-products");

    const empty =
        document.getElementById("empty-products");

    // Homepage
    if (featured) {

        featured.innerHTML = products
            .slice(0, 3)
            .map(productCard)
            .join("");
    }

    // Products page
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
// 16. ADD TO CART
// =====================================

function addToCart(id) {

    const product = getProducts().find(
        p => String(p.id) === String(id)
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
}

// =====================================
// 17. DISPLAY CART
// =====================================

function displayCart() {

    const container =
        document.getElementById("cart-items");

    const summary =
        document.getElementById("cart-summary");

    if (!container || !summary) return;

    const products = getProducts();

    let cart = getCart();

    cart = cart.filter(item =>
        products.some(
            p => String(p.id) === String(item.id)
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

                        <button
                            onclick="changeQuantity('${id}', -1)">
                            −
                        </button>

                        <span>${quantity}</span>

                        <button
                            onclick="changeQuantity('${id}', 1)">
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
// 18. CHANGE QUANTITY
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
// 19. REMOVE PRODUCT
// =====================================

function removeFromCart(id) {

    const updated = getCart().filter(
        item => String(item.id) !== String(id)
    );

    saveCart(updated);

    displayCart();
}

// =====================================
// 20. WHATSAPP ORDER
// =====================================

function orderWhatsApp() {

    const cart = getCart();

    const products = getProducts();

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

    message +=
        `\nTotal Amount: ₹${total.toFixed(2)}`;

    message +=
        "\n\nPlease confirm my order.";

    const whatsappNumber = "9724307705";

    window.open(
        "https://wa.me/" +
        whatsappNumber +
        "?text=" +
        encodeURIComponent(message),
        "_blank"
    );
}

// =====================================
// 21. INITIALIZE WEBSITE
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    updateCartCount();

    displayProducts();

    displayCart();

});
