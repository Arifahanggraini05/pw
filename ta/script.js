const SUPABASE_URL = 'https://lmmiuxgdypnpjdvffxdi.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbWl1eGdkeXBucGpkdmZmeGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MjgyMjQsImV4cCI6MjA2NTEwNDIyNH0.aXRzfjm9uZw5gTHPgs7ZxyB4RQhNposr5AwRi1dofjU';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_API_KEY);

let products = [], cart = [];
let shippingCost = 15000;
let shippingMethod = 'Reguler (5-6 hari)';
const virtualAccounts = {
  BCA: '4061723352',
  MANDIRI: '1330027199868',
  DANA: '081280306674'
};

window.onload = () => {
  document.getElementById('roleSelector').classList.remove('hidden');
};

function selectRole(role) {
  document.getElementById('roleSelector').classList.add('hidden');
  if (role === 'user') {
    document.getElementById('userSection').classList.remove('hidden');
    fetchProducts();
  } else {
    document.getElementById('adminLogin').classList.remove('hidden');
  }
}

function backToRoleMenu() {
  location.reload();
}

async function loginAdmin() {
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;

  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    document.getElementById('adminLoginMsg').innerText = 'Login gagal: ' + error.message;
  } else {
    document.getElementById('adminLogin').classList.add('hidden');
    document.getElementById('adminSection').classList.remove('hidden');
    loadAdminProducts();
    loadPurchaseHistory();
  }
}

async function logout() {
  await client.auth.signOut();
  location.reload();
}

function parseHarga(value) {
  return typeof value === 'string' ? parseInt(value.replace(/\./g, '').replace(/,/g, '')) || 0 : value;
}

function formatDateTime(date) {
  return new Date(date).toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short'
  });
}

async function fetchProducts() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`,
      'Cache-Control': 'no-cache'
    }
  });
  products = await res.json();
  renderProducts('productList');
  setTimeout(updateAllSizeStocks, 500);
}

function renderProducts(containerId) {
  const list = document.getElementById('containerId');
  if(!list) {
    console.warn(`Elemen dengan id '${containerId}' tidak ditemukan.`);
    return;
  }
  list.innerHTML = '';
  products.forEach((p, i) => {
    list.innerHTML += `
      <div class="product-item">
        <img src="${p.image}" width="100%">
        <h3>${p.name}</h3>
        <p>Rp ${parseHarga(p.price).toLocaleString('id-ID')}</p>
        <label>Ukuran:
          <select id="size-${i}" onchange="updateSizeStock(${i})">
            ${[36,37,38,39,40,41,42,43,44,45,46].map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </label>
        <span id="size-stock-${i}">Stok: -</span><br/>
        <button onclick="addToCart(${i})">Tambah ke Keranjang</button>
      </div>`;
  });
}

async function fetchProductSizes(productId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/product_sizes?product_id=eq.${productId}`, {
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`
    }
  });
  return await res.json();
}

async function updateSizeStock(index) {
  const product = products[index];
  const selectedSize = document.getElementById(`size-${index}`).value;
  const sizes = await fetchProductSizes(product.id);
  const sizeData = sizes.find(s => s.size == selectedSize);
  const stokSize = sizeData ? sizeData.stock : 0;
  document.getElementById(`size-stock-${index}`).innerText = `Stok: ${stokSize}`;
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
  const stockSize = sizeData ? sizeData.stock : 0;
  if (stockSize <= 0) return alert("Stok ukuran ini habis!");
  cart.push({ ...product, size, stock_size: stockSize });
  alert(`Ditambahkan: ${product.name} (Ukuran ${size})`);
}

function showCart() {
  document.getElementById('userSection').classList.add('hidden');
  document.getElementById('cartSection').classList.remove('hidden');
  renderCart();
  toggleVASection();
}

function backToShop() {
  document.getElementById('cartSection').classList.add('hidden');
  document.getElementById('userSection').classList.remove('hidden');
}

function renderCart() {
  const cartItems = document.getElementById('cartItems');
  cartItems.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    total += parseHarga(item.price);
    cartItems.innerHTML += `<div>${item.name} (Uk ${item.size}) - Rp ${parseHarga(item.price).toLocaleString('id-ID')}</div>`;
  });
  document.getElementById('totalPrice').innerText = total.toLocaleString('id-ID');
}

function updateShipping() {
  const method = document.getElementById('shippingMethod').value;
  if (method === 'Express') {
    shippingCost = 20000;
    shippingMethod = 'Express (2-3 hari)';
  } else {
    shippingCost = 10000;
    shippingMethod = 'Reguler (5-6 hari)';
  }
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

async function checkout() {
  const name = document.getElementById('buyerName').value.trim();
  const address = document.getElementById('buyerAddress').value.trim();
  const phone = document.getElementById('buyerPhone').value.trim();
  const method = document.getElementById('paymentMethod').value;
  const bank = document.getElementById('bankType')?.value || '';
  const totalProduk = cart.reduce((sum, item) => sum + parseHarga(item.price), 0);
  const total = totalProduk + shippingCost;
  const paymentDetail = method === 'Transfer Bank' ? `${method} (${bank})` : method;
  let vaNumber = '-';
  if (method === 'Transfer Bank') vaNumber = virtualAccounts[bank];
  else if (method === 'DANA') vaNumber = virtualAccounts['DANA'];
  else if (method === 'QRIS') vaNumber = 'Scan QRIS untuk membayar';

  if (!name || !address || !phone) {
    document.getElementById('cashWarning').innerText = "Semua data wajib diisi!";
    return;
  }

  const waktuTransaksi = new Date().toISOString();

  const groupedItems = {};
  cart.forEach(item => {
    const key = `${item.id}-${item.size}`;
    if (!groupedItems[key]) {
      groupedItems[key] = { ...item, quantity: 0 };
    }
    groupedItems[key].quantity++;
  });

  for (const key in groupedItems) {
    const item = groupedItems[key];

    for (let i = 0; i < item.quantity; i++) {
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
    }

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
    id: Date.now(),
    name,
    address,
    phone,
    payment: paymentDetail,
    shipping: `${shippingMethod} - Rp ${shippingCost.toLocaleString('id-ID')}`,
    items: cart.map(i => ({ name: i.name, size: i.size, price: i.price })),
    total,
    time: waktuTransaksi
  });

  document.getElementById('receiptName').innerText = name;
  document.getElementById('receiptAddress').innerText = address;
  document.getElementById('receiptPhone').innerText = phone;
  document.getElementById('receiptMethod').innerText = paymentDetail;
  document.getElementById('receiptShipping').innerText = `${shippingMethod} - Rp ${shippingCost.toLocaleString('id-ID')}`;
  document.getElementById('receiptTime').innerText = formatDateTime(waktuTransaksi);
  if (vaNumber && vaNumber !== '-') {
    document.getElementById('receiptVA').classList.remove('hidden');
    document.getElementById('receiptVANumber').innerText = vaNumber;
  } else {
    document.getElementById('receiptVA').classList.add('hidden');
  }

  document.getElementById('receiptItems').innerHTML = cart.map(i =>
    `<p>${i.name} (Uk ${i.size}) - Rp ${parseHarga(i.price).toLocaleString('id-ID')}</p>`).join('');
  document.getElementById('receiptTotal').innerText = total.toLocaleString('id-ID');
  document.getElementById('cartSection').classList.add('hidden');
  document.getElementById('receipt').classList.remove('hidden');

  alert("🎉 Pembelian berhasil! Terima kasih telah berbelanja.");

  cart = [];
}

function downloadReceipt() {
  const receipt = document.getElementById('receipt').innerText;
  const blob = new Blob([receipt], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'struk_pembelian.txt';
  link.click();
}

function finish() {
  document.getElementById('receipt').classList.add('hidden');
  document.getElementById('userSection').classList.remove('hidden');
  fetchProducts();
}

function savePurchaseToLocalStorage(data) {
  const history = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
  history.push(data);
  localStorage.setItem('purchaseHistory', JSON.stringify(history));
}

function loadPurchaseHistory() {
  const history = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
  const list = document.getElementById('purchaseHistoryList');
  list.innerHTML = '';
  history.forEach(entry => {
    list.innerHTML += `
      <div class="history-item">
        <strong>${entry.name}</strong> - ${formatDateTime(entry.time)}<br/>
        Total: Rp ${entry.total.toLocaleString('id-ID')}
        <ul>${entry.items.map(i => `<li>${i.name} (Uk ${i.size}) - Rp ${parseHarga(i.price).toLocaleString('id-ID')}</li>`).join('')}</ul>
        <hr/>
      </div>`;
  });
}

function deletePurchaseHistory() {
  if (confirm("Hapus semua riwayat pembelian?")) {
    localStorage.removeItem('purchaseHistory');
    loadPurchaseHistory();
  }
}

async function loadAdminProducts() {
  const res = await client.from('products').select('*');
  const adminList = document.getElementById('adminProductList');
  adminList.innerHTML = '';

  res.data.forEach(p => {
    adminList.innerHTML += `
      <div class="product-item" id="product-${p.id}">
        <img src="${p.image}" width="100%">
        <h3>${p.name}</h3>
        <p>Rp ${parseHarga(p.price).toLocaleString('id-ID')}</p>
        <button onclick="editProduct(${p.id})">Edit</button>
        <button onclick="deleteProduct(${p.id})">Hapus</button>
        <button onclick="loadAdminSizeStock(${p.id})">Stok Ukuran</button>
        <div class="size-stock-info hidden" id="size-stock-info-${p.id}"></div>
      </div>`;
  });
}


async function loadAdminSizeStock(productId) {
  const section = document.getElementById(`size-stock-info-${productId}`);

  // Toggle: kalau udah tampil, sembunyikan
  if (!section.classList.contains('hidden')) {
    section.classList.add('hidden');
    section.innerHTML = '';
    return;
  }

  // Ambil data dari Supabase
  const { data, error } = await client
    .from('product_sizes')
    .select('*')
    .eq('product_id', productId);

  if (error) {
    alert("Gagal memuat ukuran: " + error.message);
    return;
  }

  // Tampilkan
  section.classList.remove('hidden');
  section.innerHTML = `
    <ul>
      ${data.map(d => `<li>Ukuran ${d.size}: ${d.stock} pcs</li>`).join('')}
    </ul>`;
}


async function uploadAndAddProduct() {
  const name = document.getElementById('newProductName').value;
  const price = parseHarga(document.getElementById('newProductPrice').value);
  const imageFile = document.getElementById('newProductImage').files[0];
  const sizes = [36, 37, 38, 39, 40, 41, 42, 43];

  if (!name || !price || !imageFile) return alert("Isi semua data produk!");

  const fileExt = imageFile.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const { error: uploadError } = await client.storage.from('images').upload(fileName, imageFile);

  if (uploadError) {
    alert("Gagal upload gambar: " + uploadError.message);
    return;
  }

  const { data: publicUrlData } = client.storage.from('images').getPublicUrl(fileName);
  const imageUrl = publicUrlData.publicUrl;

  const { data: inserted, error } = await client.from('products').insert({
    name,
    price,
    image: imageUrl
  }).select();

  if (error || !inserted?.length) return alert("Gagal menambah produk");

  for (let size of sizes) {
    await client.from('product_sizes').insert({
      product_id: inserted[0].id,
      size,
      stock: 10 // default stok awal
    });
  }

  alert("Produk berhasil ditambahkan!");
  loadAdminProducts();
}

async function editProduct(id) {
  const newName = prompt("Nama baru:");
  const newPrice = prompt("Harga baru:");

  if (!newName || !newPrice) return;

  const { error } = await client.from('products').update({
    name: newName,
    price: parseHarga(newPrice)
  }).eq('id', id);

  if (error) return alert("Gagal update: " + error.message);
  alert("Produk berhasil diupdate!");
  loadAdminProducts();
}

async function deleteProduct(id) {
  if (!confirm("Yakin ingin menghapus produk ini?")) return;
  await client.from('product_sizes').delete().eq('product_id', id);
  await client.from('products').delete().eq('id', id);
  alert("Produk dihapus.");
  loadAdminProducts();
}




