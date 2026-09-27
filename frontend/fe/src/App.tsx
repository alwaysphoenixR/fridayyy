import { Routes, Route } from 'react-router-dom';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { ContentDetail } from './pages/ContentDetail';
import { Search } from './pages/Search';
import { PublicBrain } from './pages/PublicBrain';
import { Landing } from './pages/Landing';
import { NotFound } from './pages/NotFound';
import { AuthGuard } from './components/AuthGuard';
import { Layout } from './components/Layout';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-background text-on-background font-sans">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/share/brain/:brainLink" element={<PublicBrain />} />
        
        {/* Protected Routes */}
        <Route element={<AuthGuard />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/content/:id" element={<ContentDetail />} />
          </Route>
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
