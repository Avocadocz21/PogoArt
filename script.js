// --- MENUTOGGLE (Menu pro mobilní zařízení) ---
var MenuItems = document.getElementById("MenuItems");
if (MenuItems) {
  MenuItems.style.maxHeight = "0px";
}

function menutoggle(){
  if (!MenuItems) return;
  if(MenuItems.style.maxHeight == "0px"){
    MenuItems.style.maxHeight = "200px";
  } else {
    MenuItems.style.maxHeight = "0px";
  }
}

// Globální proměnné pro sledování otevřených produktů v modálu
let currentProduct = null;
let spoonProduct = null;

// --- NAČÍTÁNÍ PRODUKTŮ Z JSONU ---
function loadProducts(jsonPath, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  fetch(jsonPath)
    .then(res => res.json())
    .then(products => {
      container.innerHTML = products.map(product => `
        <div class="col-4" onclick="openModal(\`${product.name}\`, \`${product.price}\`, \`${product.image}\`)">
          <img src="${product.image}" alt="${product.name}">
          <h4>${product.name}</h4>
          <p>${product.price}</p>
        </div>
      `).join("");
    })
    .catch(error => console.error("Chyba při načítání produktů:", error));
}

// --- OTEVÍRÁNÍ MODÁLŮ ---

// Pro běžné produkty (tašky atd.)
function openModal(name, price, image) {
  currentProduct = { name: name, price: price, image: image };
  spoonProduct = null; // Vypneme lžíci

  document.getElementById("m-img").src = image;
  document.getElementById("m-name").textContent = name;
  document.getElementById("m-price").textContent = price;

  // BEZPEČNÁ POJISTKA: Schováme políčko pro množství, jen pokud v HTML vůbec existuje
  const qtySection = document.getElementById("quantity-section");
  if (qtySection) qtySection.style.display = "none";

  document.getElementById("modal").style.display = "flex";
}

// Speciálně pro Šťastnou lžíci
function openSpoonModal(name, price, image) {
  spoonProduct = { name: name, price: price, image: image };
  currentProduct = null; // Vypneme běžný produkt

  document.getElementById("m-img").src = image;
  document.getElementById("m-name").textContent = name;
  document.getElementById("m-price").textContent = price;

  // Ukážeme políčko pro množství a skočíme na výchozí 1 kus (pokud v HTML existuje)
  const qtySection = document.getElementById("quantity-section");
  const qtyInput = document.getElementById("m-quantity");
  if (qtySection) qtySection.style.display = "block";
  if (qtyInput) qtyInput.value = 1;

  document.getElementById("modal").style.display = "flex";
}

// --- ZAVÍRÁNÍ MODÁLU (KŘÍŽEK A OKOLÍ) ---
function closeModal() {
  const modal = document.getElementById("modal");
  if (modal) {
    modal.style.display = "none";
  }
  currentProduct = null;
  spoonProduct = null;
}

window.onclick = function(event) {
  const modal = document.getElementById("modal");
  if (event.target === modal) {
    closeModal();
  }
}

// --- TLAČÍTKO UVNITŘ MODÁLU (PŘIDÁNÍ DO KOŠÍKU) ---
function handleAddToCart() {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let isAddedSuccessfully = false;

  // Scenář A: Přidáváme lžíci (sčítáme kusy)
  if (spoonProduct) {
    const qtyInput = document.getElementById("m-quantity");
    let chosenQuantity = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
    if (chosenQuantity < 1) chosenQuantity = 1;

    const existingIndex = cart.findIndex(item => item.name === spoonProduct.name);
    if (existingIndex !== -1) {
      cart[existingIndex].quantity += chosenQuantity;
    } else {
      cart.push({
        name: spoonProduct.name,
        price: spoonProduct.price,
        image: spoonProduct.image,
        quantity: chosenQuantity
      });
    }
    isAddedSuccessfully = true;
  } 
  // Scenář B: Přidáváme tašku (pouze 1 ks, hlídáme originál)
  else if (currentProduct) {
    const existingIndex = cart.findIndex(item => item.name === currentProduct.name);
    if (existingIndex !== -1) {
      alert(`Aha! Produkt "${currentProduct.name}" už v košíku máš. Každý kousek je originál, takže ho lze koupit pouze jednou. 🧶`);
      closeModal();
      return; 
    } else {
      cart.push({
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.image,
        quantity: 1
      });
      isAddedSuccessfully = true;
    }
  }

  // Zelená animace potvrzení na tlačítku
  if (isAddedSuccessfully) {
    localStorage.setItem("cart", JSON.stringify(cart));

    // Hledáme tlačítko univerzálně v jakémkoliv formátu modálu (modal-box i modal-content)
    const modalBtn = document.querySelector("#modal .price-cart .btn");
    if (modalBtn) {
      const originalText = modalBtn.innerHTML;
      modalBtn.innerHTML = "Přidáno! 🛍️";
      modalBtn.style.backgroundColor = "#28a745";
      modalBtn.disabled = true;

      setTimeout(() => {
        modalBtn.innerHTML = originalText;
        modalBtn.style.backgroundColor = "";
        modalBtn.disabled = false;
        closeModal();
      }, 1000);
    } else {
      closeModal();
    }
  }
}

// ALTERNATIVNÍ NÁZEV: Pojistka pro starší HTML soubory, které volají addToCartFromModal()
function addToCartFromModal() {
  handleAddToCart();
}

// --- KOŠÍK: ZOBRAZENÍ POLOŽEK ---
function displayCart() {
  const container = document.getElementById("cartItemsContainer");
  if (!container) return;

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    container.innerHTML = "<p>Tvůj košík je prázdný 🛒</p>";
    updateSummary(0);
    return;
  }

  let subtotal = 0;

  container.innerHTML = cart.map((item, index) => {
    const priceNum = parseInt(item.price) || 0;
    const itemTotal = priceNum * item.quantity;
    subtotal += itemTotal;

    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-info">
          <h4>${item.name}</h4>
          <p>Cena: ${item.price}</p>
          <div class="qty-row">
            <span>Počet: ${item.quantity} ks</span>
          </div>
        </div>
        <button class="remove-btn" onclick="removeFromCart(${index})">Odstranit</button>
      </div>
    `;
  }).join("");

  updateSummary(subtotal);
}

function removeFromCart(index) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  displayCart();
}

function updateSummary(subtotal) {
  const shipping = subtotal > 0 ? 69 : 0; 
  const total = subtotal + shipping;

  const subtotalEl = document.getElementById("subtotalPrice");
  const shippingEl = document.getElementById("shippingPrice");
  const totalEl = document.getElementById("totalPrice");

  if (subtotalEl) subtotalEl.textContent = `${subtotal} Kč`;
  if (shippingEl) shippingEl.textContent = `${shipping} Kč`;
  if (totalEl) totalEl.textContent = `${total} Kč`;
}

// --- ZOBRAZOVÁNÍ SEKCE DOPRAVY ---
function toggleBranchButtons() {
  const selectedShipping = document.querySelector('input[name="shipping"]:checked');
  if (!selectedShipping) return;

  const zasilkovnaDiv = document.getElementById("zasilkovna-section");
  const zasilkovnaDomuDiv = document.getElementById("zasilkovna-domu-section");
  const balikovnaDiv = document.getElementById("balikovna-section");
  const balikovnaDomuDiv = document.getElementById("balikovna-domu-section");

  if(!zasilkovnaDiv || !zasilkovnaDomuDiv || !balikovnaDiv || !balikovnaDomuDiv) return;

  zasilkovnaDiv.style.display = "none";
  zasilkovnaDomuDiv.style.display = "none";
  balikovnaDiv.style.display = "none";
  balikovnaDomuDiv.style.display = "none";

  const val = selectedShipping.value;
  if (val === "69_pobocka") zasilkovnaDiv.style.display = "block";
  else if (val === "109_domu") zasilkovnaDomuDiv.style.display = "block";
  else if (val === "39_pobocka") balikovnaDiv.style.display = "block";
  else if (val === "89_domu") balikovnaDomuDiv.style.display = "block";
}

// --- KONTROLA OSOBNÍCH ÚDAJŮ / ADRESY ---
function validateCheckoutForm() {
  const personalInputs = document.querySelectorAll(".personal-data-section .address-input");
  
  const firstName = personalInputs[0]?.value.trim();
  const lastName = personalInputs[1]?.value.trim();
  const email = personalInputs[2]?.value.trim();
  const phone = personalInputs[3]?.value.trim();

  if (!firstName || !lastName || !email || !phone) {
    alert("Prosím, vyplň všechny povinné osobní údaje (Jméno, Příjmení, E-mail a Telefon). 📝");
    return false;
  }

  if (!email.includes("@") || !email.includes(".")) {
    alert("Zadej prosím platný e-mail. ✉️");
    return false;
  }

  const selectedShipping = document.querySelector('input[name="shipping"]:checked')?.value;
  const selectedBranch = localStorage.getItem("selectedBranch");

  if (selectedShipping === "69_pobocka" && (!selectedBranch || !selectedBranch.includes("Zásilkovna"))) {
    alert("Vyber si prosím pobočku Zásilkovny. 📦");
    return false;
  }
  if (selectedShipping === "39_pobocka" && (!selectedBranch || !selectedBranch.includes("Balíkovna"))) {
    alert("Vyber si prosím pobočku Balíkovny. 📦");
    return false;
  }

  if (selectedShipping === "109_domu" || selectedShipping === "89_domu") {
    const activeSectionId = selectedShipping === "109_domu" ? "zasilkovna-domu-section" : "balikovna-domu-section";
    const addressInputs = document.querySelectorAll(`#${activeSectionId} .address-input`);
    if (!addressInputs[0]?.value.trim() || !addressInputs[1]?.value.trim() || !addressInputs[2]?.value.trim()) {
      alert("Vyplň prosím celou adresu domů (Ulici, Město i PSČ). 🏠");
      return false;
    }
  }
  return true;
}

// --- UNIKÁTNÍ ČÍSLO (DRŽÍ I PO REFRESHI STRÁNKY) ---
function getOrCreateOrderId() {
  let existingOrderId = localStorage.getItem("currentOrderId");
  if (existingOrderId) return existingOrderId;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomNum = Math.floor(1000 + Math.random() * 9000);

  const newOrderId = `PO-${year}${month}${day}-${randomNum}`;
  localStorage.setItem("currentOrderId", newOrderId);
  return newOrderId;
}
function handleFormSubmit(event) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  
  if (cart.length === 0) {
    alert("Tvůj košík je prázdný. 🛒");
    event.preventDefault();
    return false;
  }

  const selectedShipping = document.querySelector('input[name="shipping"]:checked');
  if (!selectedShipping) {
    alert("Prosím, zvol si způsob dopravy. 📦");
    event.preventDefault();
    return false;
  }

  if (!validateCheckoutForm()) {
    event.preventDefault();
    return false;
  }

  const orderId = getOrCreateOrderId();
  document.getElementById("form-order-id").value = orderId;

  // Údaje zákazníka
  const jmeno =
    document.getElementById("name")?.value.trim() ||
    document.getElementById("fullname")?.value.trim() ||
    "";

  const email =
    document.getElementById("email")?.value.trim() ||
    "";

  const telefon =
    document.getElementById("phone")?.value.trim() ||
    document.getElementById("telefon")?.value.trim() ||
    "";

  let adresa = "";
  let dorucovatel = selectedShipping.value;

  const selectedBranch = localStorage.getItem("selectedBranch");

  if (selectedBranch) {
    const branchObj = JSON.parse(selectedBranch);

    dorucovatel = branchObj.carrier;
    adresa = `${branchObj.name}${branchObj.address ? ", " + branchObj.address : ""}`;
  } else {
    const activeSectionId = selectedShipping.value.includes("domu")
      ? (
          selectedShipping.value.startsWith("109")
            ? "zasilkovna-domu-section"
            : "balikovna-domu-section"
        )
      : "";

    if (activeSectionId) {
      const addressInputs = document.querySelectorAll(
        `#${activeSectionId} .address-input`
      );

      adresa = [
        addressInputs[0]?.value.trim(),
        addressInputs[1]?.value.trim(),
        addressInputs[2]?.value.trim()
      ]
        .filter(Boolean)
        .join(", ");
    }
  }

  const produkty = cart
    .map(item => `• ${item.name} (${item.quantity} ks) - ${item.price}`)
    .join("\n");

  const objednavkaText =
    `Jméno: ${jmeno}
    E-mail: ${email}
    Telefon: ${telefon}

    Adresa doručení:
    ${adresa}

    Doručovatel:
    ${dorucovatel}

    Produkty:
    ${produkty}`;

  document.getElementById("form-cart-items").value = objednavkaText;

  document.getElementById("form-shipping-details").value =
    `Doručovatel: ${dorucovatel}`;

  setTimeout(() => {
    localStorage.removeItem("cart");
    localStorage.removeItem("selectedBranch");
    localStorage.removeItem("currentOrderId");
  }, 100);

  return true;
}

function openZasilkovna() {
  Packeta.Widget.pick(
    "TVUJ_API_KLIC",
    function(point) {
      if (!point) return;

      document.getElementById("selected-zasilkovna").textContent =
        `${point.name}, ${point.city}`;

      localStorage.setItem("selectedBranch", JSON.stringify({
        carrier: "Zásilkovna",
        name: point.name,
        address: point.city
      }));
    }
  );
}
