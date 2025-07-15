const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
const supabase = createClient(
  'https://lmmiuxgdypnpjdvffxdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbWl1eGdkeXBucGpkdmZmeGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MjgyMjQsImV4cCI6MjA2NTEwNDIyNH0.aXRzfjm9uZw5gTHPgs7ZxyB4RQhNposr5AwRi1dofjU'
);

const produkList = document.getElementById('produkList');

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

window.addToCart = (id, name, price) => {
  const size = document.getElementById(`size-${id}`).value;
  if (!size) return alert('Isi ukuran dulu');

  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.push({ id, name, price, size, qty: 1 });
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Ditambahkan ke keranjang!');
};
