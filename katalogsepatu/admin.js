const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
const supabase = createClient(
  'https://lmmiuxgdypnpjdvffxdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbWl1eGdkeXBucGpkdmZmeGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MjgyMjQsImV4cCI6MjA2NTEwNDIyNH0.aXRzfjm9uZw5gTHPgs7ZxyB4RQhNposr5AwRi1dofjU'
);

const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const formProduk = document.getElementById('formProduk');
const riwayat = document.getElementById('riwayat');

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) {
    loginSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
    fetchRiwayat();
  } else {
    alert('Login gagal');
  }
}

async function logout() {
  await supabase.auth.signOut();
  location.reload();
}

// Registrasi ke window supaya bisa dipanggil dari onclick di HTML
window.login = login;
window.logout = logout;


window.logout = async () => {
  await supabase.auth.signOut();
  location.reload();
};

formProduk?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('nama').value;
  const price = parseInt(document.getElementById('harga').value);
  const file = document.getElementById('gambar').files[0];
  const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
  const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
  if (uploadError) return alert('Upload gagal');

  const { data: imageData } = supabase.storage.from('images').getPublicUrl(fileName);

  const { error: insertError } = await supabase.from('products').insert({ name, price, image: imageData.publicUrl });
  if (insertError) return alert('Gagal simpan produk');
  formProduk.reset();
  alert('Produk ditambahkan');
});

async function fetchRiwayat() {
  const { data, error } = await supabase.from('orders').select('*');
  if (error) return console.error(error);
  riwayat.innerHTML = data.map(o => `
    <div class="card">
      <p>ID Produk: ${o.product_id}</p>
      <p>Ukuran: ${o.size}</p>
      <p>Qty: ${o.quantity}</p>
      <p>Tanggal: ${new Date(o.created_at).toLocaleString()}</p>
    </div>
  `).join('');
}

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    loginSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
    fetchRiwayat();
  }
})();
