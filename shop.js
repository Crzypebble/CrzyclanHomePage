let currentUserId = null;

// Replaced with a 1x1 black pixel data URI to prevent broken image icons
const DEFAULT_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

// The database of your digital products (Optional/Placeholder for Developer Assets)
const digitalProducts = [
  {
    id: "sys_swimming",
    title: "Custom Swimming Mechanics",
    type: "Luau Script / Module",
    price: "$4.99",
    desc: "A fully custom physics-based swimming controller for Roblox. Replaces the default swimming animations and physics with smooth, stamina-draining mechanics. Perfect for survival or adventure games.\n\nIncludes:\n- Core Luau Module\n- Stamina UI setup\n- Installation guide",
    image: "swimming_script.jpg" 
  },
  {
    id: "sys_input",
    title: "Advanced Input Controller",
    type: "Luau Script / Module",
    price: "$2.99",
    desc: "A clean, modular input controller to handle all player keyboard and gamepad inputs. Easily bind keys to actions without writing messy UserInputService code every time.",
    image: "input_controller.jpg"
  },
  {
    id: "sys_shop",
    title: "Physical Model-Based Shop",
    type: "Roblox System",
    price: "$7.99",
    desc: "A highly immersive 3D shop system. Instead of navigating boring 2D menus, players walk up to actual physical models in the game world to inspect and purchase items. \n\nIncludes the custom proximity prompt logic and model framework.",
    image: "physical_shop.jpg"
  }
];

let currentlySelectedProduct = null;

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      currentUserId = user.uid;
      document.getElementById('logged-out-warning').style.display = 'none';
    } else {
      currentUserId = null;
      document.getElementById('logged-out-warning').style.display = 'block';
    }
  });

  renderDigitalProducts();
});

function renderDigitalProducts() {
  const grid = document.getElementById('digital-products-grid');
  grid.innerHTML = ''; // Clear loading state

  digitalProducts.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.title}" onerror="this.src='${DEFAULT_IMAGE}'">
      </div>
      <div class="product-info">
        <span class="product-type">${product.type}</span>
        <h3 class="product-title">${product.title}</h3>
        <p class="product-desc">${product.desc.substring(0, 80)}...</p>
        <div class="product-footer">
          <span class="product-price">${product.price}</span>
          <button class="sleek-btn" onclick="openProductModal('${product.id}')">View Details</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

window.openProductModal = function(productId) {
  const product = digitalProducts.find(p => p.id === productId);
  if (!product) return;
  
  currentlySelectedProduct = product;
  
  document.getElementById('modal-product-title').textContent = product.title;
  document.getElementById('modal-product-type').textContent = product.type;
  document.getElementById('modal-product-price').textContent = product.price;
  document.getElementById('modal-product-desc').textContent = product.desc;
  
  const imgEl = document.getElementById('modal-product-img');
  imgEl.src = product.image;
  
  document.getElementById('product-modal').style.display = 'flex';
};

window.closeModal = function(modalId) {
  document.getElementById(modalId).style.display = 'none';
  currentlySelectedProduct = null;
};

window.initiatePurchase = function() {
  if (!currentUserId) {
    alert("You must be logged in to purchase digital items. Please head to settings to log in.");
    return;
  }
  
  if (currentlySelectedProduct) {
    alert(`Purchase system in development! You tried to buy: ${currentlySelectedProduct.title} for ${currentlySelectedProduct.price}`);
  }
};

// --- MEMBERSHIP CHECKOUT ROUTING ---
window.checkoutMembership = function(stripeLink) {
  if (!currentUserId) {
    alert("You must be logged in to purchase a membership. Please head to settings to log in.");
    return;
  }
  
  if (stripeLink.includes('YOUR_')) {
    alert("Stripe Links not configured yet! Go to Stripe.com, create a Payment Link, and paste it into the HTML button's onclick attribute.");
    return;
  }
  
  // This passes their Firebase User ID to Stripe, so when you look at your Stripe dashboard, 
  // you know exactly which user account bought the membership!
  const finalLink = `${stripeLink}?client_reference_id=${currentUserId}`;
  window.location.href = finalLink;
};
