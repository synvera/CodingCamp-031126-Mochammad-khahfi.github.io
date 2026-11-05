const STORAGE_KEY = 'expense-budget-visualizer';
const CATEGORY_COLORS = [
    '#2ecc71', '#3498db', '#e67e22', '#9b59b6', '#f39c12',
    '#1abc9c', '#e74c3c', '#8e44ad', '#f1c40f', '#34495e',
    '#16a085', '#2980b9', '#c0392b', '#7f8c8d', '#d35400',
    '#00b894', '#fd79a8', '#6c5ce7'
];
const formatterDolar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
});

const $cardSaldo = document.getElementById('card-saldo');
const $formSaldo = document.getElementById('form-saldo');
const $inputSaldo = document.getElementById('input-saldo');
const $totalSaldo = document.getElementById('total-saldo');
const $formTransaksi = document.getElementById('form-transaksi');
const $inputNama = document.getElementById('item');
const $inputHarga = document.getElementById('input-harga');
const $selectKategori = document.getElementById('jenispengeluaran');
const $daftarTransaksi = document.getElementById('daftar-transaksi');
const $sortTransaksi = document.getElementById('sort-transaksi');
const $toggleCategoryForm = document.getElementById('toggle-category-form');
const $formKategori = document.getElementById('form-kategori');
const $inputKategori = document.getElementById('input-kategori');
const $pesanKategori = document.getElementById('pesan-kategori');
const $bulanRingkasan = document.getElementById('bulan-ringkasan');
const $totalBulanan = document.getElementById('total-bulanan');
const $jumlahTransaksiBulanan = document.getElementById('jumlah-transaksi-bulanan');
const $rincianKategoriBulanan = document.getElementById('rincian-kategori-bulanan');

const BASE_CATEGORIES = Array.from($selectKategori.options)
    .filter(option => option.value)
    .reduce((result, option) => {
        result[option.value] = option.textContent.trim();
        return result;
    }, {});
const CATEGORIES = { ...BASE_CATEGORIES };

let saldo = 0;
let transaksiData = [];
let customCategories = [];

function tanggalLokal(date = new Date()) {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function tampilkanErrorPenyimpanan(message, error) {
    console.error(message, error);
    alert(`${message} Perubahan tidak dapat dijamin tersimpan.`);
}

function muatData() {
    let rawData;
    try {
        rawData = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        tampilkanErrorPenyimpanan('Tidak dapat membaca Local Storage.', error);
        return;
    }

    if (rawData === null) return;

    try {
        const data = JSON.parse(rawData);
        const savedCategories = data.customCategories ?? [];
        if (!Array.isArray(savedCategories)) {
            throw new Error('Daftar kategori tersimpan tidak valid.');
        }

        const usedLabels = new Set(
            Object.entries(BASE_CATEGORIES).flatMap(([id, label]) => [
                id.toLocaleLowerCase(),
                label.toLocaleLowerCase()
            ])
        );
        const usedIds = new Set(Object.keys(BASE_CATEGORIES));
        savedCategories.forEach(category => {
            if (
                !category ||
                typeof category.id !== 'string' ||
                !category.id.startsWith('custom-') ||
                typeof category.label !== 'string' ||
                !category.label.trim() ||
                usedIds.has(category.id) ||
                usedLabels.has(category.label.trim().toLocaleLowerCase())
            ) {
                throw new Error('Kategori tersimpan memiliki format tidak valid.');
            }
            usedIds.add(category.id);
            usedLabels.add(category.label.trim().toLocaleLowerCase());
        });
        customCategories = savedCategories.map(category => ({
            id: category.id,
            label: category.label.trim()
        }));
        customCategories.forEach(category => {
            CATEGORIES[category.id] = category.label;
            tambahkanOpsiKategori(category);
        });

        const transaksiValid = Array.isArray(data.transaksi) && data.transaksi.every(item =>
            item &&
            (typeof item.id === 'string' || typeof item.id === 'number') &&
            typeof item.nama === 'string' &&
            Number.isFinite(item.harga) &&
            item.harga > 0 &&
            Object.hasOwn(CATEGORIES, item.kategori) &&
            (item.tanggal === undefined || (typeof item.tanggal === 'string' && !Number.isNaN(Date.parse(item.tanggal))))
        );

        if (
            !Number.isFinite(data.saldo) ||
            data.saldo < 0 ||
            !transaksiValid
        ) {
            throw new Error('Data yang tersimpan memiliki format tidak valid.');
        }

        saldo = data.saldo;
        transaksiData = data.transaksi.map(item => ({
            ...item,
            tanggal: item.tanggal ?? tanggalLokal()
        }));
    } catch (error) {
        saldo = 0;
        transaksiData = [];
        customCategories = [];
        Object.keys(CATEGORIES).forEach(key => {
            if (!Object.hasOwn(BASE_CATEGORIES, key)) delete CATEGORIES[key];
        });
        renderOpsiKategoriCustom();
        tampilkanErrorPenyimpanan('Data tersimpan rusak atau tidak valid.', error);
    }
}

function simpanData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            saldo,
            transaksi: transaksiData,
            customCategories
        }));
        return true;
    } catch (error) {
        tampilkanErrorPenyimpanan('Gagal menyimpan data ke Local Storage.', error);
        return false;
    }
}

function renderOpsiKategoriCustom() {
    const oldGroup = $selectKategori.querySelector('optgroup[data-custom-categories]');
    oldGroup?.remove();
    customCategories.forEach(tambahkanOpsiKategori);
}

function tambahkanOpsiKategori(category) {
    let group = $selectKategori.querySelector('optgroup[data-custom-categories]');
    if (!group) {
        group = document.createElement('optgroup');
        group.label = 'Kategori kustom';
        group.dataset.customCategories = 'true';
        $selectKategori.append(group);
    }

    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.label;
    group.append(option);
}

muatData();

const pieChart = new Chart(document.getElementById('chart-pengeluaran').getContext('2d'), {
    type: 'pie',
    data: {
        labels: Object.values(CATEGORIES),
        datasets: [{
            data: Array(Object.keys(CATEGORIES).length).fill(0),
            backgroundColor: Object.keys(CATEGORIES).map((_, index) =>
                CATEGORY_COLORS[index % CATEGORY_COLORS.length]
            )
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' }
        }
    }
});

$toggleCategoryForm.addEventListener('click', () => {
    const willOpen = $formKategori.classList.contains('hidden');
    $formKategori.classList.toggle('hidden', !willOpen);
    $toggleCategoryForm.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) $inputKategori.focus();
});

document.getElementById('tambah-kategori').addEventListener('click', tambahKategori);
$inputKategori.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        tambahKategori();
    }
});

function tambahKategori() {
    const label = $inputKategori.value.trim();
    if (!label) {
        $pesanKategori.textContent = 'Masukkan nama kategori.';
        $inputKategori.focus();
        return;
    }

    const duplicate = Object.entries(CATEGORIES).some(([id, category]) =>
        id.toLocaleLowerCase() === label.toLocaleLowerCase() ||
        category.toLocaleLowerCase() === label.toLocaleLowerCase()
    );
    if (duplicate) {
        $pesanKategori.textContent = 'Kategori tersebut sudah ada.';
        $inputKategori.focus();
        return;
    }

    const category = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label
    };
    customCategories.push(category);
    CATEGORIES[category.id] = category.label;
    tambahkanOpsiKategori(category);
    $selectKategori.value = category.id;
    $inputKategori.value = '';
    $pesanKategori.textContent = `Kategori "${label}" berhasil ditambahkan.`;
    simpanData();
    renderTampilan();
    $selectKategori.focus();
}

$cardSaldo.addEventListener('click', event => {
    if (event.target.closest('#form-saldo')) return;
    $formSaldo.classList.remove('hidden');
    $inputSaldo.focus();
});

document.getElementById('tambah-saldo').addEventListener('click', tambahSaldo);
$inputSaldo.addEventListener('keydown', event => {
    if (event.key === 'Enter') tambahSaldo();
});

function tambahSaldo() {
    const jumlah = Number($inputSaldo.value);
    if (!Number.isFinite(jumlah) || jumlah <= 0) {
        alert('Masukkan saldo lebih besar dari 0.');
        return;
    }

    saldo += jumlah;
    simpanData();
    renderTampilan();
    $inputSaldo.value = '';
    $formSaldo.classList.add('hidden');
}

$formTransaksi.addEventListener('submit', event => {
    event.preventDefault();
    tambahTransaksi();
});

function tambahTransaksi() {
    const nama = $inputNama.value.trim();
    const harga = Number($inputHarga.value);
    const kategori = $selectKategori.value;

    if (!nama || !Number.isFinite(harga) || harga <= 0 || !Object.hasOwn(CATEGORIES, kategori)) {
        alert('Isi nama, jumlah yang valid, dan kategori transaksi.');
        return;
    }

    if (harga > saldo) {
        alert('Saldo tidak cukup. Tambahkan saldo terlebih dahulu.');
        return;
    }

    transaksiData.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        nama,
        harga,
        kategori,
        tanggal: tanggalLokal()
    });
    saldo -= harga;
    simpanData();
    renderTampilan();
    $formTransaksi.reset();
    $inputNama.focus();
}

function hapusTransaksi(id) {
    const index = transaksiData.findIndex(item => item.id === id);
    if (index === -1) return;

    saldo += transaksiData[index].harga;
    transaksiData.splice(index, 1);
    simpanData();
    renderTampilan();
}

function urutkanTransaksi(data) {
    const hasil = [...data];
    switch ($sortTransaksi.value) {
        case 'amount-asc':
            return hasil.sort((a, b) => a.harga - b.harga);
        case 'amount-desc':
            return hasil.sort((a, b) => b.harga - a.harga);
        case 'category':
            return hasil.sort((a, b) => CATEGORIES[a.kategori].localeCompare(CATEGORIES[b.kategori]));
        default:
            return hasil.reverse();
    }
}

function renderTransaksiList() {
    $daftarTransaksi.replaceChildren();

    urutkanTransaksi(transaksiData).forEach(item => {
        const row = document.createElement('article');
        row.className = 'transaction-item';

        const info = document.createElement('div');
        info.className = 'trans-info';

        const name = document.createElement('div');
        name.className = 'nama';
        name.textContent = item.nama;

        const amount = document.createElement('div');
        amount.className = 'harga';
        amount.textContent = formatterDolar.format(item.harga);

        const category = document.createElement('span');
        category.className = 'badge-kategori';
        category.textContent = CATEGORIES[item.kategori];

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn-delete';
        deleteButton.type = 'button';
        deleteButton.textContent = 'Hapus';
        deleteButton.addEventListener('click', () => hapusTransaksi(item.id));

        info.append(name, amount, category);
        row.append(info, deleteButton);
        $daftarTransaksi.append(row);
    });
}



function updateChart() {
    const totalPerKategori = Object.fromEntries(
        Object.keys(CATEGORIES).map(category => [category, 0])
    );

    transaksiData.forEach(item => {
        if (Object.hasOwn(totalPerKategori, item.kategori)) {
            totalPerKategori[item.kategori] += item.harga;
        }
    });

    pieChart.data.labels = Object.values(CATEGORIES);
    pieChart.data.datasets[0].data = Object.keys(CATEGORIES).map(category => totalPerKategori[category]);
    pieChart.data.datasets[0].backgroundColor = Object.keys(CATEGORIES).map((_, index) =>
        CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    );
    pieChart.update();
}

function renderRingkasanBulanan() {
    const bulanDipilih = $bulanRingkasan.value;
    const transaksiBulanan = transaksiData.filter(item => item.tanggal.startsWith(bulanDipilih));
    const totalPerKategori = Object.fromEntries(
        Object.keys(CATEGORIES).map(category => [category, 0])
    );

    transaksiBulanan.forEach(item => {
        if (Object.hasOwn(totalPerKategori, item.kategori)) {
            totalPerKategori[item.kategori] += item.harga;
        }
    });

    $totalBulanan.textContent = formatterDolar.format(
        transaksiBulanan.reduce((total, item) => total + item.harga, 0)
    );
    $jumlahTransaksiBulanan.textContent = String(transaksiBulanan.length);
    $rincianKategoriBulanan.replaceChildren();

    Object.entries(CATEGORIES).forEach(([key, label]) => {
        const row = document.createElement('li');
        row.textContent = `${label}: ${formatterDolar.format(totalPerKategori[key])}`;
        $rincianKategoriBulanan.append(row);
    });
}

$sortTransaksi.addEventListener('change', renderTransaksiList);
$bulanRingkasan.addEventListener('change', renderRingkasanBulanan);

function renderTampilan() {
    $totalSaldo.textContent = saldo.toFixed(2);
    renderTransaksiList();
    updateChart();
    renderRingkasanBulanan();
}
$bulanRingkasan.value = tanggalLokal().slice(0, 7);
$bulanRingkasan.value = tanggalLokal().slice(0, 7);
renderTampilan();
