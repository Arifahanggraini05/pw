// [script.js]
const supabase = supabase.createClient('https://lmmiuxgdypnpjdvffxdi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbWl1eGdkeXBucGpkdmZmeGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MjgyMjQsImV4cCI6MjA2NTEwNDIyNH0.aXRzfjm9uZw5gTHPgs7ZxyB4RQhNposr5AwRi1dofjU');
const SUPABASE_URL = ;
const SUPABASE_API_KEY = 

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
  // Sembunyikan semua section terlebih dahulu
  document.querySelectorAll('.container, .login-form').forEach(el => {
    el.classList.add('hidden');
  });
  
  // Tampilkan section sesuai role
  if (role === 'user') {
    document.getElementById('userSection').classList.remove('hidden');
    fetchProducts(); // Load produk untuk user
  } else if (role === 'admin') {
    document.getElementById('adminLogin').classList.remove('hidden');
  }
  
  // Sembunyikan role selector
  document.getElementById('roleSelector').classList.add('hidden');
}

function backToRoleMenu() {
  location.reload();
}

function loginAdmin() {
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminPass').value;
  if (user === 'admin@example.com' && pass === '123') {
    document.getElementById('adminLogin').classList.add('hidden');
    document.getElementById('adminSection').classList.remove('hidden');
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
  const list = document.getElementById(containerId);
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

  // ✅ Notifikasi berhasil
  alert("🎉 Pembelian berhasil! Terima kasih telah berbelanja.");

  cart = [];
}

function downloadReceipt() {
  const element = document.getElementById('receipt');
  document.getElementById('btnDownload').style.display = 'none';
  document.getElementById('btnFinish').style.display = 'none';

  setTimeout(() => {
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
  }, 200);
}

function finish() {
  document.getElementById('receipt').classList.add('hidden');
  document.getElementById('userSection').classList.remove('hidden');
}

function savePurchaseToLocalStorage(purchaseData) {
  let history = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
  history.push(purchaseData);
  localStorage.setItem('purchaseHistory', JSON.stringify(history));
}

function loadPurchaseHistory() {
  const container = document.getElementById('purchaseHistory');
  const history = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
  if (!history.length) {
    container.innerHTML = '<p>Belum ada riwayat pembelian.</p>';
    return;
  }

  container.innerHTML = history.map(p => `
    <div class="history-item" id="history-${p.id}">
      <p><strong>Nama:</strong> ${p.name}</p>
      <p><strong>Telepon:</strong> ${p.phone}</p>
      <p><strong>Alamat:</strong> ${p.address}</p>
      <p><strong>Waktu:</strong> ${formatDateTime(p.time)}</p>
      <p><strong>Pengiriman:</strong> ${p.shipping}</p>
      <p><strong>Nama Sepatu:</strong></p>
      <ul>
        ${p.items.map(i => `<li>${i.name} (Uk ${i.size}) - Rp ${parseHarga(i.price).toLocaleString('id-ID')}</li>`).join('')}
      </ul>
      <p>Total: Rp ${parseHarga(p.total).toLocaleString('id-ID')}</p>
      <button onclick="deletePurchaseHistory(${p.id})">🗑️ Hapus Riwayat Ini</button>
    </div>
  `).join('');
}

function deletePurchaseHistory(id) {
  let history = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
  history = history.filter(p => p.id !== id);
  localStorage.setItem('purchaseHistory', JSON.stringify(history));
  loadPurchaseHistory();
}

async function loadAdminProducts() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`,
      'Cache-Control': 'no-cache'
    }
  });
  const data = await res.json();
  const container = document.getElementById('adminProductList');
  container.innerHTML = '';

  if (!data.length) {
    container.innerHTML = '<p>Belum ada produk.</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'product-grid';

  data.forEach(p => {
    const item = document.createElement('div');
    item.className = 'product-item';
    item.innerHTML = `
      <img src="${p.image}?v=${Math.random()}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>Rp ${parseHarga(p.price).toLocaleString('id-ID')}</p>
      <p><strong>Stok per Ukuran:</strong></p>
      <ul id="sizeStock-${p.id}"><li>Loading...</li></ul>
      <button onclick="editProduct(${p.id}, '${p.name}', ${parseHarga(p.price)}, '${p.image}')">✏️ Edit</button>
      <button onclick="deleteProduct(${p.id})">🗑️ Hapus</button>
    `;
    grid.appendChild(item);
  });

  container.appendChild(grid);
  products = data;
  data.forEach(p => loadAdminSizeStock(p.id));
}

async function loadAdminSizeStock(productId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/product_sizes?product_id=eq.${productId}`, {
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`
    }
  });
  const sizes = await res.json();
  const list = document.getElementById(`sizeStock-${productId}`);
  list.innerHTML = sizes.length
    ? sizes.map(s => `<li>Uk ${s.size}: ${s.stock}</li>`).join('')
    : '<li>Belum ada data ukuran</li>';
}

async function uploadImage(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase
    .storage
    .from('product-images')
    .upload(filePath, file);

  if (error) throw error;

  return filePath;
}

async function addProduct() {
  const name = document.getElementById('newName').value;
  const price = parseInt(document.getElementById('newPrice').value);
  const imageFile = document.getElementById('newImage').files[0];

  if (!name || !price || !imageFile) return alert("Isi semua field!");

  try {
    // 1. Upload gambar
    const imagePath = await uploadImage(imageFile);
    
    // 2. Dapatkan URL publik
    const { data: { publicUrl } } = supabase
      .storage
      .from('product-images')
      .getPublicUrl(imagePath);

    // 3. Simpan data produk
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        name, 
        price, 
        image: publicUrl 
      })
    });

    if (res.ok) {
      alert("Produk ditambahkan!");
      document.getElementById('newName').value = '';
      document.getElementById('newPrice').value = '';
      document.getElementById('newImage').value = '';
      document.getElementById('imagePreview').style.display = 'none';
      loadAdminProducts();
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Gagal menambahkan produk");
  }
}
document.getElementById('newImage').addEventListener('change', function(e) {
  const preview = document.getElementById('imagePreview');
  if (this.files && this.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    }
    reader.readAsDataURL(this.files[0]);
  }
});



async function editProduct(id, currentName, currentPrice, currentImage) {
  // 1. Input data teks
  const newName = prompt("Edit Nama Produk:", currentName);
  if (newName === null) return; // Jika user cancel
  
  const newPriceStr = prompt("Edit Harga Produk:", currentPrice);
  if (newPriceStr === null) return;
  
  const newPrice = parseInt(newPriceStr);
  if (isNaN(newPrice)) {
    alert("Harga harus berupa angka!");
    return;
  }

  // 2. Handle upload gambar baru
  let newImage = currentImage;
  const shouldUpdateImage = confirm("Update gambar produk? Klik OK untuk memilih gambar baru, Cancel untuk tetap menggunakan gambar lama.");
  
  if (shouldUpdateImage) {
    try {
      // Buat input file secara dinamis
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      
      // Buka dialog pilih file
      fileInput.click();
      
      // Tunggu user memilih file
      const file = await new Promise((resolve, reject) => {
        fileInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
            resolve(e.target.files[0]);
          } else {
            reject(new Error('No file selected'));
          }
        });
        
        // Handle jika dialog ditutup
        fileInput.addEventListener('cancel', () => {
          reject(new Error('File selection cancelled'));
        });
      });
      
      // Upload gambar baru
      if (file) {
        // Validasi ukuran file (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert("Ukuran file terlalu besar. Maksimal 5MB.");
          return;
        }
        
        // Validasi tipe file
        if (!file.type.match('image.*')) {
          alert("File harus berupa gambar");
          return;
        }
        
        // Tampilkan loading
        const loading = alert("Mengupload gambar...");
        
        // Upload ke Supabase Storage
        const imagePath = await uploadImage(file);
        const { data: { publicUrl } } = supabase
          .storage
          .from('product-images')
          .getPublicUrl(imagePath);
        
        newImage = publicUrl;
        
        // Hapus loading
        if (loading) loading.close();
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      }
  }

  // 3. Update data produk di database
  try {
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ 
        name: newName, 
        price: newPrice, 
        image: newImage 
      })
    });

    if (!updateResponse.ok) {
      throw new Error("Gagal update produk");
    }

    // 4. Update stok per ukuran
    const existingSizesRes = await fetch(`${SUPABASE_URL}/rest/v1/product_sizes?product_id=eq.${id}`, {
      headers: {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`
      }
    });
    
    const existingSizes = await existingSizesRes.json();
    
    // Loop melalui semua ukuran sepatu (36-46)
    for (let size = 36; size <= 46; size++) {
      const currentStock = existingSizes.find(s => s.size === size)?.stock || 0;
      const newStockStr = prompt(`Stok untuk Ukuran ${size}:`, currentStock.toString());
      
      if (newStockStr === null) continue; // Skip jika user cancel
      
      const newStock = parseInt(newStockStr);
      if (isNaN(newStock)) {
        alert(`Stok ukuran ${size} harus angka! Diisi dengan 0.`);
        continue;
      }
      
      const existingSize = existingSizes.find(s => s.size === size);
      
      if (existingSize) {
        // Update stok yang sudah ada
        await fetch(`${SUPABASE_URL}/rest/v1/product_sizes?product_id=eq.${id}&size=eq.${size}`, {
          method: 'PATCH',
          headers: {
            apikey: SUPABASE_API_KEY,
            Authorization: `Bearer ${SUPABASE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ stock: newStock })
        });
      } else {
        // Tambahkan stok baru jika belum ada
        await fetch(`${SUPABASE_URL}/rest/v1/product_sizes`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_API_KEY,
            Authorization: `Bearer ${SUPABASE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            product_id: id, 
            size: size, 
            stock: newStock 
          })
        });
      }
    }
    
    alert("Produk berhasil diupdate!");
    loadAdminProducts();
    
  } catch (error) {
    console.error("Error updating product:", error);
    alert("Gagal update produk: " + error.message);
  }
}

// Fungsi helper untuk upload gambar
async function uploadImage(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error } = await supabase
    .storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    if (error.message.includes('duplicate')) {
      // Jika nama file duplikat, coba lagi dengan nama berbeda
      return uploadImage(file);
    }
    throw error;
  }

  return filePath;
}

async function deleteProduct(id) {
  if (!confirm("Yakin ingin menghapus produk ini beserta semua ukuran?")) return;

  console.log("Menghapus ukuran untuk product ID:", id);
  const resSize = await fetch(`${SUPABASE_URL}/rest/v1/product_sizes?product_id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`
    }
  });
  console.log("Respon hapus ukuran:", resSize.status);

  console.log("Menghapus produk utama:", id);
  const resProduct = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`
    }
  });
  console.log("Respon hapus produk:", resProduct.status);

  if (resProduct.ok) {
    alert("Produk berhasil dihapus!");
    loadAdminProducts();
  } else {
    alert("Gagal menghapus produk.");
    const errorMsg = await resProduct.text();
    console.error("Error detail:", errorMsg);
  }
}

