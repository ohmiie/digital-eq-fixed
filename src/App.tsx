import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  Camera, Settings, Users, LogOut, PackageSearch, 
  History, CheckSquare, AlertCircle, FileDown, FileUp, 
  Printer, Plus, Search, Trash2, Box, ShieldCheck,
  Calendar, Check, X, ShoppingCart, PlusCircle, MinusCircle, Scan
} from 'lucide-react';

// --- Firebase Config ของคุณ ---
const firebaseConfig = {
  apiKey: "AIzaSyBTzr7cnYf1obhr-ulpU6iPL1zNkVIJ6V4",
  authDomain: "digital-graphics-eq.firebaseapp.com",
  projectId: "digital-graphics-eq",
  storageBucket: "digital-graphics-eq.firebasestorage.app",
  messagingSenderId: "482078218981",
  appId: "1:482078218981:web:0e378e8c2f38097074d20c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  // --- States ---
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Data States
  const [equipments, setEquipments] = useState([]);
  const [appUsers, setAppUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // --- Initial Auth & Data Fetching ---
  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Auth error:", err));

    const unsubscribe = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    const unsubEq = onSnapshot(collection(db, 'equipments'), 
      (snap) => setEquipments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      
    const unsubUsr = onSnapshot(collection(db, 'appUsers'), 
      (snap) => setAppUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      
    const unsubTx = onSnapshot(collection(db, 'transactions'), 
      (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubEq(); unsubUsr(); unsubTx(); };
  }, [firebaseUser]);

  // --- Helper Functions ---
  const handleLogout = () => {
    setAppUser(null);
    setCurrentView('login');
  };

  const showMessage = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  if (!firebaseUser) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-orange-500 font-bold">กำลังเชื่อมต่อฐานข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-orange-400" />
          {errorMsg}
        </div>
      )}

      {currentView === 'login' && <LoginScreen appUsers={appUsers} setAppUser={setAppUser} setCurrentView={setCurrentView} showMessage={showMessage} />}
      {currentView === 'admin' && <AdminDashboard appUser={appUser} handleLogout={handleLogout} equipments={equipments} appUsers={appUsers} transactions={transactions} showMessage={showMessage} />}
      {currentView === 'student' && <StudentDashboard appUser={appUser} handleLogout={handleLogout} equipments={equipments} transactions={transactions} showMessage={showMessage} />}
      {currentView === 'teacher' && <TeacherDashboard appUser={appUser} handleLogout={handleLogout} equipments={equipments} transactions={transactions} appUsers={appUsers} showMessage={showMessage} />}
    </div>
  );
}

// ==========================================
// 1. LOGIN SCREEN
// ==========================================
function LoginScreen({ appUsers, setAppUser, setCurrentView, showMessage }) {
  const [loginId, setLoginId] = useState('');
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');

  const handleLogin = () => {
    if (!loginId.trim()) return;
    if (loginId.toLowerCase() === 'admin') {
      setShowAdminPopup(true);
      return;
    }
    const user = appUsers.find(u => u.uid === loginId);
    if (user) {
      setAppUser(user);
      setCurrentView(user.role);
    } else {
      showMessage('ไม่พบรหัสผู้ใช้งานในระบบ');
    }
  };

  const handleAdminLogin = () => {
    if (adminPwd === '995622') {
      setAppUser({ uid: 'admin', role: 'admin', name: 'Administrator' });
      setCurrentView('admin');
    } else {
      showMessage('รหัสผ่าน Admin ไม่ถูกต้อง');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-orange-500">
        <div className="flex justify-center mb-6">
          <div className="bg-orange-100 p-4 rounded-full">
            <Camera className="w-12 h-12 text-orange-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">ระบบยืม-คืนอุปกรณ์</h1>
        <p className="text-center text-gray-500 mb-8">สาขาดิจิทัลกราฟิก</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนักศึกษา / รหัสอาจารย์</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              placeholder="กรอกรหัสประจำตัว (พิมพ์ admin เพื่อตั้งค่า)"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button onClick={handleLogin} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow transition">
            เข้าสู่ระบบ
          </button>
        </div>
      </div>

      {showAdminPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center"><ShieldCheck className="mr-2 text-orange-500"/> ยืนยันสิทธิ์ Admin</h2>
            <input 
              type="password" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              placeholder="รหัสผ่าน"
              value={adminPwd}
              onChange={(e) => setAdminPwd(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowAdminPopup(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">ยกเลิก</button>
              <button onClick={handleAdminLogin} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. ADMIN DASHBOARD
// ==========================================
function AdminDashboard({ appUser, handleLogout, equipments, appUsers, transactions, showMessage }) {
  const [activeTab, setActiveTab] = useState('equipments');

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <div className="w-full md:w-64 bg-white shadow-lg flex flex-col md:flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-100 flex md:flex-col items-center justify-between md:justify-center text-center">
          <div className="flex items-center md:flex-col">
            <div className="bg-orange-100 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mr-3 md:mr-0 md:mx-auto md:mb-2">
              <Settings className="text-orange-500 w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="text-left md:text-center">
              <h2 className="font-bold text-base md:text-lg text-gray-800">ผู้ดูแลระบบ (Admin)</h2>
            </div>
          </div>
          <button onClick={handleLogout} className="md:hidden text-red-500 p-2 hover:bg-red-50 rounded"><LogOut className="w-5 h-5"/></button>
        </div>
        <div className="flex overflow-x-auto md:flex-col flex-1 py-2 md:py-4 hide-scrollbar">
          <NavItem active={activeTab === 'equipments'} onClick={() => setActiveTab('equipments')} icon={<Box className="w-4 h-4 md:w-5 md:h-5" />} label="จัดการอุปกรณ์" />
          <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users className="w-4 h-4 md:w-5 md:h-5" />} label="จัดการผู้ใช้งาน" />
          <NavItem active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<Printer className="w-4 h-4 md:w-5 md:h-5" />} label="รายงาน (Report)" />
        </div>
        <div className="hidden md:block p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center text-red-500 hover:text-red-700 w-full p-2 rounded hover:bg-red-50 transition">
            <LogOut className="w-5 h-5 mr-3" /> ออกจากระบบ
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8">
        {activeTab === 'equipments' && <AdminEquipments equipments={equipments} showMessage={showMessage} />}
        {activeTab === 'users' && <AdminUsers appUsers={appUsers} showMessage={showMessage} />}
        {activeTab === 'reports' && <AdminReports equipments={equipments} appUsers={appUsers} transactions={transactions} />}
      </div>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`flex items-center whitespace-nowrap px-4 py-3 md:px-6 md:py-3 transition-colors ${active ? 'bg-orange-50 text-orange-600 border-b-4 md:border-b-0 md:border-r-4 border-orange-500' : 'text-gray-600 hover:bg-gray-50'}`}>
      <span className="mr-2 md:mr-3">{icon}</span><span className="font-medium text-sm md:text-base">{label}</span>
    </button>
  );
}

// --- Admin: Equipments ---
function AdminEquipments({ equipments, showMessage }) {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', category: '', totalQty: 1 });

  const categorySummary = useMemo(() => {
    const summary = {};
    equipments.forEach(eq => {
      if (!summary[eq.category]) summary[eq.category] = { total: 0, available: 0 };
      summary[eq.category].total += (Number(eq.totalQty) || 0);
      summary[eq.category].available += (Number(eq.availableQty) || 0);
    });
    return Object.entries(summary).map(([category, counts]) => ({ category, ...counts }));
  }, [equipments]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.id || !formData.name || !formData.category) return showMessage("กรุณากรอกข้อมูลให้ครบ");
    try {
      await setDoc(doc(db, 'equipments', formData.id), {
        equipId: formData.id,
        name: formData.name,
        category: formData.category,
        totalQty: parseInt(formData.totalQty),
        availableQty: parseInt(formData.totalQty)
      });
      showMessage("บันทึกอุปกรณ์สำเร็จ");
      setShowAdd(false);
      setFormData({ id: '', name: '', category: '', totalQty: 1 });
    } catch (err) { showMessage("เกิดข้อผิดพลาด"); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("ยืนยันการลบอุปกรณ์?")) {
      try {
        await deleteDoc(doc(db, 'equipments', id));
        showMessage("ลบอุปกรณ์แล้ว");
      } catch (err) { showMessage("เกิดข้อผิดพลาดในการลบ"); }
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFFรหัสอุปกรณ์,ชื่ออุปกรณ์,หมวดหมู่,จำนวนทั้งหมด\nEQ001,Camera Sony A7IV,กล้อง,5\nEQ002,Lens 24-70 f2.8,เลนส์,2";
    const link = document.createElement("a");
    link.href = encodeURI(csvContent); link.download = "template_equipment.csv"; link.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const lines = evt.target.result.split('\n').filter(l => l.trim() !== '');
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length >= 4) {
          const eqId = cols[0].trim();
          const qty = parseInt(cols[3].trim()) || 0;
          await setDoc(doc(db, 'equipments', eqId), {
            equipId: eqId, name: cols[1].trim(), category: cols[2].trim(), totalQty: qty, availableQty: qty
          });
          count++;
        }
      }
      showMessage(`นำเข้าข้อมูลสำเร็จ ${count} รายการ`);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h3 className="text-xl font-bold text-gray-800">จัดการอุปกรณ์</h3>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={downloadTemplate} className="bg-gray-100 text-gray-700 px-3 py-2 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-200 flex items-center"><FileDown className="w-4 h-4 mr-1"/> เทมเพลต CSV</button>
          <label className="bg-gray-100 text-gray-700 px-3 py-2 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-200 flex items-center cursor-pointer">
            <FileUp className="w-4 h-4 mr-1"/> อัปโหลด CSV<input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
          <button onClick={() => setShowAdd(!showAdd)} className="bg-orange-500 text-white px-3 py-2 text-sm rounded-lg hover:bg-orange-600 transition flex items-center"><Plus className="w-4 h-4 mr-1"/> เพิ่มอุปกรณ์</button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {categorySummary.map(stat => (
          <div key={stat.category} className="bg-orange-50 border border-orange-200 p-3 rounded-xl flex justify-between items-center">
            <span className="font-bold text-gray-800 text-sm">{stat.category}</span>
            <div className="text-right text-xs"><div>ทั้งหมด: <span className="font-bold text-gray-800">{stat.total}</span></div><div>พร้อมยืม: <span className="font-bold text-green-600">{stat.available}</span></div></div>
          </div>
        ))}
      </div>

      {showAdd && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end border border-gray-200">
          <div><label className="text-xs text-gray-500 mb-1 block">รหัสอุปกรณ์</label><input required value={formData.id} onChange={e=>setFormData({...formData, id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-orange-500"/></div>
          <div className="md:col-span-2"><label className="text-xs text-gray-500 mb-1 block">ชื่ออุปกรณ์</label><input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-orange-500"/></div>
          <div><label className="text-xs text-gray-500 mb-1 block">หมวดหมู่</label><input required value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-orange-500"/></div>
          <div className="flex space-x-2 items-end">
            <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">จำนวน</label><input required type="number" min="1" value={formData.totalQty} onChange={e=>setFormData({...formData, totalQty: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-orange-500"/></div>
            <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium h-[42px]">บันทึก</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead><tr className="bg-gray-100 text-gray-600 text-sm border-b"><th className="p-3">รหัสอุปกรณ์</th><th className="p-3">ชื่ออุปกรณ์</th><th className="p-3">หมวดหมู่</th><th className="p-3">ทั้งหมด</th><th className="p-3">พร้อมยืม</th><th className="p-3 text-center">จัดการ</th></tr></thead>
          <tbody>
            {equipments.map(eq => (
              <tr key={eq.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium text-sm">{eq.equipId}</td><td className="p-3 font-medium text-gray-800 text-sm">{eq.name}</td>
                <td className="p-3"><span className="px-2 py-1 bg-gray-200 text-xs rounded-full">{eq.category}</span></td>
                <td className="p-3">{eq.totalQty}</td><td className="p-3 text-green-600 font-bold">{eq.availableQty}</td>
                <td className="p-3 text-center"><button onClick={() => handleDelete(eq.id)} className="text-red-500 hover:bg-red-100 p-2 rounded-full"><Trash2 className="w-4 h-4"/></button></td>
              </tr>
            ))}
            {equipments.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-gray-500">ไม่มีข้อมูลอุปกรณ์</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Admin: Users ---
function AdminUsers({ appUsers, showMessage }) {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ uid: '', name: '', role: 'student', branch: '', level: '', room: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.uid || !formData.name) return showMessage("กรุณากรอกรหัสและชื่อ");
    try {
      await setDoc(doc(db, 'appUsers', formData.uid), formData);
      showMessage("บันทึกผู้ใช้งานสำเร็จ"); setShowAdd(false); setFormData({ uid: '', name: '', role: 'student', branch: '', level: '', room: '' });
    } catch (err) { showMessage("เกิดข้อผิดพลาด"); }
  };

  const handleDelete = async (uid) => {
    if(window.confirm("ยืนยันการลบผู้ใช้?")) {
      try { await deleteDoc(doc(db, 'appUsers', uid)); showMessage("ลบผู้ใช้งานแล้ว"); } 
      catch (err) { showMessage("เกิดข้อผิดพลาดในการลบ"); }
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFFรหัสผู้ใช้,ชื่อ-นามสกุล,บทบาท(student/teacher),สาขา,ระดับชั้น,ห้อง\n650001,นายเรียนดี มีชัย,student,ดิจิทัลกราฟิก,ปวช.2,1\nT001,อ.ใจดี ศรีสมบูรณ์,teacher,,,";
    const link = document.createElement("a"); link.href = encodeURI(csvContent); link.download = "template_users.csv"; link.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const lines = evt.target.result.split('\n').filter(l => l.trim() !== '');
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length >= 3) {
          const uid = cols[0].trim();
          await setDoc(doc(db, 'appUsers', uid), {
            uid, name: cols[1].trim(), role: cols[2].trim() || 'student', branch: cols[3]?cols[3].trim():'', level: cols[4]?cols[4].trim():'', room: cols[5]?cols[5].trim():''
          });
          count++;
        }
      }
      showMessage(`นำเข้าผู้ใช้สำเร็จ ${count} รายการ`); e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h3 className="text-xl font-bold text-gray-800">จัดการผู้ใช้งาน</h3>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={downloadTemplate} className="bg-gray-100 text-gray-700 px-3 py-2 text-sm rounded-lg hover:bg-gray-200 transition border flex items-center"><FileDown className="w-4 h-4 mr-1"/> เทมเพลต CSV</button>
          <label className="bg-gray-100 text-gray-700 px-3 py-2 text-sm rounded-lg hover:bg-gray-200 transition border flex items-center cursor-pointer">
            <FileUp className="w-4 h-4 mr-1"/> อัปโหลด CSV<input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
          <button onClick={() => setShowAdd(!showAdd)} className="bg-orange-500 text-white px-3 py-2 text-sm rounded-lg hover:bg-orange-600 transition flex items-center"><Plus className="w-4 h-4 mr-1"/> เพิ่มผู้ใช้</button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end border border-gray-200">
          <div><label className="text-xs text-gray-500 mb-1 block">รหัสประจำตัว</label><input required value={formData.uid} onChange={e=>setFormData({...formData, uid: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-orange-500"/></div>
          <div><label className="text-xs text-gray-500 mb-1 block">ชื่อ-นามสกุล</label><input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-orange-500"/></div>
          <div><label className="text-xs text-gray-500 mb-1 block">บทบาท</label>
            <select value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:border-orange-500">
              <option value="student">นักเรียน (Student)</option><option value="teacher">อาจารย์ (Teacher)</option>
            </select>
          </div>
          {formData.role === 'student' && (
            <>
              <div><label className="text-xs text-gray-500 mb-1 block">สาขา</label><input value={formData.branch} onChange={e=>setFormData({...formData, branch: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="ดิจิทัลกราฟิก"/></div>
              <div><label className="text-xs text-gray-500 mb-1 block">ระดับชั้น</label><input value={formData.level} onChange={e=>setFormData({...formData, level: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="ปวช.2"/></div>
              <div><label className="text-xs text-gray-500 mb-1 block">ห้อง</label><input value={formData.room} onChange={e=>setFormData({...formData, room: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="1"/></div>
            </>
          )}
          <div className="md:col-span-4 flex justify-end"><button type="submit" className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 h-[42px]">บันทึก</button></div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead><tr className="bg-gray-100 text-gray-600 text-sm border-b"><th className="p-3">รหัส</th><th className="p-3">ชื่อ-นามสกุล</th><th className="p-3">บทบาท</th><th className="p-3">ข้อมูลเพิ่มเติม</th><th className="p-3 text-center">จัดการ</th></tr></thead>
          <tbody>
            {appUsers.map(user => (
              <tr key={user.uid} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-800">{user.uid}</td><td className="p-3 text-sm">{user.name}</td>
                <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full font-medium ${user.role === 'teacher' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-700'}`}>{user.role === 'teacher' ? 'อาจารย์' : 'นักเรียน'}</span></td>
                <td className="p-3 text-sm text-gray-500">{user.role === 'student' ? `${user.branch||'-'} ${user.level||'-'} ห้อง ${user.room||'-'}` : '-'}</td>
                <td className="p-3 text-center"><button onClick={() => handleDelete(user.uid)} className="text-red-500 hover:bg-red-100 p-2 rounded-full"><Trash2 className="w-4 h-4"/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Admin: Reports ---
function AdminReports({ equipments, appUsers, transactions }) {
  const exportToCSV = (dataList, headers, filename) => {
    let csvStr = "\uFEFF" + headers.join(",") + "\n";
    dataList.forEach(row => { csvStr += row.map(v => `"${v || ''}"`).join(",") + "\n"; });
    const link = document.createElement("a"); link.href = encodeURI("data:text/csv;charset=utf-8," + csvStr); link.download = filename; link.click();
  };

  const handleExportEq = () => exportToCSV(equipments.map(eq => [eq.equipId, eq.name, eq.category, eq.totalQty, eq.availableQty]), ['รหัส', 'ชื่ออุปกรณ์', 'หมวดหมู่', 'ทั้งหมด', 'คงเหลือ'], 'equipment_report.csv');
  const handleExportTx = () => exportToCSV(transactions.map(tx => [tx.studentId, tx.studentName, tx.equipName, tx.status, new Date(tx.borrowDate).toLocaleString('th-TH'), tx.teacherRemarks || '', tx.returnRemarks || '']), ['รหัส นศ.', 'ชื่อ', 'อุปกรณ์', 'สถานะ', 'วันที่ยืม', 'หมายเหตุอาจารย์', 'หมายเหตุตอนคืน'], 'transaction_report.csv');

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 print:shadow-none print:m-0 print:p-0">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h3 className="text-xl font-bold text-gray-800">รายงานข้อมูลระบบ</h3>
        <button onClick={() => window.print()} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg border flex items-center hover:bg-gray-200"><Printer className="w-4 h-4 mr-2"/> พิมพ์รายงาน</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:hidden">
        <div className="p-6 border rounded-xl bg-gray-50 flex justify-between items-center">
          <div><h4 className="font-bold text-gray-800">รายงานอุปกรณ์</h4><p className="text-sm text-gray-500">ข้อมูลสต๊อกทั้งหมด</p></div>
          <button onClick={handleExportEq} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">Export Excel</button>
        </div>
        <div className="p-6 border rounded-xl bg-gray-50 flex justify-between items-center">
          <div><h4 className="font-bold text-gray-800">รายงานการยืม-คืน</h4><p className="text-sm text-gray-500">ประวัติการทำรายการ</p></div>
          <button onClick={handleExportTx} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">Export Excel</button>
        </div>
      </div>
      
      {/* Print View */}
      <div className="hidden print:block text-center">
         <h2 className="text-2xl font-bold mb-4">รายงานสรุปภาพรวมระบบ ยืม-คืนอุปกรณ์</h2>
         <p className="mb-4">ผู้เรียนทั้งหมด: {appUsers.filter(u=>u.role==='student').length} คน | อุปกรณ์ในระบบ: {equipments.length} รายการ | กำลังถูกยืม: {transactions.filter(t=>t.status==='approved').length} รายการ</p>
      </div>
    </div>
  );
}

// ==========================================
// 3. STUDENT DASHBOARD
// ==========================================
function StudentDashboard({ appUser, handleLogout, equipments, transactions, showMessage }) {
  const [activeTab, setActiveTab] = useState('borrow');

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar user={appUser} onLogout={handleLogout} />
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex space-x-6 overflow-x-auto hide-scrollbar">
          <TabButton active={activeTab==='borrow'} onClick={()=>setActiveTab('borrow')} icon={<Camera className="w-4 h-4"/>} label="ยืมอุปกรณ์" />
          <TabButton active={activeTab==='browse'} onClick={()=>setActiveTab('browse')} icon={<PackageSearch className="w-4 h-4"/>} label="ค้นดูอุปกรณ์" />
          <TabButton active={activeTab==='history'} onClick={()=>setActiveTab('history')} icon={<History className="w-4 h-4"/>} label="ประวัติการยืม-คืน" />
        </div>
      </div>
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6">
        {activeTab === 'borrow' && <StudentBorrow appUser={appUser} equipments={equipments} transactions={transactions} showMessage={showMessage}/>}
        {activeTab === 'browse' && <SharedBrowse equipments={equipments} />}
        {activeTab === 'history' && <StudentHistory appUser={appUser} transactions={transactions} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${active ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
      <span className="mr-2">{icon}</span> {label}
    </button>
  );
}

function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center font-bold text-lg tracking-wide"><Camera className="text-orange-500 mr-2" /> Digital<span className="text-orange-500">Eq</span></div>
        <div className="flex items-center space-x-4">
          <div className="text-right text-sm"><p className="font-semibold">{user.name}</p><p className="text-gray-400 text-xs hidden sm:block">{user.role === 'teacher' ? 'อาจารย์' : 'นักเรียน'}</p></div>
          <button onClick={onLogout} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full"><LogOut className="w-5 h-5 text-gray-200" /></button>
        </div>
      </div>
    </nav>
  );
}

// --- Student: Borrow ---
function StudentBorrow({ appUser, equipments, transactions, showMessage }) {
  const [scanId, setScanId] = useState('');
  const [cart, setCart] = useState([]);
  const [returnDate, setReturnDate] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const activeTx = transactions.filter(t => t.studentId === appUser.uid && (t.status === 'pending' || t.status === 'approved'));
  const activeCount = activeTx.length;
  const cartCount = cart.reduce((sum, item) => sum + item.borrowQty, 0);
  const totalRequested = activeCount + cartCount;
  const canBorrowMore = totalRequested < 4;

  const handleScanLogic = (scannedText) => {
    const targetId = typeof scannedText === 'string' ? scannedText : scanId;
    if (!targetId.trim()) return;
    
    if (totalRequested >= 4) { showMessage("คุณยืมอุปกรณ์ครบโควต้า 4 ชิ้นแล้ว"); setScanId(''); return; }

    const eq = equipments.find(e => e.equipId.toLowerCase() === targetId.toLowerCase());
    if (!eq) { showMessage("ไม่พบอุปกรณ์รหัสนี้"); setScanId(''); return; }
    if (eq.availableQty === 0) { showMessage("อุปกรณ์ถูกยืมจนหมดแล้ว ไม่สามารถยืมได้"); setScanId(''); return; }

    const existingIdx = cart.findIndex(c => c.equipId === eq.equipId);
    if (existingIdx >= 0) {
      if (cart[existingIdx].borrowQty + 1 > eq.availableQty) { showMessage(`เหลือให้ยืมเพียง ${eq.availableQty} ชิ้น`); return; }
      const newCart = [...cart]; newCart[existingIdx].borrowQty += 1; setCart(newCart);
    } else { setCart([...cart, { ...eq, borrowQty: 1 }]); }
    setScanId('');
  };

  const handleRemoveItem = (equipId) => setCart(cart.filter(item => item.equipId !== equipId));
  const handleUpdateQty = (equipId, delta) => {
    const newCart = [...cart];
    const idx = newCart.findIndex(c => c.equipId === equipId);
    if (idx >= 0) {
      const newQty = newCart[idx].borrowQty + delta;
      if (newQty <= 0) handleRemoveItem(equipId);
      else if (newQty > newCart[idx].availableQty) showMessage(`เหลือให้ยืมเพียง ${newCart[idx].availableQty} ชิ้น`);
      else if (activeCount + cartCount - newCart[idx].borrowQty + newQty > 4) showMessage("ยืมเกินโควต้า 4 ชิ้นไม่ได้");
      else { newCart[idx].borrowQty = newQty; setCart(newCart); }
    }
  };

  const handleBorrow = async () => {
    if (cart.length === 0) return;
    if (!returnDate) return showMessage("กรุณาเลือกวันเวลาที่คาดว่าจะคืน");
    try {
      for (const item of cart) {
        for (let i = 0; i < item.borrowQty; i++) {
          await addDoc(collection(db, 'transactions'), {
            studentId: appUser.uid, studentName: appUser.name, equipId: item.equipId, equipName: item.name,
            borrowDate: new Date().toISOString(), expectedReturnDate: returnDate, status: 'pending', teacherRemarks: '', returnRemarks: ''
          });
        }
      }
      showMessage(`ส่งคำขอยืมอุปกรณ์ ${cartCount} ชิ้น เรียบร้อยแล้ว รออาจารย์อนุมัติ`); setCart([]); setReturnDate('');
    } catch (err) { showMessage("เกิดข้อผิดพลาดในการทำรายการ"); }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 w-full">
      <div className="flex flex-col md:flex-row justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center"><Camera className="mr-2 text-orange-500"/> ทำรายการยืมอุปกรณ์</h2>
        <div className="mt-2 text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600">โควต้าคงเหลือ: <span className="text-orange-600 font-bold">{4 - activeCount}</span>/4 ชิ้น</div>
      </div>
      
      {!canBorrowMore && cart.length === 0 && <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6"><p className="text-red-700">คุณยืมอุปกรณ์ครบโควต้า 4 ชิ้นแล้ว</p></div>}

      <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <label className="block text-sm text-gray-700 mb-2 font-medium">สแกน Barcode หรือพิมพ์รหัสอุปกรณ์</label>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex flex-1 space-x-2">
            <button onClick={() => setIsScanning(true)} disabled={!canBorrowMore} className={`px-4 py-2 rounded-lg flex items-center font-bold ${canBorrowMore ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-400'}`}><Scan className="w-5 h-5 sm:mr-1" /> <span className="hidden sm:inline">สแกนกล้อง</span></button>
            <input type="text" className="flex-1 px-4 py-2 border rounded-lg outline-none focus:border-orange-500" placeholder="EQ001" value={scanId} onChange={(e) => setScanId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleScanLogic()} disabled={!canBorrowMore}/>
          </div>
          <button onClick={() => handleScanLogic()} disabled={!canBorrowMore} className={`px-6 py-2 rounded-lg w-full sm:w-auto font-bold ${canBorrowMore ? 'bg-gray-800 text-white' : 'bg-gray-300 text-gray-500'}`}><Plus className="w-5 h-5 mr-1 inline"/> เพิ่ม</button>
        </div>
      </div>

      {isScanning && <CameraScanner onScan={(txt) => { setIsScanning(false); handleScanLogic(txt); }} onClose={() => setIsScanning(false)} />}

      {cart.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center"><ShoppingCart className="w-5 h-5 mr-2 text-gray-500"/> ตะกร้าอุปกรณ์ที่จะยืม ({cartCount} ชิ้น)</h3>
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.equipId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-orange-200 bg-orange-50 rounded-xl">
                <div><h4 className="font-bold">{item.name}</h4><p className="text-xs text-gray-500">{item.equipId} | {item.category}</p></div>
                <div className="flex items-center space-x-4 mt-3 sm:mt-0 w-full sm:w-auto justify-between">
                  <div className="flex items-center bg-white px-2 py-1 rounded-lg border shadow-sm">
                    <button onClick={() => handleUpdateQty(item.equipId, -1)} className="text-gray-400 hover:text-orange-500"><MinusCircle className="w-5 h-5"/></button>
                    <span className="font-bold w-6 text-center">{item.borrowQty}</span>
                    <button onClick={() => handleUpdateQty(item.equipId, 1)} className="text-gray-400 hover:text-orange-500"><PlusCircle className="w-5 h-5"/></button>
                  </div>
                  <button onClick={() => handleRemoveItem(item.equipId)} className="text-red-500"><Trash2 className="w-5 h-5"/></button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 border rounded-xl bg-white">
             <label className="block text-sm font-bold mb-2">กำหนดวันคืน</label>
             <input type="datetime-local" className="w-full px-4 py-3 border rounded-lg mb-4 outline-none focus:border-orange-500 bg-gray-50" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
             <button onClick={handleBorrow} className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold">ยืนยันการยืมอุปกรณ์ ({cartCount} ชิ้น)</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Shared: Browse Equipment ---
function SharedBrowse({ equipments }) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTxt, setSearchTxt] = useState('');

  const categories = ['all', ...new Set(equipments.map(e => e.category))];
  const categorySummary = useMemo(() => {
    const summary = {};
    equipments.forEach(eq => {
      if (!summary[eq.category]) summary[eq.category] = { total: 0, available: 0 };
      summary[eq.category].total += (Number(eq.totalQty) || 0); summary[eq.category].available += (Number(eq.availableQty) || 0);
    });
    return Object.entries(summary).map(([category, counts]) => ({ category, ...counts }));
  }, [equipments]);

  const filteredEq = equipments.filter(e => (categoryFilter === 'all' || e.category === categoryFilter) && (e.name.toLowerCase().includes(searchTxt.toLowerCase()) || e.equipId.toLowerCase().includes(searchTxt.toLowerCase())));

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="mb-6 bg-orange-50 p-4 rounded-xl border border-orange-100">
        <h3 className="font-bold mb-3 flex items-center"><Box className="w-5 h-5 mr-2 text-orange-500" /> สรุปจำนวนอุปกรณ์</h3>
        <div className="flex overflow-x-auto space-x-3 pb-2 hide-scrollbar">
          {categorySummary.map(stat => (
            <div key={stat.category} className="min-w-[120px] bg-white border p-3 rounded-lg shadow-sm text-center">
              <h4 className="font-bold">{stat.category}</h4>
              <div className="text-xs mt-1 flex justify-center space-x-2"><span>รวม: <b>{stat.total}</b></span><span>ว่าง: <b className="text-green-600">{stat.available}</b></span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col md:flex-row mb-6 space-y-3 md:space-y-0 md:space-x-4">
        <div className="flex-1 relative"><Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" /><input type="text" placeholder="ค้นหาชื่อหรือรหัส..." className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:border-orange-500" value={searchTxt} onChange={(e) => setSearchTxt(e.target.value)}/></div>
        <select className="w-full md:w-48 px-4 py-2 border rounded-lg bg-white outline-none focus:border-orange-500" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">ทุกหมวดหมู่</option>{categories.filter(c=>c!=='all').map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEq.map(eq => {
          const isAvail = eq.availableQty > 0;
          return (
            <div key={eq.id} className={`p-4 rounded-xl border ${isAvail ? 'bg-white' : 'bg-gray-50 opacity-70 grayscale'}`}>
              <h4 className="font-bold line-clamp-1 mb-2">{eq.name}</h4><p className="text-xs text-gray-500 mb-4">{eq.equipId} • {eq.category}</p>
              <div className="flex justify-between items-center"><span className="text-sm">ทั้งหมด: {eq.totalQty}</span><span className={`px-2 py-1 rounded-full text-xs font-bold ${isAvail ? 'bg-orange-100 text-orange-600' : 'bg-gray-200'}`}>{isAvail ? `พร้อมยืม: ${eq.availableQty}` : 'หมด'}</span></div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

// --- Student: History ---
function StudentHistory({ appUser, transactions }) {
  const myTx = transactions.filter(t => t.studentId === appUser.uid).sort((a,b) => new Date(b.borrowDate) - new Date(a.borrowDate));
  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-4">ประวัติการยืม-คืนของฉัน</h2>
      <div className="space-y-4">
        {myTx.map(tx => (
          <div key={tx.id} className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col md:flex-row md:justify-between md:items-center">
            <div><h4 className="font-bold">{tx.equipName}</h4><p className="text-xs text-gray-500 mt-1">ยืม: {new Date(tx.borrowDate).toLocaleString('th-TH')}</p></div>
            <div className="mt-2 md:mt-0 flex flex-col items-start md:items-end">
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${tx.status==='approved'?'bg-blue-100 text-blue-700':tx.status==='returned'?'bg-green-100 text-green-700':tx.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{tx.status}</span>
              {tx.returnRemarks && <p className="text-xs mt-1 text-orange-600">คืน: {tx.returnRemarks}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 4. TEACHER DASHBOARD
// ==========================================
function TeacherDashboard({ appUser, handleLogout, equipments, transactions, appUsers, showMessage }) {
  const [activeTab, setActiveTab] = useState('approve');
  const pendingTx = transactions.filter(t => t.status === 'pending');
  const activeTx = transactions.filter(t => t.status === 'approved');
  const overdueTx = activeTx.filter(t => new Date(t.expectedReturnDate) < new Date());

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar user={appUser} onLogout={handleLogout} />
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex space-x-6 overflow-x-auto hide-scrollbar">
          <TabButton active={activeTab==='approve'} onClick={()=>setActiveTab('approve')} icon={<CheckSquare className="w-4 h-4"/>} label={`อนุมัติยืม (${pendingTx.length})`} />
          <TabButton active={activeTab==='return'} onClick={()=>setActiveTab('return')} icon={<Calendar className="w-4 h-4"/>} label="ตรวจรับคืน" />
          <TabButton active={activeTab==='history'} onClick={()=>setActiveTab('history')} icon={<History className="w-4 h-4"/>} label="ประวัติทั้งหมด" />
          <TabButton active={activeTab==='browse'} onClick={()=>setActiveTab('browse')} icon={<PackageSearch className="w-4 h-4"/>} label="ค้นดูอุปกรณ์" />
        </div>
      </div>
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        {overdueTx.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4"><h3 className="text-red-700 font-bold flex items-center mb-2"><AlertCircle className="w-5 h-5 mr-2"/> อุปกรณ์เลยกำหนดส่ง</h3><ul className="text-sm text-red-600 ml-7">{overdueTx.map(tx => <li key={`alert-${tx.id}`}>- {tx.studentName} : {tx.equipName}</li>)}</ul></div>
        )}
        {activeTab === 'approve' && <TeacherApprove equipments={equipments} pendingTx={pendingTx} showMessage={showMessage}/>}
        {activeTab === 'return' && <TeacherReturn equipments={equipments} activeTx={activeTx} showMessage={showMessage}/>}
        {activeTab === 'history' && <TeacherAllHistory transactions={transactions} />}
        {activeTab === 'browse' && <SharedBrowse equipments={equipments} />}
      </div>
    </div>
  );
}

function TeacherApprove({ equipments, pendingTx, showMessage }) {
  const [selectedTx, setSelectedTx] = useState(null);
  const [remark, setRemark] = useState('');
  const [isDamaged, setIsDamaged] = useState(false);

  const handleApprove = async () => {
    if (!selectedTx) return;
    const eq = equipments.find(e => e.equipId === selectedTx.equipId);
    if (!eq || eq.availableQty <= 0) return showMessage("ไม่สามารถอนุมัติได้ อุปกรณ์ในสต๊อกหมดแล้ว");

    try {
      await updateDoc(doc(db, 'transactions', selectedTx.id), { status: 'approved', teacherRemarks: isDamaged ? `ชำรุดแต่ยืมได้: ${remark}` : remark });
      await updateDoc(doc(db, 'equipments', eq.id), { availableQty: eq.availableQty - 1 });
      showMessage("อนุมัติการยืมเรียบร้อยแล้ว"); setSelectedTx(null); setRemark(''); setIsDamaged(false);
    } catch (err) { showMessage("เกิดข้อผิดพลาด"); }
  };

  const handleReject = async (id) => {
    try { await updateDoc(doc(db, 'transactions', id), { status: 'rejected' }); showMessage("ปฏิเสธการยืมแล้ว"); } catch (err) { showMessage("เกิดข้อผิดพลาด"); }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-4">รายการรออนุมัติ</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left min-w-[500px]">
          <thead><tr className="bg-gray-50 border-b text-sm"><th className="p-3">นักเรียน</th><th className="p-3">อุปกรณ์</th><th className="p-3">วันที่ขอ</th><th className="p-3 text-center">จัดการ</th></tr></thead>
          <tbody>
            {pendingTx.map(tx => (
              <tr key={tx.id} className="border-b"><td className="p-3 text-sm">{tx.studentName}</td><td className="p-3 text-orange-600 font-medium text-sm">{tx.equipName}</td><td className="p-3 text-xs text-gray-500">{new Date(tx.borrowDate).toLocaleString('th-TH')}</td>
                <td className="p-3 flex justify-center space-x-2"><button onClick={() => setSelectedTx(tx)} className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg">อนุมัติ</button><button onClick={() => handleReject(tx.id)} className="px-3 py-1 bg-gray-200 text-xs rounded-lg">ปฏิเสธ</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedTx && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">ยืนยันการอนุมัติให้ {selectedTx.studentName}</h3>
            <label className="flex items-center space-x-2 text-sm bg-orange-50 p-2 rounded mb-4"><input type="checkbox" checked={isDamaged} onChange={(e) => setIsDamaged(e.target.checked)} className="rounded text-orange-500"/><span>อุปกรณ์ชำรุดแต่ยืมได้</span></label>
            <textarea className="w-full px-3 py-2 border rounded-lg mb-4" rows="2" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="หมายเหตุ..."></textarea>
            <div className="flex justify-end space-x-2"><button onClick={() => setSelectedTx(null)} className="px-4 py-2 bg-gray-100 rounded-lg">ยกเลิก</button><button onClick={handleApprove} className="px-4 py-2 bg-orange-500 text-white rounded-lg">ยืนยันอนุมัติ</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherReturn({ equipments, activeTx, showMessage }) {
  const [selectedTx, setSelectedTx] = useState(null);
  const [returnStatus, setReturnStatus] = useState('ปกติ');
  const [customRemark, setCustomRemark] = useState('');
  const statusOptions = ['ปกติ', 'ชำรุดบางส่วน', 'สูญหายบางส่วน', 'สูญหายทั้งหมด', 'ต้องส่งซ่อม', 'ส่งคืนไม่ครบ'];

  const handleReturn = async () => {
    if (!selectedTx) return;
    try {
      const finalRemark = returnStatus === 'ปกติ' ? 'ปกติ' : `${returnStatus} ${customRemark ? `(${customRemark})` : ''}`;
      await updateDoc(doc(db, 'transactions', selectedTx.id), { status: 'returned', actualReturnDate: new Date().toISOString(), returnRemarks: finalRemark });
      if (returnStatus !== 'สูญหายทั้งหมด') {
        const eqDoc = equipments.find(e => e.equipId === selectedTx.equipId);
        if (eqDoc) await updateDoc(doc(db, 'equipments', eqDoc.id), { availableQty: eqDoc.availableQty + 1 });
      }
      showMessage("รับคืนอุปกรณ์เรียบร้อยแล้ว"); setSelectedTx(null); setReturnStatus('ปกติ'); setCustomRemark('');
    } catch (err) { showMessage("เกิดข้อผิดพลาดในการรับคืน"); }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-4">รับคืนอุปกรณ์</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left min-w-[500px]">
          <thead><tr className="bg-gray-50 border-b text-sm"><th className="p-3">นักเรียน</th><th className="p-3">อุปกรณ์</th><th className="p-3">กำหนดคืน</th><th className="p-3 text-center">จัดการ</th></tr></thead>
          <tbody>
            {activeTx.map(tx => (
              <tr key={tx.id} className="border-b"><td className="p-3 text-sm">{tx.studentName}</td><td className="p-3 text-orange-600 font-medium text-sm">{tx.equipName}</td><td className="p-3 text-xs text-red-500">{new Date(tx.expectedReturnDate).toLocaleString('th-TH')}</td>
                <td className="p-3 text-center"><button onClick={() => setSelectedTx(tx)} className="px-4 py-1.5 bg-green-500 text-white text-xs rounded-lg">รับคืน</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedTx && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">ตรวจรับคืนจาก {selectedTx.studentName}</h3>
            <select className="w-full px-3 py-2 border rounded-lg mb-3 bg-white" value={returnStatus} onChange={(e) => setReturnStatus(e.target.value)}>{statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
            {returnStatus !== 'ปกติ' && <textarea className="w-full px-3 py-2 border rounded-lg mb-3" rows="2" value={customRemark} onChange={(e) => setCustomRemark(e.target.value)} placeholder="รายละเอียดความเสียหาย..."></textarea>}
            <div className="flex justify-end space-x-2"><button onClick={() => setSelectedTx(null)} className="px-4 py-2 bg-gray-100 rounded-lg">ยกเลิก</button><button onClick={handleReturn} className="px-4 py-2 bg-green-500 text-white rounded-lg">ยืนยันรับคืน</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherAllHistory({ transactions }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const sortedTx = [...transactions].sort((a,b) => new Date(b.borrowDate) - new Date(a.borrowDate));
  const filtered = sortedTx.filter(t => {
    const matchSearch = t.studentName.includes(search) || t.equipName.includes(search) || t.studentId.includes(search);
    const matchFilter = filter === 'all' || t.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between mb-6 space-y-2 md:space-y-0 md:space-x-4">
        <input type="text" placeholder="ค้นหาชื่อ, รหัสนักเรียน, อุปกรณ์..." className="flex-1 px-4 py-2 border rounded-lg outline-none focus:border-orange-500" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className="px-4 py-2 border rounded-lg outline-none bg-white" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">ทุกสถานะ</option><option value="pending">รออนุมัติ</option><option value="approved">กำลังยืม</option><option value="returned">คืนแล้ว</option>
        </select>
      </div>
      <div className="space-y-3">
        {filtered.map(tx => (
          <div key={tx.id} className="p-4 border rounded-lg flex justify-between items-center text-sm">
            <div><p className="font-bold">{tx.studentName} <span className="text-gray-400 font-normal">({tx.studentId})</span></p><p className="text-orange-600 mt-1">{tx.equipName}</p><p className="text-xs text-gray-500 mt-1">{new Date(tx.borrowDate).toLocaleString('th-TH')}</p></div>
            <div className="text-right">
               <span className={`px-2 py-1 text-xs rounded-full ${tx.status==='approved'?'bg-blue-100 text-blue-700':tx.status==='returned'?'bg-green-100 text-green-700':tx.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{tx.status}</span>
               {tx.returnRemarks && <p className="text-xs mt-2 text-gray-600">คืน: {tx.returnRemarks}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Camera Barcode Scanner Component ---
function CameraScanner({ onScan, onClose }) {
  useEffect(() => {
    let scanner = null;
    const initScanner = () => {
      setTimeout(() => {
        scanner = new window.Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
        scanner.render((decodedText) => { if (scanner) scanner.clear().catch(console.error); onScan(decodedText); }, () => {});
      }, 100);
    };
    if (!window.Html5QrcodeScanner) {
      const script = document.createElement('script'); script.src = 'https://unpkg.com/html5-qrcode'; script.async = true; script.onload = initScanner; document.head.appendChild(script);
    } else initScanner();
    return () => { if (scanner) scanner.clear().catch(console.error); };
  }, [onScan]);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-white p-4 rounded-xl w-full max-w-sm">
        <h3 className="font-bold mb-4 flex justify-between items-center">สแกนบาร์โค้ด <button onClick={onClose} className="text-red-500 bg-red-50 p-1 rounded-lg"><X className="w-5 h-5"/></button></h3>
        <div id="qr-reader" className="w-full overflow-hidden rounded-lg border-2"></div>
      </div>
    </div>
  );
}