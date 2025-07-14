// script.js (versi optimal)

const SUPABASE_URL = 'https://hmwtsbgdizxkkhcwaury.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtd3RzYmdkaXp4a2toY3dhdXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MjcyMzksImV4cCI6MjA2NTEwMzIzOX0.BSq6ScSU9zQ8UywyM5Z3RrSvcYKzpGmxUjA_xKYsAVY';

let products = [], cart = [];
let shippingCost = 10000;
let shippingMethod = 'Reguler (5-6 hari)';
const virtualAccounts = {
  BCA: '4061723352',
  MANDIRI: '1330027199868',
  DANA: '081280306674'
};

window.onload = () => {
  document.getElementById('roleSelector')?.classList.remove('hidden');
};

function selectRole(role) {
  document.getElementById('roleSelector')?.classList.add('hidden');
  if (role === 'user') {
    document.getElementById('userSection')?.classList.remove('hidden');
    fetchProducts();
  } else {
    document.getElementById('adminLogin')?.classList.remove('hidden');
  }
}

function backToRoleMenu() {
  location.reload();
}

function loginAdmin() {
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value.trim();
  if (user === 'admin@example.com' && pass === '123') {
    document.getElementById('adminLogin')?.classList.add('hidden');
    document.getElementById('adminSection')?.classList.remove('hidden');
    loadAdminProducts();
    loadPurchaseHistory();
  } else {
    document.getElementById('adminLoginMsg').innerText = 'Login gagal';
  }
}

function logout() {
  location.reload();
}

function parseHarga(value) {
  return typeof value === 'string'
    ? parseInt(value.replace(/\./g, '').replace(/,/g, '')) || 0
    : value;
}

function formatDateTime(date) {
  return new Date(date).toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short'
  });
}

async function fetchProducts() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
      headers: {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`
      }
    });
    products = await res.json();
    renderProducts('productList');
    updateAllSizeStocks();
  } catch (error) {
    console.error("Gagal memuat produk:", error);
    notifyUser("Gagal memuat data produk.");
  }
}

function renderProducts(containerId) {
  const list = document.getElementById(containerId);
  if (!list) return;
  list.innerHTML = '';
  products.forEach((p, i) => {
    list.innerHTML += `
      <div class="product-item">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <h3>${p.name}</h3>
        <p>Rp ${parseHarga(p.price).toLocaleString('id-ID')}</p>
        <label for="size-${i}">Ukuran:
          <select id="size-${i}" onchange="updateSizeStock(${i})">
            ${[36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46].map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </label>
        <span id="size-stock-${i}">Stok: -</span><br/>
        <button onclick="addToCart(${i})" aria-label="Tambah ke keranjang">Tambah ke Keranjang</button>
      </div>`;
  });
}

async function fetchProductSizes(productId) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/product_sizes?product_id=eq.${productId}`, {
      headers: {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`
      }
    });
    return await res.json();
  } catch (err) {
    console.error('Gagal ambil ukuran:', err);
    return [];
  }
}

async function updateSizeStock(index) {
  const product = products[index];
  const size = document.getElementById(`size-${index}`).value;
  const sizes = await fetchProductSizes(product.id);
  const sizeData = sizes.find(s => s.size == size);
  document.getElementById(`size-stock-${index}`).innerText = `Stok: ${sizeData?.stock || 0}`;
}

async function updateAllSizeStocks() {
  for (let i = 0; i < products.length; i++) {
    await updateSizeStock(i);
  }
}

async function addToCart(i) {
  const product = products[i];
  const size = document.getElementById(`size-${i}`).value;
  const sizes = await fetchProductSizes(product.id);
  const sizeData = sizes.find(s => s.size == size);
  if (!sizeData || sizeData.stock <= 0) return notifyUser("Stok ukuran ini habis!");
  cart.push({ ...product, size, stock_size: sizeData.stock });
  notifyUser(`Ditambahkan: ${product.name} (Ukuran ${size})`);
}

function showCart() {
  toggleSection('userSection', 'cartSection');
  renderCart();
  toggleVASection();
}

function backToShop() {
  toggleSection('cartSection', 'userSection');
}

function renderCart() {
  const cartItems = document.getElementById('cartItems');
  cartItems.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    total += parseHarga(item.price);
    cartItems.innerHTML += `<div class="cart-item">${item.name} (Uk ${item.size}) - Rp ${parseHarga(item.price).toLocaleString('id-ID')}</div>`;
  });
  document.getElementById('totalPrice').innerText = total.toLocaleString('id-ID');
}

function updateShipping() {
  const method = document.getElementById('shippingMethod').value;
  shippingCost = method === 'Express' ? 20000 : 10000;
  shippingMethod = method === 'Express' ? 'Express (2-3 hari)' : 'Reguler (5-6 hari)';
  document.getElementById('shippingCost').innerText = shippingCost.toLocaleString('id-ID');
}

function toggleVASection() {
  const method = document.getElementById('paymentMethod').value;
  document.getElementById('bankSelection').classList.add('hidden');
  document.getElementById('danaVA').classList.add('hidden');
  document.getElementById('qrisSection').classList.add('hidden');

  if (method === 'Transfer Bank') {
    document.getElementById('bankSelection').classList.remove('hidden');
    showVA();
  } else if (method === 'DANA') {
    document.getElementById('danaVA').classList.remove('hidden');
  } else if (method === 'QRIS') {
    document.getElementById('qrisSection').classList.remove('hidden');
  }
}

function showVA() {
  const bank = document.getElementById('bankType').value;
  document.getElementById('vaNumber').innerText = virtualAccounts[bank] || '-';
}

function validateCheckoutForm() {
  const requiredFields = ['buyerName', 'buyerAddress', 'buyerPhone'];
  for (let id of requiredFields) {
    if (!document.getElementById(id).value.trim()) return false;
  }
  return true;
}

async function checkout() {
  if (!validateCheckoutForm()) {
    document.getElementById('cashWarning').innerText = "Semua data wajib diisi!";
    return;
  }

  const name = document.getElementById('buyerName').value.trim();
  const address = document.getElementById('buyerAddress').value.trim();
  const phone = document.getElementById('buyerPhone').value.trim();
  const method = document.getElementById('paymentMethod').value;
  const bank = document.getElementById('bankType')?.value || '';
  const totalProduk = cart.reduce((sum, item) => sum + parseHarga(item.price), 0);
  const total = totalProduk + shippingCost;
  const waktuTransaksi = new Date().toISOString();
  const paymentDetail = method === 'Transfer Bank' ? `${method} (${bank})` : method;
  let vaNumber = method === 'Transfer Bank' ? virtualAccounts[bank]
                : method === 'DANA' ? virtualAccounts['DANA']
                : method === 'QRIS' ? 'Scan QRIS untuk membayar' : '-';

  const groupedItems = {};
  cart.forEach(item => {
    const key = `${item.id}-${item.size}`;
    groupedItems[key] = groupedItems[key] || { ...item, quantity: 0 };
    groupedItems[key].quantity++;
  });

  try {
    for (const key in groupedItems) {
      const item = groupedItems[key];

      // Simpan transaksi
      await fetch(`${SUPABASE_URL}/rest/v1/sales`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_API_KEY,
          Authorization: `Bearer ${SUPABASE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buyer_name: name,
          address,
          phone,
          product_id: item.id,
          product_name: item.name,
          price: parseHarga(item.price),
          size: item.size,
          payment_method: paymentDetail,
          shipping_method: shippingMethod,
          shipping_cost: shippingCost,
          created_at: waktuTransaksi
        })
      });

      // Update stok
      await fetch(`${SUPABASE_URL}/rest/v1/product_sizes?product_id=eq.${item.id}&size=eq.${item.size}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_API_KEY,
          Authorization: `Bearer ${SUPABASE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stock: item.stock_size - item.quantity })
      });
    }

    savePurchaseToLocalStorage({
      id: Date.now(), name, address, phone,
      payment: paymentDetail,
      shipping: `${shippingMethod} - Rp ${shippingCost.toLocaleString('id-ID')}`,
      items: cart.map(i => ({ name: i.name, size: i.size, price: i.price })),
      total,
      time: waktuTransaksi
    });

    showReceipt({ name, address, phone, paymentDetail, shippingMethod, waktuTransaksi, vaNumber, total });
    cart = [];

  } catch (err) {
    console.error("Checkout error:", err);
    notifyUser("Checkout gagal. Silakan coba lagi.");
  }
}

function showReceipt(data) {
  toggleSection('cartSection', 'receipt');
  document.getElementById('receiptName').innerText = data.name;
  document.getElementById('receiptAddress').innerText = data.address;
  document.getElementById('receiptPhone').innerText = data.phone;
  document.getElementById('receiptMethod').innerText = data.paymentDetail;
  document.getElementById('receiptShipping').innerText = `${data.shippingMethod} - Rp ${shippingCost.toLocaleString('id-ID')}`;
  document.getElementById('receiptTime').innerText = formatDateTime(data.waktuTransaksi);
  document.getElementById('receiptItems').innerHTML = cart.map(i => `<p>${i.name} (Uk ${i.size}) - Rp ${parseHarga(i.price).toLocaleString('id-ID')}</p>`).join('');
  document.getElementById('receiptTotal').innerText = data.total.toLocaleString('id-ID');

  if (data.vaNumber && data.vaNumber !== '-') {
    document.getElementById('receiptVA').classList.remove('hidden');
    document.getElementById('receiptVANumber').innerText = data.vaNumber;
  } else {
    document.getElementById('receiptVA').classList.add('hidden');
  }

  notifyUser("🎉 Pembelian berhasil! Terima kasih telah berbelanja.");
}

function downloadReceipt() {
  document.getElementById('btnDownload').style.display = 'none';
  document.getElementById('btnFinish').style.display = 'none';
  const element = document.getElementById('receipt');

  html2pdf().set({
    margin: 0.5,
    filename: `struk_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  }).from(element).save().then(() => {
    document.getElementById('btnDownload').style.display = 'inline-block';
    document.getElementById('btnFinish').style.display = 'inline-block';
  });
}

function finish() {
  toggleSection('receipt', 'userSection');
}

function toggleSection(hideId, showId) {
  document.getElementById(hideId)?.classList.add('hidden');
  document.getElementById(showId)?.classList.remove('hidden');
}

function notifyUser(msg) {
  alert(msg); // Nanti bisa diganti dengan toast HTML
}

function savePurchaseToLocalStorage(data) {
  let history = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
  history.push(data);
  localStorage.setItem('purchaseHistory', JSON.stringify(history));
}

function loadPurchaseHistory() {
  const container = document.getElementById('purchaseHistory');
  const history = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
  if (!history.length) return container.innerHTML = '<p>Belum ada riwayat pembelian.</p>';

  container.innerHTML = history.map(p => `
    <div class="history-item" id="history-${p.id}">
      <p><strong>Nama:</strong> ${p.name}</p>
      <p><strong>Telepon:</strong> ${p.phone}</p>
      <p><strong>Alamat:</strong> ${p.address}</p>
      <p><strong>Waktu:</strong> ${formatDateTime(p.time)}</p>
      <p><strong>Pengiriman:</strong> ${p.shipping}</p>
      <ul>${p.items.map(i => `<li>${i.name} (Uk ${i.size}) - Rp ${parseHarga(i.price).toLocaleString('id-ID')}</li>`).join('')}</ul>
      <p><strong>Total:</strong> Rp ${parseHarga(p.total).toLocaleString('id-ID')}</p>
      <button onclick="deletePurchaseHistory(${p.id})" class="btn-danger">🗑️ Hapus Riwayat Ini</button>
    </div>`).join('');
}

function deletePurchaseHistory(id) {
  let history = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
  history = history.filter(p => p.id !== id);
  localStorage.setItem('purchaseHistory', JSON.stringify(history));
  loadPurchaseHistory();
}
