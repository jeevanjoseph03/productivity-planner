import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Check, BookOpen, Clock, 
  List, Target, Sun, Moon, Bell, BellOff, LogOut, User, Loader,
  Flame, Sparkles, X
} from 'lucide-react';

// --- FIXED: Import from your firebase.js file ---
import { auth, db } from './firebase';

import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut, onAuthStateChanged 
} from "firebase/auth";
import { 
  doc, setDoc, getDoc, onSnapshot
} from "firebase/firestore";

// Use a static App ID for your personal project
const appId = 'productivity-app-v1';

// API Key for Gemini (Reads from .env)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;


// --- UI Components ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, color = "text-gray-800", action }) => (
  <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
    <div className="flex items-center gap-2">
      <Icon size={20} className={color} />
      <h2 className="font-bold text-lg text-gray-800">{title}</h2>
    </div>
    {action && <div>{action}</div>}
  </div>
);

const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sun size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Productivity Planner</h1>
          <p className="text-gray-500">Plan your tomorrow, today.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
          >
            {loading && <Loader className="animate-spin" size={18} />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-500 hover:text-blue-600 font-medium"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Data States
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  
  const [priorities, setPriorities] = useState(['', '', '']);
  const [studySessions, setStudySessions] = useState([]);
  const [schedule, setSchedule] = useState(() => {
    const slots = [];
    for (let i = 6; i <= 23; i++) slots.push({ time: `${i}:00`, task: '' });
    slots.push({ time: `00:00`, task: '' });
    return slots;
  });
  const [todos, setTodos] = useState([]);
  const [notes, setNotes] = useState('');
  
  // Meta States
  const [dataLoaded, setDataLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);

  // Input States
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newTodo, setNewTodo] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // --- Auth & Init ---
  useEffect(() => {
    // Standard Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Streak Logic ---
  useEffect(() => {
    if (!user) return;

    const checkStreak = async () => {
      const statsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'stats', 'streak');
      const today = new Date().toISOString().split('T')[0];
      
      try {
        const docSnap = await getDoc(statsRef);
        let currentStreak = 0;
        let lastLogin = '';

        if (docSnap.exists()) {
          const data = docSnap.data();
          currentStreak = data.currentStreak || 0;
          lastLogin = data.lastLogin || '';
        }

        if (lastLogin !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastLogin === yesterdayStr) {
            currentStreak += 1;
          } else if (lastLogin !== today) {
            currentStreak = 1;
          }
          
          await setDoc(statsRef, {
            currentStreak,
            lastLogin: today
          });
        }
        
        setStreak(currentStreak);
      } catch (err) {
        console.error("Error with streaks:", err);
      }
    };

    checkStreak();
  }, [user]);

  // --- Firestore Listener ---
  useEffect(() => {
    if (!user) return;
    
    setDataLoaded(false);
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'plans', date);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPriorities(data.priorities || ['', '', '']);
        setStudySessions(data.studySessions || []);
        if (data.schedule) setSchedule(data.schedule);
        setTodos(data.todos || []);
        setNotes(data.notes || '');
      } else {
        setPriorities(['', '', '']);
        setStudySessions([]);
        setTodos([]);
        setNotes('');
        const slots = [];
        for (let i = 6; i <= 23; i++) slots.push({ time: `${i}:00`, task: '' });
        slots.push({ time: `00:00`, task: '' });
        setSchedule(slots);
      }
      setDataLoaded(true);
    }, (error) => console.error("Error fetching document:", error));

    return () => unsubscribe();
  }, [user, date]);

  // --- Auto-Save ---
  useEffect(() => {
    if (!user || !dataLoaded) return;

    const saveData = async () => {
      setSaving(true);
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'plans', date);
        await setDoc(docRef, {
          priorities,
          studySessions,
          schedule,
          todos,
          notes,
          lastUpdated: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error saving", err);
      } finally {
        setTimeout(() => setSaving(false), 500);
      }
    };

    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);

  }, [priorities, studySessions, schedule, todos, notes, user, date, dataLoaded]);

  // --- AI Analysis Logic ---
  const handleAIAnalysis = async () => {
    if (!notes.trim()) return alert("Please write something in the Brain Dump first!");
    
    setAnalyzing(true);
    setAiSuggestions([]);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analyze the following unstructured notes and extract a list of actionable short to-do items. Return ONLY a valid JSON array of strings (e.g. ["Buy milk", "Study math"]). Notes: "${notes}"`
              }]
            }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const suggestions = JSON.parse(text);
        setAiSuggestions(suggestions);
      }
    } catch (err) {
      console.error("AI Error:", err);
      alert("AI Analysis failed. Check your API key in .env");
    } finally {
      setAnalyzing(false);
    }
  };

  const acceptSuggestion = (text) => {
    setTodos(prev => [...prev, { id: Date.now(), text, completed: false }]);
    setAiSuggestions(prev => prev.filter(s => s !== text));
  };

  // --- Notification Logic ---
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!notificationsEnabled) return;
      const now = new Date();
      if (now.getMinutes() === 0) {
        const timeString = `${now.getHours()}:00`;
        const slot = schedule.find(s => {
            if (s.time === '00:00' && now.getHours() === 0) return true;
            return s.time === timeString;
        });
        if (slot && slot.task?.trim()) {
           new Notification(`Planner: ${slot.time}`, { body: slot.task });
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [schedule, notificationsEnabled]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return alert("Not supported on this browser.");
    const permission = await Notification.requestPermission();
    if (permission === 'granted') setNotificationsEnabled(true);
  };

  // --- Handlers ---
  const handlePriorityChange = (index, value) => {
    const newPriorities = [...priorities];
    newPriorities[index] = value;
    setPriorities(newPriorities);
  };
  const addStudySession = () => {
    if (!newSubject.trim()) return;
    setStudySessions([...studySessions, { id: Date.now(), subject: newSubject, topic: newTopic, completed: false }]);
    setNewSubject(''); setNewTopic('');
  };
  const toggleStudySession = (id) => setStudySessions(studySessions.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  const deleteStudySession = (id) => setStudySessions(studySessions.filter(s => s.id !== id));
  const updateSchedule = (index, value) => {
    const newSchedule = [...schedule];
    newSchedule[index].task = value;
    setSchedule(newSchedule);
  };
  const addTodo = (e) => {
    if (e.key === 'Enter' && newTodo.trim()) {
      setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);
      setNewTodo('');
    }
  };
  const toggleTodo = (id) => setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTodo = (id) => setTodos(todos.filter(t => t.id !== id));
  const handleLogout = () => signOut(auth);

  if (loadingUser) return <div className="h-screen flex items-center justify-center"><Loader className="animate-spin text-blue-600" /></div>;
  if (!user) return <AuthScreen />;

  const totalTasks = studySessions.length + todos.length;
  const completedTasks = studySessions.filter(s => s.completed).length + todos.filter(t => t.completed).length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-3 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sun className="text-yellow-500" /> Cloud Planner
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold border border-orange-100" title="Days in a row">
                <Flame size={12} className={streak > 0 ? "fill-orange-500 text-orange-600" : "text-gray-400"} /> 
                {streak} Day Streak
              </div>
              <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <User size={10} /> {user.email}
              </span>
              {saving ? (
                <span className="text-xs text-gray-400 flex items-center gap-1"><Loader size={10} className="animate-spin" /> Saving...</span>
              ) : (
                <span className="text-xs text-green-600 flex items-center gap-1"><Check size={10} /> Synced</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={requestNotificationPermission}
              className={`p-2 rounded-lg transition-colors ${notificationsEnabled ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}
              title="Notifications"
            >
              {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
            </button>

            <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg grow md:grow-0">
              <span className="text-xs md:text-sm font-medium text-gray-600 hidden sm:inline">Date:</span>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent font-semibold outline-none text-gray-800 text-sm w-full md:w-auto"
              />
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-2 hover:bg-red-50 rounded-lg transition-colors ml-auto md:ml-0"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Progress Bar */}
        {totalTasks > 0 && (
          <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-gray-600">Productivity Forecast</span>
              <span className="text-blue-600">{progress}% Planned Completion</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-6 order-2 md:order-1">
            
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
              <SectionHeader icon={Target} title="Top 3 Priorities" color="text-blue-600" />
              <div className="space-y-3">
                {priorities.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">{i + 1}</div>
                    <input
                      type="text" placeholder={`Priority #${i + 1}`} value={p}
                      onChange={(e) => handlePriorityChange(i, e.target.value)}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-3 md:py-2 focus:ring-2 focus:ring-blue-300 shadow-sm text-sm md:text-base outline-none"
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeader icon={BookOpen} title="Study Plan" color="text-indigo-600" />
              <div className="flex flex-col sm:flex-row gap-3 md:gap-2 mb-6">
                <input type="text" placeholder="Subject" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300" />
                <input type="text" placeholder="Topic" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300" />
                <button onClick={addStudySession} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-1 font-medium"><Plus size={18} /> Add</button>
              </div>
              <div className="space-y-2">
                {studySessions.map((session) => (
                  <div key={session.id} className={`flex items-center justify-between p-3 rounded-lg border ${session.completed ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleStudySession(session.id)} className={`w-5 h-5 rounded border flex items-center justify-center ${session.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300'}`}>{session.completed && <Check size={12} />}</button>
                      <div className={session.completed ? 'opacity-50 line-through' : ''}>
                        <span className="font-bold text-gray-700 block text-sm">{session.subject}</span>
                        {session.topic && <span className="text-xs text-gray-500">{session.topic}</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteStudySession(session.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeader 
                icon={Moon} 
                title="Brain Dump" 
                color="text-purple-600" 
                action={
                  <button 
                    onClick={handleAIAnalysis}
                    disabled={analyzing || !notes.trim()}
                    className="flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 disabled:opacity-50 transition-colors"
                  >
                    {analyzing ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {analyzing ? 'Thinking...' : 'Analyze & Suggest'}
                  </button>
                }
              />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Type everything on your mind here. Then click 'Analyze' to convert it into tasks!" className="w-full h-32 p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-300 resize-none text-sm"></textarea>
              
              {aiSuggestions.length > 0 && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-purple-800 flex items-center gap-2"><Sparkles size={14} /> AI Suggestions</h3>
                    <button onClick={() => setAiSuggestions([])} className="text-purple-400 hover:text-purple-600"><X size={14} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.map((suggestion, idx) => (
                      <button 
                        key={idx}
                        onClick={() => acceptSuggestion(suggestion)}
                        className="flex items-center gap-1 text-xs bg-white text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all shadow-sm"
                      >
                        <Plus size={12} /> {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="md:col-span-5 space-y-6 order-1 md:order-2">
            <Card className="h-fit">
              <SectionHeader icon={Clock} title="Schedule" color="text-orange-500" />
              <div className="space-y-1 max-h-[50vh] md:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {schedule.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm group">
                    <span className="w-12 font-mono text-gray-500 text-right shrink-0">{slot.time}</span>
                    <input type="text" value={slot.task} onChange={(e) => updateSchedule(index, e.target.value)} placeholder="-" className="flex-1 bg-gray-50 border-b border-transparent focus:bg-white focus:border-orange-300 px-2 py-1 rounded outline-none" />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeader icon={List} title="To-Dos" color="text-emerald-600" />
              <div className="flex gap-2 mb-4">
                <input type="text" placeholder="Add task..." value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={addTodo} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300 text-sm" />
                <button onClick={() => addTodo({ key: 'Enter' })} className="bg-emerald-600 text-white px-3 rounded-lg"><Plus size={18} /></button>
              </div>
              <div className="space-y-2">
                {todos.map((todo) => (
                  <div key={todo.id} className="flex items-center justify-between group py-1">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleTodo(todo.id)} className={`w-5 h-5 rounded border flex items-center justify-center ${todo.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}>{todo.completed && <Check size={12} />}</button>
                      <span className={`text-sm ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{todo.text}</span>
                    </div>
                    <button onClick={() => deleteTodo(todo.id)} className="text-gray-300 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
      `}</style>
    </div>
  );
}