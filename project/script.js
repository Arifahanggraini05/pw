const form = document.getElementById("formAnggota");
const statusEl = document.getElementById("status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nama = document.getElementById("nama").value;
  const email = document.getElementById("email").value;
  const telepon = document.getElementById("telepon").value;
  const alamat = document.getElementById("alamat").value;
  const fotoFile = document.getElementById("foto").files[0];

  const fileExt = fotoFile.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `foto/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('foto-anggota')
    .upload(filePath, fotoFile);

  if (uploadError) return statusEl.textContent = "Upload gagal: " + uploadError.message;

  const { data } = supabase.storage.from('foto-anggota').getPublicUrl(filePath);

  await supabase.from('anggota').insert([{ nama, email, telepon, alamat, foto: data.publicUrl }]);
  statusEl.textContent = "Pendaftaran berhasil!";
  form.reset();
});
