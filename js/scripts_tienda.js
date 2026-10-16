// Configuración: Número de WhatsApp
const PHONE_NUMBER = "525539689276"; 

let products = [];
let cart = JSON.parse(localStorage.getItem('my_catalog_cart')) || [];

// Elementos DOM
const catalogGrid = document.getElementById('catalog-grid');
const cartModalElement = document.getElementById('cart-modal');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const checkoutForm = document.getElementById('checkout-form');

// Instancias globales para modales de Bootstrap
let detailModalInstance = null;
let cartModalInstance = null;

// 1. Cargar productos desde el JSON
async function loadProducts() {
  try {
    const res = await fetch('products.json');
    products = await res.json();
    renderCatalog();
    updateCartUI();
  } catch (error) {
    console.error("Error cargando productos:", error);
  }
}

// 2. Renderizar catálogo
function renderCatalog() {
  if (!catalogGrid) return;

  catalogGrid.innerHTML = products.map((product) => {
    const imagesList = product.images && product.images.length > 0 
      ? product.images 
      : [product.image];

    const carouselId = `carousel-card-${product.id}`;

    const carouselItemsHtml = imagesList.map((imgSrc, imgIdx) => `
      <div class="carousel-item ${imgIdx === 0 ? 'active' : ''}">
        <img src="${imgSrc}" class="d-block w-100 product-card-img" alt="${product.title}" loading="lazy">
      </div>
    `).join('');

    const carouselControlsHtml = imagesList.length > 1 ? `
      <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
      </button>
    ` : '';

    return `
      <article class="product-card card h-100 shadow-sm">
        <div id="${carouselId}" class="carousel slide" data-bs-interval="false">
          <div class="carousel-inner">
            ${carouselItemsHtml}
          </div>
          ${carouselControlsHtml}
        </div>

        <div class="product-info card-body d-flex flex-column">
          <h3 class="product-title h5 card-title">${product.title}</h3>
          <p class="product-desc card-text text-muted small flex-grow-1">${product.description}</p>
          
          <div class="product-footer d-flex justify-content-between align-items-center mt-3">
            <span class="product-price fw-bold fs-5">$${product.price} MXN</span>
            
            <div class="btn-group">
              <button class="btn btn-outline-secondary btn-sm" onclick="openDetailModal('${product.id}')">
                Ver detalle
              </button>
              <button class="btn btn-dark btn-sm" onclick="addToCart('${product.id}')">
                Agregar 🛒
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// 3. Agregar al carrito
window.addToCart = function(productId) {
  const existingIndex = cart.findIndex(item => item.id === productId);
  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    const product = products.find(p => p.id === productId);
    if (product) {
      cart.push({ ...product, quantity: 1 });
    }
  }
  saveCart();
};

// 4. Guardar y actualizar UI
function saveCart() {
  localStorage.setItem('my_catalog_cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (cartCount) cartCount.textContent = totalCount;
  if (cartTotalElement) cartTotalElement.textContent = totalPrice;

  if (cartItemsContainer) {
    cartItemsContainer.innerHTML = cart.length === 0 
      ? '<p class="text-muted text-center my-3">El carrito está vacío.</p>' 
      : cart.map(item => `
          <div class="cart-item d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
            <div>
              <strong>${item.title}</strong><br>
              <small class="text-muted">$${item.price} x ${item.quantity}</small>
            </div>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary" onclick="changeQuantity('${item.id}', -1)">-</button>
              <span class="btn btn-light disabled">${item.quantity}</span>
              <button class="btn btn-outline-secondary" onclick="changeQuantity('${item.id}', 1)">+</button>
            </div>
          </div>
        `).join('');
  }
}

window.changeQuantity = function(productId, delta) {
  const index = cart.findIndex(item => item.id === productId);
  if (index > -1) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    saveCart();
  }
};

// 5. Abrir Modal de Detalle
window.openDetailModal = function(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const imagesList = product.images && product.images.length > 0 
    ? product.images 
    : [product.image];

  document.getElementById('productDetailModalLabel').textContent = product.title;
  document.getElementById('modalProductTitle').textContent = product.title;
  document.getElementById('modalProductCategory').textContent = product.category || 'General';
  document.getElementById('modalProductPrice').textContent = `$${product.price} MXN`;
  document.getElementById('modalProductDescription').textContent = product.description;

  const indicatorsContainer = document.getElementById('modalCarouselIndicators');
  const innerContainer = document.getElementById('modalCarouselInner');

  indicatorsContainer.innerHTML = '';
  innerContainer.innerHTML = '';

  imagesList.forEach((imgSrc, idx) => {
    indicatorsContainer.innerHTML += `
      <button type="button" data-bs-target="#modalProductCarousel" data-bs-slide-to="${idx}" 
        class="${idx === 0 ? 'active' : ''}" aria-current="${idx === 0 ? 'true' : 'false'}" aria-label="Slide ${idx + 1}">
      </button>
    `;

    innerContainer.innerHTML += `
      <div class="carousel-item ${idx === 0 ? 'active' : ''}">
        <img src="${imgSrc}" class="d-block w-100 modal-carousel-img" alt="${product.title}">
      </div>
    `;
  });

  document.getElementById('modalProductAction').innerHTML = `
    <button class="btn btn-success btn-lg w-100" onclick="addFromModal('${product.id}')">
      Agregar al Carrito por $${product.price} MXN 🛒
    </button>
  `;

  const modalEl = document.getElementById('productDetailModal');
  detailModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
  detailModalInstance.show();
};

window.addFromModal = function(productId) {
  addToCart(productId);
  if (detailModalInstance) {
    detailModalInstance.hide();
  }
};

// 6. Formatear y enviar mensaje por WhatsApp
if (checkoutForm) {
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Tu carrito está vacío.");
      return;
    }

    const location = document.getElementById('pickup-location').value;
    const payment = document.getElementById('payment-method').value;

    let message = `¡Hola! Me interesa realizar el siguiente pedido:\n\n`;
    
    cart.forEach(item => {
      message += `• ${item.quantity}x ${item.title} ($${item.price * item.quantity} MXN)\n`;
    });

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    message += `\n*Total:* $${total} MXN\n`;
    message += `*Punto de entrega:* ${location}\n`;
    message += `*Método de pago:* ${payment}\n\n`;
    message += `¿Siguen disponibles?`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  });
}

// Carga inicial
loadProducts();