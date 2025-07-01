let isEditing = false;
let currentId = null;

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) window.location.href = "admin.html";
}
checkSession();

const form = document.getElementById("formAnggota");
const tableBody = document.querySelector("#anggotaTable tbody");
const logoutBtn = document.getElementById("logoutBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama = document.getElementById("nama").value;
  const email = document.getElementById("email").value;
  const telepon = document.getElementById("telepon").value;
  const alamat = document.getElementById("alamat").value;
  const fotoFile = document.getElementById("foto").files[0];

  let fotoUrl = null;

  if (fotoFile) {
    const fileExt = fotoFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `foto/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('foto-anggota')
      .upload(filePath, fotoFile);

    if (uploadError) {
      alert("Upload foto gagal: " + uploadError.message);
      return;
    }

    const { data } = supabase.storage.from('foto-anggota').getPublicUrl(filePath);
    fotoUrl = data.publicUrl;
  }

  if (isEditing) {
    const updateData = { nama, email, telepon, alamat };
    if (fotoUrl) updateData.foto = fotoUrl;

    await supabase.from('anggota').update(updateData).eq('id', currentId);
    isEditing = false;
    currentId = null;
    form.querySelector("button").textContent = "Tambah";
  } else {
    await supabase.from('anggota').insert([{ nama, email, telepon, alamat, foto: fotoUrl }]);
  }

  form.reset();
  loadData();
});

async function loadData() {
  const { data } = await supabase.from('anggota').select('*');
  tableBody.innerHTML = "";
  data.forEach(a => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><img src="${a.foto}" width="50" /></td>
      <td>${a.nama}</td>
      <td>${a.email}</td>
      <td>${a.telepon}</td>
      <td>${a.alamat}</td>
      <td>
        <button onclick="edit('${a.id}')">Edit</button>
        <button onclick="hapus('${a.id}')">Hapus</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}


async function hapus(id) {
  await supabase.from("anggota").delete().eq("id", id);
  loadData();
}

async function edit(id) {
  const { data } = await supabase.from("anggota").select("*").eq("id", id).single();
  if (!data) return alert("Data tidak ditemukan!");

  document.getElementById("nama").value = data.nama;
  document.getElementById("email").value = data.email;
  document.getElementById("telepon").value = data.telepon;
  document.getElementById("alamat").value = data.alamat;

  isEditing = true;
  currentId = id;
  form.querySelector("button").textContent = "Simpan Perubahan";
}

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "admin.html";
});

loadData();
