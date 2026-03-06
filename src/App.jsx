import React, { useState, useEffect } from 'react';
import { 
  Book, 
  Calendar, 
  CheckCircle, 
  Clock, 
  GraduationCap, 
  LayoutDashboard, 
  Plus, 
  Trash2, 
  AlertCircle,
  X,
  Library,
  ChevronRight,
  Sparkles,
  Building2,
  Image as ImageIcon,
  Pencil,
  Menu
} from 'lucide-react';

// Importaciones de Firebase (Solo una vez)
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';

// 1. Configuración de TU proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCW3EecoPXlgteMDJ4zR-K2010ZUpardM0",
  authDomain: "mi-tracker-estudios.firebaseapp.com",
  projectId: "mi-tracker-estudios",
  storageBucket: "mi-tracker-estudios.firebasestorage.app",
  messagingSenderId: "747744092211",
  appId: "1:747744092211:web:102a30673557ed5a49c346"
};

// 2. Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "mi-tracker-personal"; // ID para tu base de datos personal

// --- DATOS INICIALES CON LOGO DE SINFRONTERAS AÑADIDO ---
const initialInstitutions = [
  { 
    id: 1, 
    name: 'Politécnico Grancolombiano', 
    program: 'Ingeniería Industrial', 
    hexColor: '#003656', // Azul Poli
    textColor: 'text-white',
    logoUrl: 'https://radcolombia.org/web/sites/default/files/archivos/instituciones/politecnico-grancolombiano/logo-pg.png' 
  },
  { 
    id: 2, 
    name: 'CUN', 
    program: 'Publicidad y Mercadeo', 
    hexColor: '#91DC00', // Verde CUN
    textColor: 'text-slate-900',
    logoUrl: 'https://www.corporacionfundate.org/wp-content/uploads/2025/12/logo-cun-2.png' 
  },
  { 
    id: 3, 
    name: 'Corp. SinFronteras', 
    program: 'Técnico en Marketing Digital', 
    hexColor: '#FFCD00', // Amarillo SinFronteras
    textColor: 'text-slate-900',
    logoUrl: 'https://corposinfronteras.edu.co/wp-content/uploads/2023/11/logo_corpo_2023.png.webp' // Logo actualizado
  },
  { 
    id: 4, 
    name: 'SENA', 
    program: 'Apps en la nube', 
    hexColor: '#00AF00', // Verde SENA
    textColor: 'text-white',
    logoUrl: 'https://oficinavirtualderadicacion.sena.edu.co/oficinavirtual/Resources/logoSenaNaranja.png' 
  }
];

const initialSubjects = [];

const initialTasks = [];

const InstitutionLogo = ({ url, name, className, fallbackSize = 24 }) => {
  const [error, setError] = useState(false);

  if (!url || error) {
    const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    return (
      <div className={`flex items-center justify-center font-black bg-slate-100 text-slate-800 rounded-lg ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <img 
      src={url} 
      alt={`Logo ${name}`} 
      onError={() => setError(true)}
      className={`object-contain ${className}`}
    />
  );
};

export default function App() {
  const [institutions, setInstitutions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // Estados para manejo de Usuarios y Carga de Nube
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [currentView, setCurrentView] = useState('dashboard');
  const [showInstModal, setShowInstModal] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(null);
  
  // Nuevo estado para la ventana de confirmación personalizada
  const [confirmAction, setConfirmAction] = useState(null);
  
  // Nuevo estado para el menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

 // --- AUTENTICACIÓN Y SINCRONIZACIÓN CON LA NUBE ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        // En tu app real, siempre usamos la entrada anónima directa
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Error de autenticación:", error);
        setIsAuthLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Conectar a la base de datos única de este usuario
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'studyData', 'main');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setInstitutions(data.institutions || []);
        setSubjects(data.subjects || []);
        setTasks(data.tasks || []);
      } else {
        // Inicializar base de datos si el usuario es nuevo
        setDoc(docRef, {
          institutions: initialInstitutions,
          subjects: initialSubjects,
          tasks: initialTasks
        });
      }
      setIsDataLoading(false);
    }, (error) => {
      console.error("Error al obtener datos:", error);
      setIsDataLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const currentInstitution = currentView.startsWith('inst_') 
    ? institutions.find(i => i.id === parseInt(currentView.split('_')[1])) 
    : null;
    
  // Función global para guardar en la nube
  const saveToFirebase = async (updates) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'studyData', 'main');
    await setDoc(docRef, updates, { merge: true });
  };

  const deleteInstitution = (id) => {
    setConfirmAction({
      message: '¿Estás seguro de eliminar esta institución? Se borrarán todas sus materias y tareas.',
      action: () => {
        const newInstitutions = institutions.filter(i => i.id !== id);
        const subjectsToDelete = subjects.filter(s => s.instId === id).map(s => s.id);
        const newSubjects = subjects.filter(s => s.instId !== id);
        const newTasks = tasks.filter(t => !subjectsToDelete.includes(t.subId));
        
        saveToFirebase({ institutions: newInstitutions, subjects: newSubjects, tasks: newTasks });
        if(currentView === `inst_${id}`) setCurrentView('dashboard');
      }
    });
  };

  const deleteSubject = (id) => {
    setConfirmAction({
      message: '¿Eliminar esta materia y todas sus tareas?',
      action: () => {
        const newSubjects = subjects.filter(s => s.id !== id);
        const newTasks = tasks.filter(t => t.subId !== id);
        saveToFirebase({ subjects: newSubjects, tasks: newTasks });
      }
    });
  };

  const toggleTaskStatus = (id) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveToFirebase({ tasks: newTasks });
  };

  const deleteTask = (id) => {
    const newTasks = tasks.filter(t => t.id !== id);
    saveToFirebase({ tasks: newTasks });
  };

  const DashboardView = () => {
    const upcomingTasks = [...tasks]
      .filter(t => !t.completed)
      .sort((a, b) => {
        // Ordenar primero por fecha y hora
        const dateA = new Date(`${a.dueDate}T${a.dueTime || '23:59'}`);
        const dateB = new Date(`${b.dueDate}T${b.dueTime || '23:59'}`);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }
        // Si empatan en fecha, ordenar alfabéticamente por nombre de la institución
        const instA = institutions.find(i => i.id === subjects.find(s => s.id === a.subId)?.instId);
        const instB = institutions.find(i => i.id === subjects.find(s => s.id === b.subId)?.instId);
        return (instA?.name || '').localeCompare(instB?.name || '');
      });

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center">
            Panel de Control <Sparkles className="ml-2 text-amber-400" size={28} />
          </h2>
          <p className="text-slate-500 mt-1 text-lg">Resumen global de tus instituciones.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-5">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Library size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Instituciones</p>
              <p className="text-3xl font-black text-slate-800">{institutions.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-5">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Book size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Materias</p>
              <p className="text-3xl font-black text-slate-800">{subjects.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-5">
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
              <AlertCircle size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pendientes</p>
              <p className="text-3xl font-black text-slate-800">{upcomingTasks.length}</p>
            </div>
          </div>
        </div>

        {/* NUEVA SECCIÓN: Conteo de pendientes por institución */}
        <div className="flex flex-wrap gap-3 mb-8">
          {institutions.map(inst => {
            const instSubjects = subjects.filter(s => s.instId === inst.id).map(s => s.id);
            const pendingCount = tasks.filter(t => !t.completed && instSubjects.includes(t.subId)).length;
            return (
              <div key={inst.id} className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-3 transition-transform hover:-translate-y-0.5">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: inst.hexColor }}></div>
                <span className="text-sm font-bold text-slate-700">{inst.name}</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-md ${pendingCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                  {pendingCount}
                </span>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xl font-bold text-slate-800">Próximos Entregables</h3>
          </div>
          
          {upcomingTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-500" size={40} />
              </div>
              <p className="text-lg font-medium text-slate-600">¡Todo al día!</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingTasks.map(task => {
                const subject = subjects.find(s => s.id === task.subId);
                const institution = institutions.find(i => i.id === subject?.instId);
                
                return (
                  <li key={task.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <button onClick={() => toggleTaskStatus(task.id)} className="mt-1 text-slate-300 hover:text-green-500 transition-colors">
                        <CheckCircle size={24} />
                      </button>
                      <div>
                        <p className="font-bold text-slate-800 text-lg">{task.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-medium">
                          {/* Aplicando el color de texto dinámicamente como clase */}
                          <span 
                            className={`px-2.5 py-1 rounded-md shadow-sm border border-black/5 ${institution?.textColor || 'text-slate-900'}`}
                            style={{ backgroundColor: institution?.hexColor || '#eee' }}
                          >
                            {institution?.name}
                          </span>
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md flex items-center gap-1">
                            <Book size={12} /> {subject?.name}
                          </span>
                          <span className={`px-2.5 py-1 rounded-md ${
                            task.type === 'Examen' ? 'bg-rose-100 text-rose-700' : 
                            task.type === 'Proyecto' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {task.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex flex-col sm:items-end pl-10 sm:pl-0">
                      <div className="flex items-center text-sm font-bold text-rose-500 mb-1 bg-rose-50 px-3 py-1 rounded-lg w-fit sm:w-auto">
                        <Calendar size={16} className="mr-1.5" />
                        {task.dueDate}
                      </div>
                      <div className="flex items-center text-xs font-medium text-slate-500 mt-1">
                        <Clock size={14} className="mr-1.5" />
                        {task.dueTime}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  };

  const InstitutionView = ({ institution }) => {
    const instSubjects = subjects.filter(s => s.instId === institution.id);
    const [editingTaskId, setEditingTaskId] = useState(null);

    const NewSubjectForm = () => {
      const [name, setName] = useState('');
      const [day, setDay] = useState('Lunes');
      const [time, setTime] = useState('');
      const [teacher, setTeacher] = useState('');
      const [groupNumber, setGroupNumber] = useState('');

      const handleSubmit = (e) => {
        e.preventDefault();
        if(!name) return;
        const newSubjects = [...subjects, { id: Date.now(), instId: institution.id, name, scheduleDay: day, scheduleTime: time, teacher, groupNumber }];
        saveToFirebase({ subjects: newSubjects });
        setShowSubjectForm(null);
      };

      return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 animate-in slide-in-from-top-4 duration-300">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center text-lg">
            <div className="bg-slate-100 p-1.5 rounded-lg text-slate-600 mr-2"><Plus size={18}/></div>
            Agregar Nueva Materia
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nombre de la materia</label>
              <input type="text" className="bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 p-2.5 rounded-xl w-full outline-none" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Profesor (Opcional)</label>
              <input type="text" placeholder="Nombre del docente" className="bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 p-2.5 rounded-xl w-full outline-none" value={teacher} onChange={e => setTeacher(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">No. Ficha / Grupo</label>
              <input type="text" placeholder="Ej: 51102" className="bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 p-2.5 rounded-xl w-full outline-none" value={groupNumber} onChange={e => setGroupNumber(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Día de clase</label>
              <select className="bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 p-2.5 rounded-xl w-full outline-none" value={day} onChange={e => setDay(e.target.value)}>
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Horario</label>
              <input type="text" placeholder="Ej: 18:00 - 20:00" className="bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 p-2.5 rounded-xl w-full outline-none" value={time} onChange={e => setTime(e.target.value)} required />
            </div>
          </div>
          <div className="mt-5 flex justify-end space-x-3">
            <button type="button" onClick={() => setShowSubjectForm(null)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" className="px-5 py-2 font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all">Guardar Materia</button>
          </div>
        </form>
      );
    };

    const TaskForm = ({ subjectId, initialData, onClose }) => {
      const [title, setTitle] = useState(initialData?.title || '');
      const [type, setType] = useState(initialData?.type || 'Taller');
      const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
      const [dueTime, setDueTime] = useState(initialData?.dueTime || '');
      const [observations, setObservations] = useState(initialData?.observations || '');

      const handleSubmit = (e) => {
        e.preventDefault();
        if(!title || !dueDate) return;
        
        // Calcular fecha de notificación (3 días antes de la entrega final)
        const due = new Date(`${dueDate}T00:00:00`);
        const notifDate = new Date(due);
        notifDate.setDate(notifDate.getDate() - 3);
        const notificationDate = notifDate.toISOString().split('T')[0];

        let newTasks;
        if (initialData) {
          // Actualizar tarea existente
          newTasks = tasks.map(t => t.id === initialData.id ? { ...t, title, type, dueDate, dueTime, observations, notificationDate } : t);
        } else {
          // Crear nueva tarea
          newTasks = [...tasks, { 
            id: Date.now(), 
            subId: subjectId, 
            title, 
            type, 
            dueDate, 
            dueTime, 
            observations,
            notificationDate,
            completed: false 
          }];
        }
        
        saveToFirebase({ tasks: newTasks });
        onClose();
      };

      return (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 text-sm animate-in zoom-in-95 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Título del Pendiente</label>
              <input type="text" placeholder="Ej: Ensayo final" className="border border-slate-200 p-2 rounded-lg w-full outline-none focus:border-slate-400" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
              <select className="border border-slate-200 p-2 rounded-lg w-full outline-none focus:border-slate-400" value={type} onChange={e => setType(e.target.value)}>
                <option value="Parcial">Parcial</option>
                <option value="Quiz">Quiz</option>
                <option value="Taller">Taller</option>
                <option value="Foro">Foro</option>
                <option value="ACA">ACA</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha Final</label>
              <input type="date" className="border border-slate-200 p-2 rounded-lg w-full outline-none focus:border-slate-400" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Hora Límite</label>
              <input type="time" className="border border-slate-200 p-2 rounded-lg w-full outline-none focus:border-slate-400" value={dueTime} onChange={e => setDueTime(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Observaciones</label>
              <textarea placeholder="Detalles adicionales, links, instrucciones..." className="border border-slate-200 p-2 rounded-lg w-full outline-none focus:border-slate-400 resize-none h-16" value={observations} onChange={e => setObservations(e.target.value)} />
              <p className="text-[10px] text-slate-400 mt-1">* Se generará una alerta de estudio 3 días antes de la fecha final.</p>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 font-medium text-slate-500 hover:bg-slate-200 rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-1.5 font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-900">
              {initialData ? 'Guardar Cambios' : 'Agregar Pendiente'}
            </button>
          </div>
        </form>
      );
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* CABECERA CORREGIDA: color aplicado como clase para respetar el text-white */}
        <div 
          className={`p-8 md:p-10 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${institution.textColor}`}
          style={{ 
            backgroundColor: institution.hexColor,
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.25) 100%)'
          }}
        >
          {/* BOTÓN ELIMINAR en la esquina superior derecha */}
          <button 
            onClick={() => deleteInstitution(institution.id)} 
            className="absolute top-4 right-4 z-20 p-2 bg-black/10 hover:bg-rose-500 hover:text-white rounded-full backdrop-blur-sm transition-all shadow-sm border border-black/5" 
            title="Eliminar Institución"
          >
            <Trash2 size={16} />
          </button>

          {/* Fondo texturizado original */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay z-0"></div>
          
          {/* LOGO COMO MARCA DE AGUA CONDICIONAL */}
          {institution.logoUrl && (
            <div 
              className={`absolute right-0 top-0 bottom-0 w-2/3 md:w-1/2 lg:w-1/3 z-0 pointer-events-none ${institution.id === 3 ? 'opacity-40' : 'opacity-60'}`}
            >
              <img 
                src={institution.logoUrl} 
                alt="Logo Watermark" 
                className={`w-full h-full object-contain object-right py-4 pr-4 md:pr-8 ${institution.id === 3 ? '' : 'brightness-0 invert'}`}
              />
            </div>
          )}
          
          <div className="relative z-10 flex items-center gap-6 mt-2 md:mt-0 pr-8">
            {/* El cuadro del logo se eliminó para dejar solo el texto */}
            <div>
              <span className="bg-black/10 backdrop-blur-md border border-white/10 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
                Institución Educativa
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2 drop-shadow-sm pr-12 md:pr-0">
                {institution.name}
              </h2>
              <p className="opacity-90 text-lg font-medium flex items-center drop-shadow-sm">
                <GraduationCap className="mr-2" size={22} /> {institution.program}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 flex items-center tracking-tight">
              <Book className="mr-3 text-slate-400" size={28} /> Mis Materias
            </h3>
          </div>
          <button 
            onClick={() => setShowSubjectForm(institution.id)} 
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-transform hover:-translate-y-0.5 flex items-center border border-black/10 ${institution.textColor}`}
            style={{ 
              backgroundColor: institution.hexColor,
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)'
            }}
          >
            <Plus size={18} className="mr-2" /> Agregar Materia
          </button>
        </div>

        {showSubjectForm === institution.id && <NewSubjectForm />}

        {instSubjects.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-[2rem] p-16 text-center text-slate-500 shadow-sm">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <Book className="text-slate-300" size={40} />
            </div>
            <p className="text-xl font-medium text-slate-700 mb-2">Aún no hay materias</p>
            <p className="text-sm">Empieza agregando tu primera clase.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {instSubjects.map(subject => {
              const subjectTasks = tasks.filter(t => t.subId === subject.id);
              return (
                <div key={subject.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-xl text-slate-800 tracking-tight">{subject.name}</h4>
                      
                      {/* DATOS DEL PROFESOR Y FICHA */}
                      {(subject.teacher || subject.groupNumber) && (
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm font-medium text-slate-500">
                          {subject.teacher && <span>👨‍🏫 {subject.teacher}</span>}
                          {subject.groupNumber && <span>📌 Ficha: {subject.groupNumber}</span>}
                        </div>
                      )}

                      <div className="flex items-center text-sm font-medium text-slate-500 mt-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 w-fit shadow-sm">
                        <Calendar size={16} className="mr-2 text-slate-400" /> {subject.scheduleDay}
                        <span className="mx-3 text-slate-300">|</span>
                        <Clock size={16} className="mr-2 text-slate-400" /> {subject.scheduleTime}
                      </div>
                    </div>
                    {/* BOTÓN ELIMINAR MATERIA MEJORADO */}
                    <button 
                      onClick={() => deleteSubject(subject.id)} 
                      className="p-2.5 text-slate-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all shadow-sm border border-transparent hover:border-rose-600"
                      title="Eliminar Materia"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                  
                  <div className="p-6 flex-grow">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pendientes</span>
                      <button onClick={() => setShowTaskForm(subject.id)} className="text-sm font-semibold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors flex items-center">
                        <Plus size={16} className="mr-1"/> Añadir
                      </button>
                    </div>

                    {showTaskForm === subject.id && <TaskForm subjectId={subject.id} onClose={() => setShowTaskForm(null)} />}

                    {subjectTasks.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-2">
                        <p className="text-sm text-slate-400 font-medium">Libre de tareas por ahora ☕</p>
                      </div>
                    ) : (
                      <ul className="space-y-3 mt-4">
                        {subjectTasks.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)).map(task => {
                          // Si esta tarea se está editando, mostramos el formulario
                          if (editingTaskId === task.id) {
                            return <TaskForm key={task.id} subjectId={subject.id} initialData={task} onClose={() => setEditingTaskId(null)} />;
                          }

                          // Lógica para el estado de alerta según días restantes
                          const todayDate = new Date();
                          todayDate.setHours(0,0,0,0);
                          const dueDateObj = new Date(`${task.dueDate}T00:00:00`);
                          const diffTime = dueDateObj - todayDate;
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          let alertStatus = 'none';
                          if (!task.completed) {
                            if (diffDays <= 3) alertStatus = 'danger';
                            else if (diffDays <= 6) alertStatus = 'warning';
                            else alertStatus = 'success';
                          }

                          return (
                            <li key={task.id} className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${task.completed ? 'bg-slate-50 border-transparent opacity-70' : alertStatus === 'danger' ? 'bg-rose-50 border-rose-300 shadow-sm' : alertStatus === 'warning' ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-emerald-50 border-emerald-300 shadow-sm'}`}>
                              <div className="flex items-start space-x-3 overflow-hidden mt-0.5">
                                <button onClick={() => toggleTaskStatus(task.id)} className="flex-shrink-0 mt-1">
                                  {task.completed ? 
                                    <CheckCircle size={22} className="text-emerald-500" /> : 
                                    <div className={`w-[22px] h-[22px] rounded-full border-2 transition-colors ${alertStatus === 'danger' ? 'border-rose-400 hover:border-rose-600 bg-white' : alertStatus === 'warning' ? 'border-amber-400 hover:border-amber-600 bg-white' : 'border-emerald-400 hover:border-emerald-600 bg-white'}`}></div>
                                  }
                                </button>
                                <div className="flex flex-col">
                                  <span className={`text-sm font-bold flex items-center gap-2 ${task.completed ? 'line-through text-slate-400' : alertStatus === 'danger' ? 'text-rose-900' : alertStatus === 'warning' ? 'text-amber-900' : 'text-emerald-900'}`}>
                                    {task.title}
                                    {alertStatus === 'danger' && <AlertCircle size={14} className="text-rose-600 animate-pulse" title="¡Se acerca la entrega!" />}
                                    {alertStatus === 'warning' && <AlertCircle size={14} className="text-amber-500" title="Entrega en los próximos días" />}
                                  </span>
                                  {task.observations && (
                                    <p className={`text-xs mt-1 line-clamp-2 leading-tight ${task.completed ? 'text-slate-300' : alertStatus === 'danger' ? 'text-rose-700/80' : alertStatus === 'warning' ? 'text-amber-700/80' : 'text-emerald-700/80'}`}>
                                      {task.observations}
                                    </p>
                                  )}
                                  <span className={`text-[10px] w-fit font-bold uppercase tracking-wider mt-1.5 px-1.5 py-0.5 rounded ${
                                    alertStatus === 'danger' ? 'bg-rose-200 text-rose-800' :
                                    alertStatus === 'warning' ? 'bg-amber-200 text-amber-800' :
                                    alertStatus === 'success' ? 'bg-emerald-200 text-emerald-800' :
                                    task.type==='Parcial' ? 'bg-rose-100 text-rose-600' : 
                                    task.type==='Quiz' ? 'bg-amber-100 text-amber-600' : 
                                    task.type==='Foro' ? 'bg-emerald-100 text-emerald-600' : 
                                    task.type==='ACA' ? 'bg-purple-100 text-purple-600' : 
                                    'bg-blue-100 text-blue-600'
                                  }`}>
                                    {task.type}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${task.completed ? 'bg-slate-100 text-slate-400' : alertStatus === 'danger' ? 'bg-rose-600 text-white shadow-sm' : alertStatus === 'warning' ? 'bg-amber-500 text-white shadow-sm' : 'bg-emerald-500 text-white shadow-sm'} whitespace-nowrap`}>
                                  {task.dueDate.substring(5)}
                                </span>
                                <div className="flex space-x-1 mt-1">
                                  <button onClick={() => setEditingTaskId(task.id)} className={`p-1.5 rounded-md transition-colors ${alertStatus === 'danger' ? 'text-rose-400 hover:text-rose-600 hover:bg-rose-100' : alertStatus === 'warning' ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-100' : alertStatus === 'success' ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100' : 'text-slate-300 hover:text-blue-500 hover:bg-blue-50'}`} title="Editar pendiente">
                                    <Pencil size={16}/>
                                  </button>
                                  <button onClick={() => deleteTask(task.id)} className={`p-1.5 rounded-md transition-colors ${alertStatus === 'danger' ? 'text-rose-400 hover:text-rose-600 hover:bg-rose-100' : alertStatus === 'warning' ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-100' : alertStatus === 'success' ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`} title="Eliminar pendiente">
                                    <X size={16}/>
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const AddInstitutionModal = () => {
    const [name, setName] = useState('');
    const [program, setProgram] = useState('');
    const [hexColor, setHexColor] = useState('#0f172a');
    const [logoUrl, setLogoUrl] = useState('');

    const isColorDark = (color) => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      return brightness < 128;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if(!name) return;
      const textColor = isColorDark(hexColor) ? 'text-white' : 'text-slate-900';
      const newInst = { id: Date.now(), name, program, hexColor, textColor, logoUrl };
      const newInstitutions = [...institutions, newInst];
      
      saveToFirebase({ institutions: newInstitutions });
      setShowInstModal(false);
      setCurrentView(`inst_${newInst.id}`);
    };

    if(!showInstModal) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-extrabold text-xl text-slate-800">Nueva Institución</h3>
            <button onClick={() => setShowInstModal(false)} className="text-slate-400 hover:text-slate-800 bg-white p-2 rounded-full shadow-sm border border-slate-100 transition-all"><X size={20}/></button>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Institución</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-slate-400 p-3 rounded-xl outline-none" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Programa / Carrera</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-slate-400 p-3 rounded-xl outline-none" value={program} onChange={e => setProgram(e.target.value)} />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Color Marca (HEX)</label>
                <div className="flex items-center gap-2">
                  <input type="color" className="h-10 w-10 rounded cursor-pointer border-0 p-0" value={hexColor} onChange={e => setHexColor(e.target.value)} />
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-slate-400 p-2.5 rounded-xl outline-none font-mono text-sm" value={hexColor} onChange={e => setHexColor(e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><ImageIcon size={14}/> URL del Logo (Opcional)</label>
              <input type="url" placeholder="https://ejemplo.com/logo.png" className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-slate-400 p-3 rounded-xl outline-none text-sm" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
            </div>

            <div className="pt-6 flex justify-end space-x-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowInstModal(false)} className="px-5 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
              <button type="submit" className="px-6 py-2.5 font-bold text-white bg-slate-800 hover:bg-slate-900 shadow-md rounded-xl transition-all">Crear Institución</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Pantalla de carga mientras se sincroniza el usuario con la nube
  if (isAuthLoading || (user && isDataLoading)) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center font-sans selection:bg-indigo-100 selection:text-indigo-900">
        <div className="bg-slate-800 p-5 rounded-[2rem] text-white shadow-2xl animate-bounce mb-6 border-4 border-slate-100">
          <GraduationCap size={48} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sincronizando Workspace</h2>
        <p className="text-sm font-medium text-slate-500 mt-2">Cargando tu información segura en la nube...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 font-sans flex overflow-hidden text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* OVERLAY PARA MÓVILES */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-slate-200/60 flex flex-col shadow-2xl md:shadow-sm transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-slate-800 p-2.5 rounded-xl text-white mr-3 shadow-md">
              <GraduationCap size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">StudyTracker</h1>
          </div>
          {/* Botón cerrar en móvil */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 md:p-5 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 flex flex-col">
          <div className="mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-3">General</p>
            <button 
              onClick={() => {
                setCurrentView('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}
            >
              <LayoutDashboard size={20} className={currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>Panel Principal</span>
            </button>
          </div>

          <div>
            <div className="space-y-1.5">
              {(() => {
                // Función para calcular la urgencia de cada institución
                const getInstitutionUrgency = (instId) => {
                  const instSubjects = subjects.filter(s => s.instId === instId).map(s => s.id);
                  const instTasks = tasks.filter(t => !t.completed && instSubjects.includes(t.subId));
                  if (instTasks.length === 0) return Infinity; // Si no hay pendientes, va al final
                  return Math.min(...instTasks.map(t => new Date(`${t.dueDate}T${t.dueTime || '23:59'}`).getTime()));
                };
                
                // Ordenar instituciones dinámicamente (y alfabéticamente si hay empate)
                const sortedInstitutions = [...institutions].sort((a, b) => {
                  const urgencyA = getInstitutionUrgency(a.id);
                  const urgencyB = getInstitutionUrgency(b.id);
                  if (urgencyA !== urgencyB) return urgencyA - urgencyB;
                  return a.name.localeCompare(b.name);
                });

                return sortedInstitutions.map(inst => {
                  const instSubjects = subjects.filter(s => s.instId === inst.id).map(s => s.id);
                  const pendingCount = tasks.filter(t => !t.completed && instSubjects.includes(t.subId)).length;

                  return (
                    <button 
                      key={inst.id}
                      onClick={() => {
                        setCurrentView(`inst_${inst.id}`);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all duration-200 group ${currentView === `inst_${inst.id}` ? 'bg-slate-100 font-bold shadow-sm' : 'hover:bg-slate-50 font-medium'}`}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-black/5 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                           <InstitutionLogo url={inst.logoUrl} name={inst.name} className="w-full h-full" fallbackSize={12} />
                        </div>
                        <span className="truncate text-sm text-slate-700 group-hover:text-slate-900 transition-colors">{inst.name}</span>
                        {pendingCount > 0 && (
                          <span className="bg-rose-100 text-rose-600 text-[10px] font-black px-1.5 py-0.5 rounded-md ml-1 shadow-sm">
                            {pendingCount}
                          </span>
                        )}
                      </div>
                      <ChevronRight size={16} className={`opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 ${currentView === `inst_${inst.id}` ? 'text-slate-400 opacity-100 translate-x-0' : 'text-slate-300'}`} />
                    </button>
                  );
                });
              })()}
              
              <button onClick={() => { setShowInstModal(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all font-medium border border-dashed border-transparent hover:border-slate-300 mt-4">
                <Plus size={18} className="text-slate-400" />
                <span className="text-sm">Añadir Institución</span>
              </button>
            </div>
          </div>

          {/* NUEVO: SECCIÓN DE USUARIO LOGUEADO */}
          <div className="mt-auto pt-5 border-t border-slate-100 flex-shrink-0">
            <div className="flex items-center space-x-3 px-3 py-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black shadow-inner">
                {user?.uid ? user.uid.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-slate-800">Mi Sesión Segura</span>
                <span className="text-[10px] text-slate-400 font-mono truncate" title={user?.uid}>
                  {user?.uid ? `ID: ${user.uid.substring(0, 10)}...` : 'Invitado'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50/50">
        
        {/* CABECERA MÓVIL (Solo visible en pantallas pequeñas) */}
        <div className="md:hidden bg-white/90 backdrop-blur-md sticky top-0 z-30 px-5 py-3 border-b border-slate-200/60 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1.5 rounded-lg text-white shadow-sm">
              <GraduationCap size={20} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">StudyTracker</h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* ÁREA DESLIZABLE */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 md:p-10 lg:p-12 scroll-smooth">
          <div className="max-w-5xl mx-auto pb-20 md:pb-0">
            {currentView === 'dashboard' ? <DashboardView /> : currentInstitution && <InstitutionView institution={currentInstitution} />}
          </div>
        </div>
      </main>

      <AddInstitutionModal />
      
      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmAction && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmar Acción</h3>
            <p className="text-slate-600 text-sm mb-6">{confirmAction.message}</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors">Cancelar</button>
              <button onClick={() => { confirmAction.action(); setConfirmAction(null); }} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-colors shadow-sm">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}