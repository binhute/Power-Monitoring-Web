import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getDatabase,
  ref,
  query,
  orderByKey,
  limitToLast,
  onValue
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ==================== CẤU HÌNH FIREBASE ====================
const firebaseConfig = {
    apiKey: "",
    authDomain: "power-monitoring-c523c.firebaseapp.com",
    databaseURL: "https://power-monitoring-c523c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "power-monitoring-c523c",
    storageBucket: "power-monitoring-c523c.firebasestorage.app",
    messagingSenderId: "797293093488",
    appId: "1:797293093488:web:be519fec0b9820a7630ab5",
    measurementId: "G-6KN4LCX5V6"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==================== DỮ LIỆU ====================
let settings = {
    room1PowerThreshold: 150,
    room2PowerThreshold: 150,
    room1CostThreshold: 150 * 3500,
    room2CostThreshold: 150 * 3500,
};

const roomData = { C000001: {}, C000002: {} };
let paymentData = [];
let energy1 = 0;
let energy2 = 0;
let Voltage1 = 0
let Voltage2 = 0
let electricityPrice = 3500

// ==================== KHỞI TẠO ====================
document.addEventListener('DOMContentLoaded', () => {
    initDateTime();
    initNavigation();
    initCharts();
    initModals();
    loadSettings();
    loadPaymentData();
    renderPaymentTable();
});

// ==================== FIREBASE ====================
onValue(ref(db, "UnitPrice"), snapshot => {
    if (snapshot.exists()) {
        electricityPrice = snapshot.val()
        console.log(electricityPrice)
        updateDashboard()
    }
})

onValue(ref(db, "C000001/Voltage"), snapshot => {
    if (snapshot.exists()) {
        Voltage1 = snapshot.val()
        updateDashboard()
    }
})

const dataRef1 = ref(db, "C000001/Data");
const q1 = query(
    dataRef1,
    orderByKey(),
    limitToLast(1)
);

onValue(q1, (snapshot) => {
  if (!snapshot.exists()) return;

  snapshot.forEach((lastDaySnap) => {

    let lastHourKey = null;
    let lastHourValue = null;

    lastDaySnap.forEach((hourSnap) => {
      lastHourKey = hourSnap.key;
      lastHourValue = hourSnap.val();
    });

    if (lastHourValue !== null) {
      energy1 = lastHourValue;
      console.log("Latest energy 1:", energy1);
      updateDashboard();
    }
  });
});

onValue(ref(db, "C000002/Voltage"), snapshot => {
    if (snapshot.exists()) {
        Voltage2 = snapshot.val();
        updateDashboard();
    }
})

const dataRef2 = ref(db, "C000002/Data");
const q2 = query(
    dataRef2,
    orderByKey(),
    limitToLast(1)
);

onValue(q2, (snapshot) => {
  if (!snapshot.exists()) return;

  snapshot.forEach((lastDaySnap) => {

    let lastHourKey = null;
    let lastHourValue = null;

    lastDaySnap.forEach((hourSnap) => {
      lastHourKey = hourSnap.key;
      lastHourValue = hourSnap.val();
    });

    if (lastHourValue !== null) {
      energy2 = lastHourValue;
      console.log("Latest energy 2:", energy2);
      updateDashboard();
    }
  });
});

// ==================== THỜI GIAN ====================
function initDateTime() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}
function updateDateTime() {
    const now = new Date();
    document.getElementById('currentDate').textContent =
        now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('currentTime').textContent =
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ==================== ĐIỀU HƯỚNG ====================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = {
        dashboardBtn: 'dashboardSection',
        reportBtn: 'reportSection',
        paymentBtn: 'paymentSection'
    };
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            const sectionId = sections[this.id];
            if (sectionId) document.getElementById(sectionId).classList.add('active');
        });
    });
}

// ==================== DASHBOARD ====================
function updateDashboard() {
    document.getElementById('room1Voltage').textContent = Voltage1 + " V";
    document.getElementById('room1Energy').textContent = energy1 + ' kWh';
    document.getElementById('room1Cost').textContent = electricityPrice * energy1 + " VNĐ";

    document.getElementById('room2Voltage').textContent = Voltage2 + " V";
    document.getElementById('room2Energy').textContent = energy2 + " kWh";
    document.getElementById('room2Cost').textContent = electricityPrice * energy2 + " VNĐ";

    updateAlerts();
}

// ==================== TRẠNG THÁI CẢNH BÁO ====================
function updateAlerts() {
    const warn1 = roomData.room101.Warn1 ?? 0;
    const energy1 = roomData.room101.Energy1 ?? 0;
    const threshold1 = roomData.room101.Threshold1 ?? settings.room1PowerThreshold;

    const warn2 = roomData.room102.Warn2 ?? 0;
    const energy2 = roomData.room102.Energy2 ?? 0;
    const threshold2 = roomData.room102.Threshold2 ?? settings.room2PowerThreshold;

    const r1Alert = document.getElementById('room1Alert');
    const r1Msg = document.getElementById('room1AlertMsg');
    const r2Alert = document.getElementById('room2Alert');
    const r2Msg = document.getElementById('room2AlertMsg');

    if (warn1 === 1 || energy1 > threshold1) {
        r1Alert.className = 'param-card alert-card';
        r1Alert.querySelector('.param-icon').textContent = '⚠️';
        r1Msg.textContent = `Vượt ngưỡng ${(threshold1).toFixed(1)} kWh`;
    } else {
        r1Alert.className = 'param-card alert-card success';
        r1Alert.querySelector('.param-icon').textContent = '✅';
        r1Msg.textContent = 'Bình thường';
    }

    if (warn2 === 1 || energy2 > threshold2) {
        r2Alert.className = 'param-card alert-card';
        r2Alert.querySelector('.param-icon').textContent = '⚠️';
        r2Msg.textContent = `Vượt ngưỡng ${(threshold2).toFixed(1)} kWh`;
    } else {
        r2Alert.className = 'param-card alert-card success';
        r2Alert.querySelector('.param-icon').textContent = '✅';
        r2Msg.textContent = 'Bình thường';
    }
}

// ==================== BIỂU ĐỒ ====================
function initCharts() {
    const months = ['Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11'];
    const powerCtx = document.getElementById('powerChart').getContext('2d');
    new Chart(powerCtx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                { label: 'Phòng 101', data: [130, 135, 145, 168], backgroundColor: 'rgba(44,62,80,0.85)', borderRadius: 8 },
                { label: 'Phòng 102', data: [110, 128, 138, 155], backgroundColor: 'rgba(120,144,156,0.85)', borderRadius: 8 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Điện năng (kWh)' } } }
        }
    });

    const costCtx = document.getElementById('costChart').getContext('2d');
    new Chart(costCtx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { label: 'Phòng 101', data: [410000, 472500, 507500, 588000], borderColor: '#2c3e50', backgroundColor: 'rgba(44,62,80,0.1)', tension: 0.4 },
                { label: 'Phòng 102', data: [385000, 448000, 483000, 542500], borderColor: '#78909c', backgroundColor: 'rgba(120,144,156,0.1)', tension: 0.4 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Chi phí (VNĐ)' }, ticks: { callback: v => v.toLocaleString('vi-VN') } } }
        }
    });
}

// ==================== MODALS ====================
function initModals() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const saveSettingsBtn = document.getElementById('saveSettings');
    const addPaymentBtn = document.getElementById('addPaymentBtn');
    const addPaymentModal = document.getElementById('addPaymentModal');
    const savePaymentBtn = document.getElementById('savePayment');

    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'block';
        loadSettingsToForm();
    });
    saveSettingsBtn.addEventListener('click', () => {
        saveSettings();
        settingsModal.style.display = 'none';
    });

    addPaymentBtn.addEventListener('click', () => {
        addPaymentModal.style.display = 'block';
        document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    });
    savePaymentBtn.addEventListener('click', () => {
        addPaymentRecord();
        addPaymentModal.style.display = 'none';
    });

    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', e => {
            document.getElementById(e.target.dataset.modal).style.display = 'none';
        });
    });
    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) e.target.style.display = 'none';
    });
}

// ==================== CÀI ĐẶT NGƯỠNG ====================
function loadSettingsToForm() {
    document.getElementById('room1PowerThreshold').value = settings.room1PowerThreshold;
    document.getElementById('room2PowerThreshold').value = settings.room2PowerThreshold;
    document.getElementById('room1CostThreshold').value = settings.room1CostThreshold;
    document.getElementById('room2CostThreshold').value = settings.room2CostThreshold;
    document.getElementById('electricityPrice').value = settings.electricityPrice;
}

function saveSettings() {
    const r1 = parseFloat(document.getElementById('room1PowerThreshold').value);
    const r2 = parseFloat(document.getElementById('room2PowerThreshold').value);
    const price = parseFloat(document.getElementById('electricityPrice').value);

    settings.electricityPrice = price;
    settings.room1PowerThreshold = r1;
    settings.room2PowerThreshold = r2;
    settings.room1CostThreshold = r1 * price;
    settings.room2CostThreshold = r2 * price;

    document.getElementById('room1CostThreshold').value = settings.room1CostThreshold;
    document.getElementById('room2CostThreshold').value = settings.room2CostThreshold;

    localStorage.setItem('roomMonitorSettings', JSON.stringify(settings));
    database.ref('C000001').update({ Threshold1: r1 });
    database.ref('C000002').update({ Threshold2: r2 });
    database.ref().update({UnitPrice: price});

    alert('✅ Đã lưu & đồng bộ Firebase!');
    updateAlerts();
}

function loadSettings() {
    const saved = localStorage.getItem('roomMonitorSettings');
    if (saved) settings = JSON.parse(saved);
}

// ==================== THANH TOÁN ====================
function loadPaymentData() {
    const saved = localStorage.getItem('paymentData');
    paymentData = saved ? JSON.parse(saved) : [];
}

function savePaymentData() {
    localStorage.setItem('paymentData', JSON.stringify(paymentData));
}

function addPaymentRecord() {
    const date = document.getElementById('paymentDate').value;
    const room = document.getElementById('paymentRoom').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const status = document.getElementById('paymentStatus').value;

    if (!date || !amount) return alert('⚠️ Điền đầy đủ thông tin!');
    const record = { date, room, amount, status };
    paymentData.unshift(record);
    savePaymentData();
    renderPaymentTable();
    alert('✅ Đã thêm bản ghi!');
}

function deletePaymentRecord(index) {
    if (confirm('🗑️ Bạn có chắc muốn xóa bản ghi này không?')) {
        paymentData.splice(index, 1);
        savePaymentData();
        renderPaymentTable();
    }
}

function renderPaymentTable() {
    const tbody = document.getElementById('paymentTableBody');
    tbody.innerHTML = '';
    paymentData.forEach((r, i) => {
        const d = new Date(r.date).toLocaleDateString('vi-VN');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${d}</td>
            <td>Phòng ${r.room}</td>
            <td>${r.amount.toLocaleString('vi-VN')} VNĐ</td>
            <td>
                <select class="status-select" data-index="${i}">
                    <option value="Đã đóng" ${r.status === 'Đã đóng' ? 'selected' : ''}>Đã đóng</option>
                    <option value="Chưa đóng" ${r.status === 'Chưa đóng' ? 'selected' : ''}>Chưa đóng</option>
                </select>
            </td>
            <td><button class="delete-btn" data-index="${i}">🗑️ Xóa</button></td>`;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.status-select').forEach(sel => {
        sel.addEventListener('change', e => {
            const i = e.target.dataset.index;
            paymentData[i].status = e.target.value;
            savePaymentData();
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const i = e.target.dataset.index;
            deletePaymentRecord(i);
        });
    });
}