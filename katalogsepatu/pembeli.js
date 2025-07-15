const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
const supabase = createClient(
  'https://lmmiuxgdypnpjdvffxdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbWl1eGdkeXBucGpkdmZmeGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MjgyMjQsImV4cCI6MjA2NTEwNDIyNH0.aXRzfjm9uZw5gTHPgs7ZxyB4RQhNposr5AwRi1dofjU'
);

const produkList = document.getElementById('produkList');
const cartSection = document.getElementById('cartSection');
const cartItems = document.getElementById('cartItems');

// Tampilkan produk
async function fetchProduk() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return console.error(error);

  produkList.innerHTML = data.map(p => `
    <div class="card">
      <img src="${p.image}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p>Rp ${p.price}</p>
      <input type="text" placeholder="Ukuran" id="size-${p.id}" />
      <button onclick="addToCart(${p.id}, '${p.name}', ${p.price})">Tambah ke Keranjang</button>
    </div>
  `).join('');
}
fetchProduk();

// Tambah ke keranjang
window.addToCart = (id, name, price) => {
  const size = document.getElementById(`size-${id}`).value;
  if (!size) return alert('Isi ukuran dulu');

  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.push({ id, name, price, size, qty: 1 });
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Ditambahkan ke keranjang!');
};

// Tampilkan isi keranjang
window.showCart = () => {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) return alert('Keranjang kosong');

  produkList.classList.add('hidden');
  cartSection.classList.remove('hidden');

  cartItems.innerHTML = cart.map(item => `
    <div class="card">
      <h3>${item.name}</h3>
      <p>Ukuran: ${item.size}</p>
      <p>Harga: Rp ${item.price}</p>
    </div>
  `).join('');
};

// Kembali ke halaman produk
window.backToProducts = () => {
  cartSection.classList.add('hidden');
  produkList.classList.remove('hidden');
};

// Checkout & Simpan ke Supabase
window.checkout = async () => {
  const nama = document.getElementById('namaPembeli').value;
  const alamat = document.getElementById('alamat').value;
  const noHp = document.getElementById('noHp').value;
  const metodeBayar = document.getElementById('metodeBayar').value;
  const metodeKirim = document.getElementById('metodeKirim').value;
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (!nama || !alamat || !noHp || !metodeBayar || !metodeKirim) {
    return alert('Isi semua data pembeli');
  }

  for (const item of cart) {
    await supabase.from('orders').insert({
      product_id: item.id,
      size: item.size,
      quantity: item.qty,
      buyer_name: nama,
      address: alamat,
      phone: noHp,
      payment_method: metodeBayar,
      shipping_method: metodeKirim,
    });
  }

  alert('Transaksi berhasil!\nStruk sudah dicetak di konsol browser.');
  console.log({ nama, alamat, noHp, metodeBayar, metodeKirim, cart });

  localStorage.removeItem('cart');
  location.reload();
};
